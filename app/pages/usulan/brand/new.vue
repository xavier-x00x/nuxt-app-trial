<script setup lang="ts">
const title = "Usulan Brand Baru";
useHead({ title });
</script>
<template>
  <UsulanBrandForm :title="title" icon="i-tabler:tags" base-path="/usulan/brand" />
</template>
