<script setup lang="ts">
const title = "Usulan Kategori";
useHead({ title });
</script>
<template>
  <UsulanList :title="title" icon="i-tabler:category" entity-type="CATEGORY" base-path="/usulan/category" />
</template>
