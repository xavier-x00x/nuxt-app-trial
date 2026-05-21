<script setup lang="ts">
const props = defineProps<{
  xwidth?: string;
  xclass?: string;
  xorder?: string;
}>();

const thAttrs = computed(() => {
  const classes = props.xorder ? ["p-0"] : [];
  if (props.xclass) {
    classes.push(props.xclass);
  }

  const attrs: { class?: string; width?: string; "data-order"?: string } = {
    class: classes.join(" ") || undefined,
  };

  if (props.xorder) {
    attrs["data-order"] = props.xorder;
  }
  if (props.xwidth) {
    attrs.width = props.xwidth;
  }

  return attrs;
});

const spAttrs = computed(() => {
  const cls = ["flex-fill"];
  if (props.xclass?.includes("text-center")) {
    cls.push("ps-3");
  }
  return { class: cls.join(" ") };
});
</script>

<template>
  <th v-if="xorder" scope="col" v-bind="thAttrs">
    <button
      class="w-100 ms-0 table-sort d-flex align-items-center"
      type="button"
    >
      <span v-bind="spAttrs">
        <slot />
      </span>
    </button>
  </th>
  <th v-else scope="col" v-bind="thAttrs">
    <slot />
  </th>
</template>
