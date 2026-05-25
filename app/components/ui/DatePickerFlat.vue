<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue?: string;
  placeholder?: string;
}>(), {
  placeholder: "Pilih tanggal",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const show = ref(false);
const viewDate = ref(new Date());
const selectedDate = ref<Date | null>(null);

const hasValue = computed(() => !!props.modelValue);

// Parse initial value
if (props.modelValue) {
  const d = new Date(props.modelValue);
  if (!isNaN(d.getTime())) {
    selectedDate.value = d;
    viewDate.value = new Date(d);
  }
}

const year = computed(() => viewDate.value.getFullYear());
const month = computed(() => viewDate.value.getMonth());

const daysInMonth = computed(() => new Date(year.value, month.value + 1, 0).getDate());
const firstDay = computed(() => new Date(year.value, month.value, 1).getDay());

const calendarDays = computed(() => {
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay.value; i++) days.push(null);
  for (let i = 1; i <= daysInMonth.value; i++) days.push(i);
  return days;
});

const isToday = (day: number) => {
  const t = new Date();
  return day === t.getDate() && month.value === t.getMonth() && year.value === t.getFullYear();
};

const isSelected = (day: number) => {
  if (!selectedDate.value) return false;
  return day === selectedDate.value.getDate() &&
    month.value === selectedDate.value.getMonth() &&
    year.value === selectedDate.value.getFullYear();
};

function prevMonth() {
  viewDate.value = new Date(year.value, month.value - 1, 1);
}

function nextMonth() {
  viewDate.value = new Date(year.value, month.value + 1, 1);
}

function selectDay(day: number) {
  const d = new Date(year.value, month.value, day);
  selectedDate.value = d;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  emit("update:modelValue", `${y}-${m}-${dd}`);
  show.value = false;
}

function toggle() {
  show.value = !show.value;
}

function clearDate(e: MouseEvent) {
  e.stopPropagation();
  selectedDate.value = null;
  emit("update:modelValue", "");
}

function formatDisplay(): string {
  if (!selectedDate.value) return "";
  const d = selectedDate.value;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

watch(() => props.modelValue, (val) => {
  if (!val) {
    selectedDate.value = null;
  } else if (!selectedDate.value) {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      selectedDate.value = d;
    }
  }
});

// Close on outside click
function onClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!target.closest(".custom-datepicker")) {
    show.value = false;
  }
}

onMounted(() => document.addEventListener("click", onClickOutside));
onUnmounted(() => document.removeEventListener("click", onClickOutside));
</script>

<template>
  <div class="custom-datepicker position-relative">
    <div class="position-relative">
      <input
        type="text"
        class="form-control form-control-sm pe-4"
        :placeholder="placeholder"
        :value="formatDisplay()"
        autocomplete="off"
        readonly
        @click="toggle"
      />
      <span
        v-if="hasValue"
        class="position-absolute top-50 end-0 translate-middle-y text-muted"
        role="button"
        tabindex="0"
        style="cursor: pointer; line-height: 1; z-index: 1; right: 6px !important;"
        @mousedown.stop="clearDate"
      >
        <Icon name="i-tabler:x" size="0.9rem" />
      </span>
    </div>

    <Transition name="fade">
      <div
        v-if="show"
        class="position-absolute mt-1 shadow border-0 p-3"
        style="
          z-index: 1060; border-radius: 8px; width: 280px; right: 0;
          background: var(--tblr-card-bg, #1f2e41);
          border: 1px solid var(--tblr-border-color, #2e3947);
        "
      >
        <!-- Header: month/year + nav -->
        <div class="d-flex align-items-center justify-content-between mb-3">
          <span class="fw-semibold" style="color: var(--tblr-light, #dce1e7); font-size: 0.875rem;">
            {{ MONTHS[month] }} {{ year }}
          </span>
          <div class="d-flex gap-1">
            <span
              class="text-muted px-1"
              role="button"
              tabindex="0"
              style="cursor: pointer; line-height: 1;"
              @click="prevMonth"
            >
              <Icon name="i-tabler:chevron-left" size="1.1rem" />
            </span>
            <span
              class="text-muted px-1"
              role="button"
              tabindex="0"
              style="cursor: pointer; line-height: 1;"
              @click="nextMonth"
            >
              <Icon name="i-tabler:chevron-right" size="1.1rem" />
            </span>
          </div>
        </div>

        <!-- Day names -->
        <div class="row g-0 mb-1">
          <div
            v-for="d in DAYS"
            :key="d"
            class="col text-center"
            style="color: var(--tblr-secondary, #6c7a91); font-size: 0.7rem; font-weight: 600; text-transform: uppercase; padding: 4px 0;"
          >
            {{ d }}
          </div>
        </div>

        <!-- Days -->
        <div class="row g-0">
          <div
            v-for="(day, i) in calendarDays"
            :key="i"
            class="col text-center"
            style="padding: 1px;"
          >
            <span
              v-if="day"
              role="button"
              tabindex="0"
              class="d-inline-flex align-items-center justify-content-center rounded-1"
              :class="{
                'text-white fw-semibold': isSelected(day),
                'fw-semibold': isToday(day) && !isSelected(day),
              }"
              :style="{
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                background: isSelected(day)
                  ? 'var(--tblr-primary, #066fd1)'
                  : isToday(day)
                    ? 'var(--tblr-primary-lt, #162c43)'
                    : 'transparent',
                border: isToday(day) && !isSelected(day)
                  ? '1px solid var(--tblr-primary, #066fd1)'
                  : '1px solid transparent',
                color: isSelected(day)
                  ? '#fff'
                  : 'var(--tblr-body-color, #b8c4d4)',
              }"
              @mouseenter="(e) => {
                if (!isSelected(day)) e.target.style.background = 'var(--tblr-border-color, #2e3947)';
              }"
              @mouseleave="(e) => {
                if (!isSelected(day)) e.target.style.background = 'transparent';
              }"
              @click="selectDay(day)"
            >
              {{ day }}
            </span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
