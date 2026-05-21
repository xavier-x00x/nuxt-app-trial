<template>
  <div class="mb-2">
    <label class="form-label mb-1">{{ label }}</label>
    <input
      :id="id"
      :value="modelValue"
      :type="type"
      :class="['form-control rounded-1', iclass]"
      :placeholder="placeholder"
      :readonly="readonly"
      :autofocus="autofocus"
      :autocomplete="autocomplete"
      @input="updateValue"
    />
    <span class="text-danger error-text" v-text="error"></span>
  </div>
</template>

<script setup lang="ts">
defineProps({
  label: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "",
  },
  type: {
    type: String,
    default: "text",
  },
  id: {
    type: String,
    default: "",
  },
  modelValue: {
    type: null,
    default: null,
  },
  error: {
    type: String,
    default: "",
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  autofocus: {
    type: Boolean,
    default: false,
  },
  autocomplete: {
    type: String,
    default: "off",
  },
  iclass: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:modelValue"]);

function updateValue(event: Event) {
  emit("update:modelValue", (event.target as HTMLInputElement).value); // Emit the new value
}
</script>
