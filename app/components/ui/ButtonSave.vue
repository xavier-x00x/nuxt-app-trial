<script setup lang="ts">
const props = defineProps({
  label: {
    type: String,
    default: "Simpan",
  },
  loading: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  form: {
    type: Object as PropType<HTMLFormElement | null>,
    default: null,
  },
});

const emit = defineEmits<{
  save: [];
}>();

const handleSubmit = () => {
  if (props.form) {
    props.form.requestSubmit();
  } else {
    emit("save");
  }
};
</script>

<template>
  <button
    :disabled="props.loading || props.disabled"
    type="button"
    class="btn btn-primary rounded-1"
    @click="handleSubmit"
  >
    <Icon
      v-if="!props.loading"
      name="ri:save-2-line"
      class="icon icon-2 me-1"
    />
    <span
      v-else
      class="spinner-border text-cyan icon icon-2 me-2"
      role="status"
    ></span>
    {{ props.label }}
  </button>
</template>