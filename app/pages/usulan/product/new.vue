<script setup lang="ts">
const title = "Usulan Produk Baru";
useHead({ title });
</script>
<template>
  <UsulanProductForm :title="title" icon="i-tabler:box" base-path="/usulan/product" />
</template>
