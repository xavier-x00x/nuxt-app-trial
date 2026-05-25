<script setup lang="ts">
import type { NuxtError } from '#app';

const props = defineProps<{
  error: NuxtError;
}>();

const { theme } = useTheme();

useHead({
  title: `Error ${props.error.statusCode}`,
  htmlAttrs: {
    'data-bs-theme': theme.value,
  },
});

const handleError = () => clearError({ redirect: '/' });

const is404 = computed(() => props.error.statusCode === 404);
const title = computed(() => is404.value ? 'Oops… Halaman tidak ditemukan' : 'Terjadi kesalahan');
const description = computed(() =>
  is404.value
    ? 'Halaman yang Anda cari mungkin telah dipindahkan, dihapus, atau tidak pernah ada.'
    : (props.error.message || 'Terjadi kesalahan yang tidak diharapkan. Silakan coba lagi.')
);
</script>

<template>
  <div class="page page-center">
    <div class="container-tight py-4">
      <div class="empty">
        <div class="empty-header">{{ error.statusCode }}</div>
        <p class="empty-title">{{ title }}</p>
        <p class="empty-subtitle text-secondary">
          {{ description }}
        </p>
        <div class="empty-action">
          <button class="btn btn-outline-secondary rounded-1 d-none d-sm-inline-block" @click="handleError">
            <!-- Home icon -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="icon icon-tabler icon-tabler-arrow-left"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke="currentColor"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M5 12l14 0" />
              <path d="M5 12l6 6" />
              <path d="M5 12l6 -6" />
            </svg>
            Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-center {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: var(--tblr-body-bg, #f1f5f9);
  color: var(--tblr-body-color, #1e293b);
}

.container-tight {
  max-width: 580px;
  width: 100%;
  padding-left: 1rem;
  padding-right: 1rem;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.empty-header {
  font-size: 8rem;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.04em;
  color: var(--tblr-primary, #206bc4);
  margin-bottom: 1rem;
  user-select: none;
  text-shadow: 0 4px 24px rgba(var(--tblr-primary-rgb, 32, 107, 196), 0.18);
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: var(--tblr-body-color, #1e293b);
}

.empty-subtitle {
  font-size: 1rem;
  max-width: 420px;
  margin-bottom: 1.5rem;
  color: var(--tblr-secondary-color, #626976);
}

/* Dark mode overrides via Tabler's data-bs-theme */
:root[data-bs-theme="dark"] .page-center {
  background-color: var(--tblr-body-bg, #1a2234);
  color: var(--tblr-body-color, #f8fafc);
}

:root[data-bs-theme="dark"] .empty-header {
  text-shadow: 0 4px 24px rgba(var(--tblr-primary-rgb, 32, 107, 196), 0.3);
}

:root[data-bs-theme="dark"] .empty-title {
  color: var(--tblr-body-color, #f8fafc);
}

:root[data-bs-theme="dark"] .empty-subtitle {
  color: var(--tblr-secondary-color, #979faa);
}
</style>
