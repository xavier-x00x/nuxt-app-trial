<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

interface Props {
  label?: string;
  placeholder?: string;
  id?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  placeholder: 'Select a period',
  id: '',
  error: '',
  disabled: false,
  className: '',
  required: false,
});

const model = defineModel<string>();

const inputId = props.id || useId();
const hasLabelOrError = computed(() => !!props.label || !!props.error);

const isOpen = ref(false);
const popoverRef = ref<HTMLElement | null>(null);

const currentYear = ref(new Date().getFullYear());

const initDateFromValue = () => {
  if (model.value) {
    const [year] = model.value.split('-');
    if (year) {
      currentYear.value = parseInt(year);
    }
  } else {
    currentYear.value = new Date().getFullYear();
  }
};

initDateFromValue();

const shortMonths = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const selectMonth = (index: number) => {
  if (props.disabled) return;
  const formattedMonth = String(index + 1).padStart(2, '0');
  model.value = `${currentYear.value}-${formattedMonth}`;
  isOpen.value = false;
};

const isSelected = (index: number) => {
  if (!model.value) return false;
  const [year, month] = model.value.split('-');
  if (!year || !month) return false;
  return parseInt(year) === currentYear.value && parseInt(month) === index + 1;
};

const isCurrentMonth = (index: number) => {
  const today = new Date();
  return today.getFullYear() === currentYear.value && today.getMonth() === index;
};

const displayValue = computed(() => {
  if (!model.value) return '';
  const [year, month] = model.value.split('-');
  if (!year || !month) return model.value;
  return `${month}/${year}`;
});

const togglePopover = () => {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    initDateFromValue();
  }
};

const closePopover = (e: MouseEvent) => {
  if (popoverRef.value && !popoverRef.value.contains(e.target as Node)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', closePopover);
});

onUnmounted(() => {
  document.removeEventListener('click', closePopover);
});
</script>

<template>
  <div ref="popoverRef" :class="[hasLabelOrError ? 'mb-3' : '', 'position-relative']">
    <!-- Label -->
    <label 
      v-if="label" 
      :for="inputId" 
      class="form-label mb-1"
    >
      {{ label }}
      <span v-if="required" class="text-danger">*</span>
    </label>
    
    <div class="input-icon" @click="togglePopover">
      <input
        :id="inputId"
        type="text"
        :class="[
          'form-control rounded-1',
          { 'is-invalid': !!error },
          className
        ]"
        :placeholder="placeholder"
        :disabled="disabled"
        readonly
        :value="displayValue"
        style="cursor: pointer; background-color: var(--tblr-bg-surface);"
      />
      <span class="input-icon-addon">
        <!-- Calendar icon -->
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z" />
          <path d="M16 3v4" />
          <path d="M8 3v4" />
          <path d="M4 11h16" />
          <path d="M11 15h1" />
          <path d="M12 15v3" />
        </svg>
      </span>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="invalid-feedback d-block mt-1">
      {{ error }}
    </div>

    <!-- Period Dropdown -->
    <div v-if="isOpen" class="dropdown-menu show p-3 border rounded shadow-sm" style="position: absolute; top: 100%; left: 0; z-index: 1000; min-width: 280px; margin-top: 4px;">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-3">
        <button type="button" class="btn btn-icon btn-sm btn-ghost-secondary border-0" @click.stop="currentYear--">
          <!-- Chevron left -->
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M15 6l-6 6l6 6" /></svg>
        </button>
        <div class="fw-bold fs-4">
          {{ currentYear }}
        </div>
        <button type="button" class="btn btn-icon btn-sm btn-ghost-secondary border-0" @click.stop="currentYear++">
          <!-- Chevron right -->
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M9 6l6 6l-6 6" /></svg>
        </button>
      </div>
      
      <!-- Months Grid -->
      <div class="d-grid gap-2" style="grid-template-columns: repeat(3, 1fr);">
        <div 
          v-for="(mName, index) in shortMonths" 
          :key="index"
          class="calendar-month rounded-1 text-center py-2"
          :class="{
            'bg-primary text-white fw-bold shadow-sm': isSelected(index),
            'text-primary fw-bold': isCurrentMonth(index) && !isSelected(index)
          }"
          @click.stop="selectMonth(index)"
        >
          {{ String(index + 1).padStart(2, '0') }} | {{ mName }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.calendar-month {
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
  user-select: none;
}
.calendar-month:hover:not(.bg-primary) {
  background-color: var(--tblr-bg-surface-secondary, rgba(0, 0, 0, 0.05));
}
[data-bs-theme="dark"] .calendar-month:hover:not(.bg-primary) {
  background-color: var(--tblr-bg-surface-secondary, rgba(255, 255, 255, 0.05));
}
.dropdown-menu {
  animation: fadeIn 0.15s ease-in-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
