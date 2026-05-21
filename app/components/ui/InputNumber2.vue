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

    <!-- Wrapper with Icon support -->
    <div :class="{ 'input-icon': prefixIcon || suffixIcon }">
      <!-- Prefix Icon -->
      <span v-if="prefixIcon" class="input-icon-addon">
        <Icon :name="prefixIcon" class="icon" />
      </span>

      <!-- AutoNumeric Input -->
      <input
        ref="inputRef"
        type="text"
        :id="inputId"
        :class="[
          'form-control rounded-1 text-end',
          { 'is-invalid': !!error },
          iclass
        ]"
        :placeholder="placeholder"
        :readonly="readonly"
        :disabled="disabled"
        :autofocus="autofocus"
        autocomplete="off"
        @click="selectAll"
      />

      <!-- Suffix Icon -->
      <span v-if="suffixIcon" class="input-icon-addon">
        <Icon :name="suffixIcon" class="icon" />
      </span>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="invalid-feedback d-block mt-1">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import AutoNumeric from 'autonumeric';

// Props definition
interface Props {
  label?: string;
  placeholder?: string;
  id?: string;
  error?: string;
  readonly?: boolean;
  disabled?: boolean;
  autofocus?: boolean;
  iclass?: string;
  prefixIcon?: string;
  suffixIcon?: string;
  required?: boolean;
  decimal?: number;
}

const props = withDefaults(defineProps<Props>(), {
  label: "",
  placeholder: "",
  id: "",
  error: "",
  readonly: false,
  disabled: false,
  autofocus: false,
  iclass: "",
  prefixIcon: "",
  suffixIcon: "",
  required: false,
  decimal: 0,
});

// Setup dual v-model binding using defineModel (Vue 3.4+)
const model = defineModel<any>();
const raw = defineModel<number>('raw', { default: 0 });

const inputRef = ref<HTMLInputElement | null>(null);
const inputId = props.id || useId();

let numericInstance: AutoNumeric | null = null;

// Determine if we should apply margins and render wrappers
const hasLabelOrError = computed(() => !!props.label || !!props.error);

onMounted(() => {
  if (!inputRef.value) return;

  numericInstance = new AutoNumeric(inputRef.value, {
    decimalCharacter: ".",
    decimalPlaces: props.decimal,
    emptyInputBehavior: "zero",
    maximumValue: "999999999999999.99",
    minimumValue: "-999999999999999.99",
  });

  // Set initial value based on raw or model
  if (raw.value !== undefined && raw.value !== null) {
    numericInstance.set(raw.value);
  } else if (model.value !== undefined && model.value !== null) {
    numericInstance.set(model.value);
  }

  // Update values on input events
  const handleUpdate = () => {
    if (!numericInstance || !inputRef.value) return;
    const currentNum = numericInstance.getNumber() ?? 0;
    
    // Only emit if value actually changed to prevent loops
    if (raw.value !== currentNum) {
      raw.value = currentNum;
    }
    if (model.value !== inputRef.value.value) {
      model.value = inputRef.value.value;
    }
  };

  numericInstance.node().addEventListener("keyup", handleUpdate);
  numericInstance.node().addEventListener("change", handleUpdate);
});

// Watch for external changes to `raw` prop to update AutoNumeric input programmatically
watch(raw, (newRaw) => {
  if (numericInstance && numericInstance.getNumber() !== newRaw) {
    numericInstance.set(newRaw ?? 0);
    model.value = inputRef.value?.value;
  }
});

// Select all text on focus/click
const selectAll = (event: Event) => {
  if (props.readonly) return;
  (event.target as HTMLInputElement).select();
};
</script>

<style scoped>
/* Align padding when icon is present inside AutoNumeric */
.input-icon > .form-control.text-end {
  padding-right: 2.5rem;
}
</style>
