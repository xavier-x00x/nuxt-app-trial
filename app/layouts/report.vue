<template>
  <NuxtPage />
</template>

<script setup lang="ts">
useHead({ bodyAttrs: { class: 'jrxml-fullscreen' } })
</script>

<style>
body.jrxml-fullscreen { overflow: hidden; }

@media print {
  body.jrxml-fullscreen,
  body { overflow: visible !important; background: #fff !important; }
  html, body { margin: 0 !important; padding: 0 !important; }
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
</style>
