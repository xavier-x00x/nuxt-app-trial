<script setup lang="ts">
const title = "Usulan Kategori Baru";
useHead({ title });
</script>
<template>
  <UsulanCategoryForm :title="title" icon="i-tabler:category" base-path="/usulan/category" />
</template>
