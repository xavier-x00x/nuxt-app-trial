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

    <!-- Input Wrapper with Icon support -->
    <div :class="{ 'input-icon': prefixIcon || type === 'password' || suffixIcon }">
      <!-- Prefix Icon -->
      <span v-if="prefixIcon" class="input-icon-addon">
        <Icon :name="prefixIcon" class="icon" />
      </span>

      <!-- AutoNumeric Input (for number / numeric) -->
      <input
        v-if="isNumeric"
        ref="numericInputRef"
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

      <!-- Native Input (for text, password, email, etc.) -->
      <input
        v-else
        :id="inputId"
        v-model="model"
        :type="computedType"
        :class="[
          'form-control rounded-1',
          { 'is-invalid': !!error },
          iclass
        ]"
        :placeholder="placeholder"
        :readonly="readonly"
        :disabled="disabled"
        :autofocus="autofocus"
        :autocomplete="autocomplete"
      />

      <!-- Suffix Icon or Password Toggle -->
      <span 
        v-if="type === 'password'" 
        class="input-icon-addon input-icon-addon-clickable"
        @click="togglePassword"
      >
        <Icon :name="showPassword ? 'i-tabler:eye-off' : 'i-tabler:eye'" class="icon" />
      </span>
      <span v-else-if="suffixIcon" class="input-icon-addon">
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
import { ref, computed, onMounted, watch } from 'vue';
import AutoNumeric from 'autonumeric';

// Define Props with TypeScript
interface Props {
  label?: string;
  placeholder?: string;
  type?: string; // 'text', 'password', 'number', 'numeric', etc.
  id?: string;
  error?: string;
  readonly?: boolean;
  disabled?: boolean;
  autofocus?: boolean;
  autocomplete?: string;
  iclass?: string;
  prefixIcon?: string;
  suffixIcon?: string;
  required?: boolean;
  decimal?: number;
}

const props = withDefaults(defineProps<Props>(), {
  label: "",
  placeholder: "",
  type: "text",
  id: "",
  error: "",
  readonly: false,
  disabled: false,
  autofocus: false,
  autocomplete: "off",
  iclass: "",
  prefixIcon: "",
  suffixIcon: "",
  required: false,
  decimal: 0,
});

// Setup dual v-model binding
const model = defineModel<any>();
const raw = defineModel<number>('raw');

// Generate unique ID for input-label association
const inputId = props.id || useId();

// Helper to check if it's a numeric input
const isNumeric = computed(() => props.type === 'number' || props.type === 'numeric');

// Determine wrapper margin collapsing
const hasLabelOrError = computed(() => !!props.label || !!props.error);

// Password visibility state
const showPassword = ref(false);
const computedType = computed(() => {
  if (props.type === 'password') {
    return showPassword.value ? 'text' : 'password';
  }
  return props.type;
});

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

// AutoNumeric logic for numeric input type
const numericInputRef = ref<HTMLInputElement | null>(null);
let numericInstance: AutoNumeric | null = null;

onMounted(() => {
  if (isNumeric.value && numericInputRef.value) {
    numericInstance = new AutoNumeric(numericInputRef.value, {
      decimalCharacter: ".",
      decimalPlaces: props.decimal,
      emptyInputBehavior: "zero",
      maximumValue: "999999999999999.99",
      minimumValue: "-999999999999999.99",
    });

    // Set initial value
    if (raw.value !== undefined && raw.value !== null) {
      numericInstance.set(raw.value);
    } else if (model.value !== undefined && model.value !== null) {
      numericInstance.set(model.value);
    }

    // Update values on input events
    const handleUpdate = () => {
      if (!numericInstance || !numericInputRef.value) return;
      const currentNum = numericInstance.getNumber() ?? 0;
      
      if (raw.value !== currentNum) {
        raw.value = currentNum;
      }
      if (model.value !== numericInputRef.value.value) {
        model.value = numericInputRef.value.value;
      }
    };

    numericInstance.node().addEventListener("keyup", handleUpdate);
    numericInstance.node().addEventListener("change", handleUpdate);
  }
});

// Watch for external changes to `raw` prop to update AutoNumeric input
watch(() => raw.value, (newRaw) => {
  if (isNumeric.value && numericInstance && numericInstance.getNumber() !== newRaw) {
    numericInstance.set(newRaw ?? 0);
    model.value = numericInputRef.value?.value;
  }
});

// Watch for external changes to `model` prop for numeric input
watch(() => model.value, (newModel) => {
  if (isNumeric.value && numericInstance && numericInputRef.value && numericInputRef.value.value !== newModel) {
    numericInstance.set(newModel);
    const currentNum = numericInstance.getNumber() ?? 0;
    if (raw.value !== currentNum) {
      raw.value = currentNum;
    }
  }
});

// Select all text on focus/click
const selectAll = (event: Event) => {
  if (props.readonly) return;
  (event.target as HTMLInputElement).select();
};
</script>

<style scoped>
/* Allow click events on the password toggle addon */
.input-icon-addon-clickable {
  pointer-events: auto !important;
  cursor: pointer;
  user-select: none;
}

.input-icon-addon-clickable:hover {
  color: var(--tblr-primary, #206bc4);
}

/* Align padding when icon is present inside AutoNumeric */
.input-icon > .form-control.text-end {
  padding-right: 2.5rem;
}
</style>
