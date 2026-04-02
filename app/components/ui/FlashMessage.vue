<!-- eslint-disable vue/no-v-html -->
<script setup lang="ts">
import { useFlash } from "~/composables/useFlash";
import { useToast } from "~/composables/useToast.client";

const { toastEl } = useToast();

// optional: biar bisa dipanggil dari luar
// defineExpose({ show });

const { flashMessage, flashType, flashVisible } = useFlash();
</script>

<template>
  <div class="toast-container position-fixed bottom-0 end-0 p-3">
    <div
      v-if="flashVisible"
      ref="toastEl"
      class="toast show"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div class="toast-header">
        <strong class="me-auto" v-text="flashType"></strong>
        <button
          type="button"
          class="ms-2 btn-close"
          aria-label="Close"
          @click="flashVisible = false"
        ></button>
      </div>
      <div class="toast-body" v-html="flashMessage"></div>
    </div>
  </div>
</template>
