<script setup lang="ts">
import { ref, onMounted } from "vue";
// import Litepicker from "litepicker";

// Import CSS hanya di client
if (import.meta.client) {
  import("litepicker/dist/litepicker.js");
  // import("~/plugins/litepicker/dist/litepicker.js");
  // import("litepicker/dist/css/litepicker.css");
  // import("~/assets/css/litepicker-custom.css");
  // const module = await import("litepicker");
  // Litepicker = module.default;
}
// import("~/assets/css/tabler-vendors.min.css");

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

  if (!inputRef.value) return;
  const picker = new Litepicker({
    element: inputRef.value,
    format: "DD/MM/YYYY", // Format tanggal
    // singleMode: true, // Hanya satu tanggal
    // dropdowns: {
    //   minYear: new Date().getFullYear() - 150,
    //   maxYear: new Date().getFullYear() + 5,
    //   months: false,
    //   years: false,
    // },
    //   buttonText: {
    //     previousMonth: `<!-- Download SVG icon from http://tabler.io/icons/icon/chevron-left -->
    // <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-1"><path d="M15 6l-6 6l6 6" /></svg>`,
    //     nextMonth: `<!-- Download SVG icon from http://tabler.io/icons/icon/chevron-right -->
    // <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-1"><path d="M9 6l6 6l-6 6" /></svg>`,
    //     apply: "Apply",
    //     cancel: "Cancel",
    //     reset: "Reset",
    //   },
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
    <label class="form-label">Datepicker</label>
    <input
      id="datepicker-default"
      ref="inputRef"
      class="form-control mb-2"
      placeholder="Select a date"
      autocomplete="off"
    />
  </div>
</template>
