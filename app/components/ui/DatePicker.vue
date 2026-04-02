<script setup lang="ts">
import { ref, onMounted } from "vue";

// Import CSS hanya di client
if (import.meta.client) {
  // import("~/plugins/litepicker/dist/js/main.js");
  // import("~/plugins/litepicker/dist/litepicker.js");
  // import("~/plugins/litepicker/dist/css/litepicker.css");
  import("~/assets/css/litepicker-custom.css");
}

const props = defineProps<{
  modelValue?: string;
  placeholder?: string;
  format?: string;
  singleMode?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const inputRef = ref<HTMLInputElement | null>(null);

onMounted(async () => {
  // Pastikan elemen sudah ter-render di DOM
  await nextTick();
  const LitepickerClass = window.Litepicker;

  if (!inputRef.value) return;
  const picker = new LitepickerClass({
    element: inputRef.value,
    format: "DD/MM/YYYY", // Format tanggal
    singleMode: true, // Hanya satu tanggal
    dropdowns: {
      minYear: new Date().getFullYear() - 15,
      maxYear: new Date().getFullYear() + 5,
      months: false,
      years: false,
    },
    buttonText: {
      previousMonth: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-1"><path d="M15 6l-6 6l6 6" /></svg>`,
      nextMonth: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-1"><path d="M9 6l6 6l-6 6" /></svg>`,
      apply: "Apply",
      cancel: "Cancel",
      reset: "Reset",
    },
    setup: (picker) => {
      picker.on("selected", (date) => {
        emit("update:modelValue", date.format(props.format || "YYYY-MM-DD"));
      });
    },
  });

  if (props.modelValue) {
    picker.setDate(props.modelValue);
  }
});
</script>

<template>
  <div class="mb-2">
    <label class="form-label" v-text="placeholder"></label>
    <div class="position-relative">
      <input
        ref="inputRef"
        type="text"
        class="form-control mb-2 rounded-1"
        :placeholder="placeholder"
        autocomplete="off"
      />
    </div>
  </div>
</template>
