<script setup lang="ts">
import AutoNumeric from "autonumeric";

const props = defineProps({
  modelValue: {
    type: null,
    default: null,
  },
  raw: {
    type: Number,
    default: 0,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  autofocus: {
    type: Boolean,
    default: false,
  },
  iclass: {
    type: String,
    default: "",
  },
  decimal: {
    type: Number,
    default: 0,
  },
});

const inputRef = ref<HTMLInputElement | null>(null);
const number = ref(0);

onMounted(() => {
  // Pastikan elemen sudah ter-render di DOM
  // await nextTick();

  if (!inputRef.value) return;
  const numeric = new AutoNumeric(inputRef.value, {
    decimalCharacter: ".",
    decimalPlaces: props.decimal,
    emptyInputBehavior: "zero",
    maximumValue: "999999999999999.99",
    minimumValue: "-999999999999999.99",
  });

  number.value = numeric.getNumber() ?? 0;
  updateValue();

  numeric.node().addEventListener("keyup", () => {
    number.value = numeric.getNumber() ?? 0;
    updateValue();
  });
});

function selectAll(event: Event) {
  (event.target as HTMLInputElement).select();
}

const emit = defineEmits(["update:modelValue", "update:raw"]);

function updateValue() {
  emit("update:modelValue", inputRef.value?.value); // Emit the new value
  emit("update:raw", number.value);
}
</script>

<template>
  <input
    ref="inputRef"
    type="text"
    :value="modelValue"
    :class="['form-control rounded-1 text-end', iclass]"
    :readonly="readonly"
    :autofocus="autofocus"
    autocomplete="off"
    @click="selectAll"
  />
</template>
