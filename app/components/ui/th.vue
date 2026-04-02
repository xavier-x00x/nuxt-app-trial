<script setup lang="ts">
const props = defineProps<{
  xwidth?: string;
  xclass?: string;
  xorder?: string;
}>();

// atribut <th>
const thAttrs = computed<Record<string, string>>(() => {
  const attrs: Record<string, string> = {
    class: props.xorder ? "p-0" : "",
  };

  if (props.xorder) {
    attrs["data-order"] = props.xorder;
  }
  if (props.xwidth) {
    attrs["width"] = props.xwidth;
  }
  if (props.xclass) {
    attrs["class"] += " " + props.xclass;
  }

  return attrs;
});

// atribut <span>
const spAttrs = computed<Record<string, string>>(() => {
  let cls = "flex-fill";
  if (props.xclass?.includes("text-center")) {
    cls += " ps-3";
  }
  return { class: cls };
});

const { xorder } = props;
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
