<script setup lang="ts">
const { theme } = useTheme();
useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `Admin - ${titleChunk}` : "Admin";
  },
  htmlAttrs: {
    "data-bs-theme": theme.value,
  },
});
// const layout = "app-default";
</script>
<template>
  <NuxtLoadingIndicator />
  <NuxtLayout>
    <LazyNuxtPage />
  </NuxtLayout>
  <UiFlashMessage />
</template>
