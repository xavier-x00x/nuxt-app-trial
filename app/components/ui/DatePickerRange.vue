<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

const props = withDefaults(defineProps<{
  placeholder?: string;
  format?: string;
  disabled?: boolean;
}>(), {
  placeholder: 'Select date range',
  format: 'DD/MM/YYYY'
});

const start = defineModel<string>('start');
const end = defineModel<string>('end');

const isOpen = ref(false);
const popoverRef = ref<HTMLElement | null>(null);

const selectionStep = ref(0);
const tempStart = ref<string>('');
const tempEnd = ref<string>('');

const currentDate = ref(new Date());

const currentMonth = ref(new Date().getMonth());
const currentYear = ref(new Date().getFullYear());

const initDateFromValue = () => {
  if (start.value) {
    const [year, month, day] = start.value.split('-');
    if (year && month && day) {
      currentDate.value = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
  } else {
    currentDate.value = new Date();
  }
  currentMonth.value = currentDate.value.getMonth();
  currentYear.value = currentDate.value.getFullYear();
  
  tempStart.value = start.value || '';
  tempEnd.value = end.value || '';
  selectionStep.value = tempStart.value && tempEnd.value ? 0 : (tempStart.value ? 1 : 0);
};

onMounted(() => {
  initDateFromValue();
  document.addEventListener('click', closePopover);
});

onUnmounted(() => {
  document.removeEventListener('click', closePopover);
});

watch([start, end], () => {
  if (!isOpen.value) {
    initDateFromValue();
  }
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

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const generateCalendarDays = (year: number, month: number) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const prevMonthDays = new Date(year, month, 0).getDate();
  
  const days = [];
  
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({
      date: prevMonthDays - i,
      isCurrentMonth: false,
      month: month === 0 ? 11 : month - 1,
      year: month === 0 ? year - 1 : year
    });
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: i,
      isCurrentMonth: true,
      month: month,
      year: year
    });
  }
  
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({
      date: i,
      isCurrentMonth: false,
      month: month === 11 ? 0 : month + 1,
      year: month === 11 ? year + 1 : year
    });
  }
  return days;
};

const leftCalendarDays = computed(() => generateCalendarDays(currentYear.value, currentMonth.value));
const rightCalendarDays = computed(() => {
  let rMonth = currentMonth.value + 1;
  let rYear = currentYear.value;
  if (rMonth > 11) {
    rMonth = 0;
    rYear++;
  }
  return generateCalendarDays(rYear, rMonth);
});

const getRightMonthYear = computed(() => {
  let rMonth = currentMonth.value + 1;
  let rYear = currentYear.value;
  if (rMonth > 11) {
    rMonth = 0;
    rYear++;
  }
  return { month: rMonth, year: rYear };
});

const selectDate = (day: any) => {
  const formattedMonth = String(day.month + 1).padStart(2, '0');
  const formattedDay = String(day.date).padStart(2, '0');
  const value = `${day.year}-${formattedMonth}-${formattedDay}`;
  
  if (selectionStep.value === 0 || !tempStart.value) {
    tempStart.value = value;
    tempEnd.value = '';
    selectionStep.value = 1;
  } else {
    if (value < tempStart.value) {
      tempEnd.value = tempStart.value;
      tempStart.value = value;
    } else {
      tempEnd.value = value;
    }
    
    start.value = tempStart.value;
    end.value = tempEnd.value;
    selectionStep.value = 0;
    isOpen.value = false;
  }
};

const isHoveredDate = ref<string | null>(null);

const onDateHover = (day: any) => {
  if (selectionStep.value === 1 && tempStart.value) {
    const formattedMonth = String(day.month + 1).padStart(2, '0');
    const formattedDay = String(day.date).padStart(2, '0');
    isHoveredDate.value = `${day.year}-${formattedMonth}-${formattedDay}`;
  } else {
    isHoveredDate.value = null;
  }
};

const isInRange = (day: any) => {
  const formattedMonth = String(day.month + 1).padStart(2, '0');
  const formattedDay = String(day.date).padStart(2, '0');
  const dateStr = `${day.year}-${formattedMonth}-${formattedDay}`;
  
  const startStr = tempStart.value;
  const endStr = tempEnd.value;
  
  if (startStr && endStr) {
    return dateStr > startStr && dateStr < endStr;
  }
  
  if (selectionStep.value === 1 && startStr && isHoveredDate.value) {
    const min = startStr < isHoveredDate.value ? startStr : isHoveredDate.value;
    const max = startStr > isHoveredDate.value ? startStr : isHoveredDate.value;
    return dateStr > min && dateStr < max;
  }
  
  return false;
};

const isSelected = (day: any) => {
  const formattedMonth = String(day.month + 1).padStart(2, '0');
  const formattedDay = String(day.date).padStart(2, '0');
  const dateStr = `${day.year}-${formattedMonth}-${formattedDay}`;
  
  const startStr = tempStart.value;
  const endStr = tempEnd.value;
  
  if (selectionStep.value === 1 && startStr && isHoveredDate.value) {
    return dateStr === startStr || dateStr === isHoveredDate.value;
  }
  
  return dateStr === startStr || dateStr === endStr;
};

