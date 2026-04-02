<script setup lang="ts">
import { useToast } from "~/composables/useToast.client";
const { toastEl, show, message, title } = useToast();

// optional: biar bisa dipanggil dari luar
defineExpose({ show });
</script>

<template>
  <div class="toast-container position-fixed top-0 end-0 p-3">
    <div
      ref="toastEl"
      class="toast"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div class="toast-header">
        <strong class="me-auto" v-text="title"></strong>
        <button
          type="button"
          class="ms-2 btn-close"
          data-bs-dismiss="toast"
          aria-label="Close"
        ></button>
      </div>
      <div class="toast-body" v-text="message"></div>
    </div>
  </div>
</template>
