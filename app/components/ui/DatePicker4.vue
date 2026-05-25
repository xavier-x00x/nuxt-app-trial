<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

interface Props {
  label?: string;
  placeholder?: string;
  format?: string;
  id?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  placeholder: 'Select a date',
  format: 'DD/MM/YYYY',
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
const inputValue = ref('');

// Parse YYYY-MM-DD to display format
const formatDateForDisplay = (dateStr: string | undefined) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  
  if (props.format === 'DD/MM/YYYY') {
    return `${day}/${month}/${year}`;
  }
  return dateStr; // fallback for YYYY-MM-DD
};

// Parse display format to YYYY-MM-DD
const parseDateFromDisplay = (displayStr: string) => {
  if (!displayStr) return '';
  if (props.format === 'DD/MM/YYYY') {
    const parts = displayStr.split('/');
    const [day, month, year] = parts;
    if (day && month && year) {
      const d = parseInt(day);
      const m = parseInt(month);
      const y = parseInt(year);
      if (!isNaN(d) && !isNaN(m) && !isNaN(y) && y > 1000) {
        return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }
  } else {
    // Assume YYYY-MM-DD
    const parts = displayStr.split('-');
    const [year, month, day] = parts;
    if (year && month && day) {
      const d = parseInt(day);
      const m = parseInt(month);
      const y = parseInt(year);
      if (!isNaN(d) && !isNaN(m) && !isNaN(y) && y > 1000) {
        return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }
  }
  return '';
};

inputValue.value = formatDateForDisplay(model.value);

const currentDate = ref(new Date());
const currentMonth = ref(currentDate.value.getMonth());
const currentYear = ref(currentDate.value.getFullYear());

const initDateFromValue = () => {
  const val = model.value;
  if (val) {
    const [year, month, day] = val.split('-');
    if (year && month && day) {
      currentDate.value = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
  } else {
    currentDate.value = new Date();
  }
  currentMonth.value = currentDate.value.getMonth();
  currentYear.value = currentDate.value.getFullYear();
};

initDateFromValue();

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const daysInMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value + 1, 0).getDate();
});

const firstDayOfMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value, 1).getDay();
});

const calendarDays = computed(() => {
  const days = [];
  const prevMonthDays = new Date(currentYear.value, currentMonth.value, 0).getDate();
  
  for (let i = firstDayOfMonth.value - 1; i >= 0; i--) {
    days.push({
      date: prevMonthDays - i,
      isCurrentMonth: false,
      isPrevMonth: true,
      isNextMonth: false
    });
  }
  
  for (let i = 1; i <= daysInMonth.value; i++) {
    days.push({
      date: i,
      isCurrentMonth: true,
      isPrevMonth: false,
      isNextMonth: false
    });
  }
  
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({
      date: i,
      isCurrentMonth: false,
      isPrevMonth: false,
      isNextMonth: true
    });
  }
  return days;
});

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
};

const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
};

const selectDate = (day: any) => {
  let selectedMonth = currentMonth.value;
  let selectedYear = currentYear.value;
  
  if (day.isPrevMonth) {
    if (selectedMonth === 0) {
      selectedMonth = 11;
      selectedYear--;
    } else {
      selectedMonth--;
    }
  } else if (day.isNextMonth) {
    if (selectedMonth === 11) {
      selectedMonth = 0;
      selectedYear++;
    } else {
      selectedMonth++;
    }
  }
  
  const formattedMonth = String(selectedMonth + 1).padStart(2, '0');
  const formattedDay = String(day.date).padStart(2, '0');
  const value = `${selectedYear}-${formattedMonth}-${formattedDay}`;
  
  model.value = value;
  isOpen.value = false;
};

const isSelected = (day: any) => {
  if (!model.value) return false;
  
  let selectedMonth = currentMonth.value;
  let selectedYear = currentYear.value;
  
  if (day.isPrevMonth) {
    if (selectedMonth === 0) { selectedMonth = 11; selectedYear--; } else { selectedMonth--; }
  } else if (day.isNextMonth) {
    if (selectedMonth === 11) { selectedMonth = 0; selectedYear++; } else { selectedMonth++; }
  }
  
  const formattedMonth = String(selectedMonth + 1).padStart(2, '0');
  const formattedDay = String(day.date).padStart(2, '0');
  const dateString = `${selectedYear}-${formattedMonth}-${formattedDay}`;
  
  return model.value === dateString;
};

