<template>
  <th v-if="props.xorder != ''" scope="col" v-bind="thAttrs">
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

<script setup lang="ts">
const thAttrs: Record<string, string> = { class: "" };
const spAttrs = { class: "flex-fill" };

const props = defineProps({
  xwidth: {
    type: String,
    default: "",
  },
  xclass: {
    type: String,
    default: "",
  },
  xorder: {
    type: String,
    default: "",
  },
});

if (props.xorder != "") {
  thAttrs["data-order"] = props.xorder;
  thAttrs["class"] = "p-0";
}

if (props.xclass.includes("text-center")) spAttrs.class += " ps-3";

if (props.xwidth != "") thAttrs.width = props.xwidth;
if (props.xclass != "") thAttrs.class += " " + props.xclass;
</script>
