<template>
  <div :class="[hasLabelOrError ? 'mb-3' : '']">
    <!-- Label -->
    <label 
      v-if="label" 
      :for="inputId" 
      class="form-label mb-1"
    >
      {{ label }}
      <span v-if="required" class="text-danger">*</span>
    </label>

    <!-- Textarea -->
    <textarea
      :id="inputId"
      v-model="model"
      :class="[
        'form-control rounded-1',
        { 'is-invalid': !!error },
        iclass
      ]"
      :rows="rows"
      :placeholder="placeholder"
      :readonly="readonly"
      :disabled="disabled"
      :autofocus="autofocus"
    ></textarea>

    <!-- Error Message -->
    <div v-if="error" class="invalid-feedback d-block mt-1">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
// Define Props with TypeScript
interface Props {
  label?: string;
  placeholder?: string;
  rows?: number | string;
  id?: string;
  error?: string;
  readonly?: boolean;
  disabled?: boolean;
  autofocus?: boolean;
  iclass?: string;
  required?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  label: "",
  placeholder: "",
  rows: 2,
  id: "",
  error: "",
  readonly: false,
  disabled: false,
  autofocus: false,
  iclass: "",
  required: false,
});

// Setup dual v-model binding
const model = defineModel<any>();

// Generate unique ID for input-label association
const inputId = props.id || useId();

// Determine wrapper margin collapsing
const hasLabelOrError = computed(() => !!props.label || !!props.error);
</script>
