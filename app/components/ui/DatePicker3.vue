<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

const props = withDefaults(defineProps<{
  modelValue?: string;
  placeholder?: string;
  format?: string;
  singleMode?: boolean; // kept for compatibility, though custom handles single mode natively
}>(), {
  modelValue: '',
  placeholder: 'Select a date',
  format: 'DD/MM/YYYY'
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const isOpen = ref(false);
const popoverRef = ref<HTMLElement | null>(null);

// State for the calendar
const currentDate = ref(new Date());

const initDateFromValue = () => {
  if (props.modelValue) {
    const [year, month, day] = props.modelValue.split('-');
    if (year && month && day) {
      currentDate.value = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
  }
};

initDateFromValue();

const currentMonth = ref(currentDate.value.getMonth());
const currentYear = ref(currentDate.value.getFullYear());

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
  
  emit('update:modelValue', value);
  isOpen.value = false;
};

const isSelected = (day: any) => {
  if (!props.modelValue) return false;
  
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
  
  return props.modelValue === dateString;
};

const isToday = (day: any) => {
  if (!day.isCurrentMonth) return false;
  const today = new Date();
  return day.date === today.getDate() && currentMonth.value === today.getMonth() && currentYear.value === today.getFullYear();
};

const displayValue = computed(() => {
  if (!props.modelValue) return '';
  const [year, month, day] = props.modelValue.split('-');
  if (!year || !month || !day) return props.modelValue;
  
  // Format for display
  if (props.format === 'DD/MM/YYYY' || !props.format) {
    return `${day}/${month}/${year}`;
  }
  return props.modelValue;
});

const togglePopover = () => {
  isOpen.value = !isOpen.value;
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

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    const [year, month, day] = newVal.split('-');
    if (year && month && day) {
      currentYear.value = parseInt(year);
      currentMonth.value = parseInt(month) - 1;
    }
  }
});
</script>

<template>
  <div class="mb-2 position-relative" ref="popoverRef">
    <label v-if="placeholder" class="form-label" v-text="placeholder"></label>
    
    <div class="input-icon" @click="togglePopover">
      <input
        type="text"
        class="form-control rounded-1"
        :placeholder="placeholder"
        readonly
        :value="displayValue"
        style="cursor: pointer; background-color: var(--tblr-bg-surface);"
      />
      <span class="input-icon-addon">
        <!-- Calendar icon -->
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z" />
          <path d="M16 3v4" />
          <path d="M8 3v4" />
          <path d="M4 11h16" />
          <path d="M11 15h1" />
          <path d="M12 15v3" />
        </svg>
      </span>
    </div>

    <!-- Calendar Dropdown -->
    <div v-if="isOpen" class="dropdown-menu show p-3 border rounded shadow-sm" style="position: absolute; top: 100%; left: 0; z-index: 1000; min-width: 280px; margin-top: 4px;">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-3">
        <button type="button" class="btn btn-icon btn-sm btn-ghost-secondary border-0" @click.stop="prevMonth">
          <!-- Chevron left -->
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M15 6l-6 6l6 6" /></svg>
        </button>
        <div class="fw-bold fs-4">
          {{ monthNames[currentMonth] }} {{ currentYear }}
        </div>
        <button type="button" class="btn btn-icon btn-sm btn-ghost-secondary border-0" @click.stop="nextMonth">
          <!-- Chevron right -->
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 6l6 6l-6 6" /></svg>
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
          @click.stop="selectDate(day)"
          class="calendar-day rounded-1"
          :class="{
            'bg-primary text-white fw-bold shadow-sm': isSelected(day),
            'text-muted opacity-50': !day.isCurrentMonth,
            'text-primary fw-bold': isToday(day) && !isSelected(day)
          }"
        >
          {{ day.date }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