const isToday = (day: any) => {
  if (!day.isCurrentMonth) return false;
  const today = new Date();
  return day.date === today.getDate() && day.month === today.getMonth() && day.year === today.getFullYear();
};

const formatDateForDisplay = (dateStr?: string) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  
  if (props.format === 'DD/MM/YYYY') {
    return `${day}/${month}/${year}`;
  }
  return dateStr;
};

const displayValue = computed(() => {
  const s = formatDateForDisplay(start.value);
  const e = formatDateForDisplay(end.value);
  
  if (s && e) {
    return `${s} - ${e}`;
  } else if (s) {
    return `${s} - ...`;
  }
  return '';
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
</script>

<template>
  <div ref="popoverRef" class="mb-2 position-relative">
    <div class="input-icon" @click="togglePopover">
      <input
        type="text"
        class="form-control rounded-1"
        :placeholder="placeholder"
        readonly
        :value="displayValue"
        style="cursor: pointer; background-color: var(--tblr-bg-surface);"
        :disabled="disabled"
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

    <!-- Calendar Dropdown -->
    <div v-if="isOpen" class="dropdown-menu range-dropdown show p-3 border rounded shadow-sm" style="position: absolute; top: 100%; left: 0; z-index: 1000; margin-top: 4px; max-width: 95vw;">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <button type="button" class="btn btn-icon btn-sm btn-ghost-secondary border-0" @click.stop="prevMonth">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M15 6l-6 6l6 6" /></svg>
        </button>
        <div class="d-flex w-100 justify-content-around">
          <div class="fw-bold fs-4">{{ monthNames[currentMonth] }} {{ currentYear }}</div>
          <div class="fw-bold fs-4 d-none d-md-block">{{ monthNames[getRightMonthYear.month] }} {{ getRightMonthYear.year }}</div>
        </div>
        <button type="button" class="btn btn-icon btn-sm btn-ghost-secondary border-0" @click.stop="nextMonth">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M9 6l6 6l-6 6" /></svg>
        </button>
      </div>

      <div class="row gx-4">
        <!-- Left Calendar -->
        <div class="col-12 col-md-6">
          <div class="d-grid text-center mb-2" style="grid-template-columns: repeat(7, 1fr); font-size: 0.75rem; font-weight: 600; color: #6e7687; text-transform: uppercase; letter-spacing: 0.5px;">
            <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
          </div>
            
          <div class="d-grid text-center gap-1" style="grid-template-columns: repeat(7, 1fr);" @mouseleave="isHoveredDate = null">
            <div 
              v-for="(day, index) in leftCalendarDays" 
              :key="'L'+index"
              class="calendar-day rounded-1"
              :class="{
                'bg-primary text-white fw-bold shadow-sm': isSelected(day),
                'in-range-bg': isInRange(day) && !isSelected(day),
                'text-muted opacity-50': !day.isCurrentMonth,
                'text-primary fw-bold': isToday(day) && !isSelected(day) && !isInRange(day)
              }"
              @click.stop="selectDate(day)"
              @mouseover="onDateHover(day)"
            >
              {{ day.date }}
            </div>
          </div>
        </div>

        <!-- Right Calendar -->
        <div class="col-12 col-md-6 d-none d-md-block">
          <div class="d-grid text-center mb-2" style="grid-template-columns: repeat(7, 1fr); font-size: 0.75rem; font-weight: 600; color: #6e7687; text-transform: uppercase; letter-spacing: 0.5px;">
            <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
          </div>
            
          <div class="d-grid text-center gap-1" style="grid-template-columns: repeat(7, 1fr);" @mouseleave="isHoveredDate = null">
            <div 
              v-for="(day, index) in rightCalendarDays" 
              :key="'R'+index"
              class="calendar-day rounded-1"
              :class="{
                'bg-primary text-white fw-bold shadow-sm': isSelected(day),
                'in-range-bg': isInRange(day) && !isSelected(day),
                'text-muted opacity-50': !day.isCurrentMonth,
                'text-primary fw-bold': isToday(day) && !isSelected(day) && !isInRange(day)
              }"
              @click.stop="selectDate(day)"
              @mouseover="onDateHover(day)"
            >
              {{ day.date }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.range-dropdown {
  min-width: 280px;
}
@media (min-width: 768px) {
  .range-dropdown {
    min-width: 560px;
  }
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
.in-range-bg {
  background-color: rgba(var(--tblr-primary-rgb, 32, 107, 196), 0.1);
  color: var(--tblr-primary, #206bc4);
}
[data-bs-theme="dark"] .in-range-bg {
  background-color: rgba(var(--tblr-primary-rgb, 32, 107, 196), 0.2);
}
.dropdown-menu {
  animation: fadeIn 0.15s ease-in-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
