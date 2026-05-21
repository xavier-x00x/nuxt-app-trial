<script setup lang="ts">
const props = defineProps({
  to: {
    type: String,
    default: "/",
  },
});
</script>

<template>
  <NuxtLink
    :to="props.to"
    class="btn btn-outline-secondary rounded-1 d-none d-sm-inline-block"
  >
    <Icon name="ri:logout-box-line" class="icon icon-2 me-0" />
    Kembali
  </NuxtLink>
</template>