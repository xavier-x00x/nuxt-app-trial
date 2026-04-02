<script setup lang="ts">
import AutoNumeric from "autonumeric";

const props = defineProps({
  label: {
    type: String,
    default: "",
  },
  modelValue: {
    type: null,
    default: null,
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

const emit = defineEmits(["update:modelValue", "dataRaw"]);

function updateValue() {
  emit("update:modelValue", inputRef.value?.value); // Emit the new value
  emit("dataRaw", number.value);
}
</script>

<template>
  <div class="mb-2">
    <label class="form-label mb-1">{{ label }}</label>
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
  </div>
</template>