const isToday = (day: any) => {
  if (!day.isCurrentMonth) return false;
  const today = new Date();
  return day.date === today.getDate() && currentMonth.value === today.getMonth() && currentYear.value === today.getFullYear();
};

const handleInputBlur = () => {
  if (!inputValue.value) {
    model.value = '';
    return;
  }
  
  const parsed = parseDateFromDisplay(inputValue.value);
  if (parsed) {
    const [year, month, day] = parsed.split('-');
    if (year && month && day) {
      const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (
        d.getFullYear() === parseInt(year) &&
        d.getMonth() === parseInt(month) - 1 &&
        d.getDate() === parseInt(day)
      ) {
        model.value = parsed;
        inputValue.value = formatDateForDisplay(parsed);
        return;
      }
    }
  }
  
  // Revert on invalid format/date
  inputValue.value = formatDateForDisplay(model.value);
};

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

watch(() => model.value, (newVal) => {
  inputValue.value = formatDateForDisplay(newVal);
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
    
    <div class="input-icon">
      <input
        :id="inputId"
        v-model="inputValue"
        type="text"
        :class="[
          'form-control rounded-1',
          { 'is-invalid': !!error },
          className
        ]"
        :placeholder="placeholder"
        :disabled="disabled"
        autocomplete="off"
        @blur="handleInputBlur"
        @keyup.enter="handleInputBlur"
      />
      <span class="input-icon-addon input-icon-addon-clickable" @click="togglePopover">
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

    <!-- Calendar Dropdown -->
    <div v-if="isOpen" class="dropdown-menu show p-3 border rounded shadow-sm" style="position: absolute; top: 100%; left: 0; z-index: 1000; min-width: 280px; margin-top: 4px;">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-3">
        <button type="button" class="btn btn-icon btn-sm btn-ghost-secondary border-0" @click.stop="prevMonth">
          <!-- Chevron left -->
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M15 6l-6 6l6 6" /></svg>
        </button>
        <div class="fw-bold fs-4">
          {{ monthNames[currentMonth] }} {{ currentYear }}
        </div>
        <button type="button" class="btn btn-icon btn-sm btn-ghost-secondary border-0" @click.stop="nextMonth">
          <!-- Chevron right -->
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M9 6l6 6l-6 6" /></svg>
        </button>
      </div>
      
      <!-- Days of week -->
      <div class="d-grid text-center mb-2" style="grid-template-columns: repeat(7, 1fr); font-size: 0.75rem; font-weight: 600; color: #6e7687; text-transform: uppercase; letter-spacing: 0.5px;">
        <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
      </div>
      
      <!-- Days Grid -->
      <div class="d-grid text-center gap-1" style="grid-template-columns: repeat(7, 1fr);">
        <div 
          v-for="(day, index) in calendarDays" 
          :key="index"
          class="calendar-day rounded-1"
          :class="{
            'bg-primary text-white fw-bold shadow-sm': isSelected(day),
            'text-muted opacity-50': !day.isCurrentMonth,
            'text-primary fw-bold': isToday(day) && !isSelected(day)
          }"
          @click.stop="selectDate(day)"
        >
          {{ day.date }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.input-icon-addon-clickable {
  pointer-events: auto !important;
  cursor: pointer;
  user-select: none;
}
.input-icon-addon-clickable:hover {
  color: var(--tblr-primary, #206bc4);
}
.calendar-day {
  cursor: pointer;
  font-size: 0.875rem;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: auto;
  transition: all 0.2s;
}
.calendar-day:hover:not(.bg-primary) {
  background-color: var(--tblr-bg-surface-secondary, rgba(0, 0, 0, 0.05));
}
[data-bs-theme="dark"] .calendar-day:hover:not(.bg-primary) {
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
