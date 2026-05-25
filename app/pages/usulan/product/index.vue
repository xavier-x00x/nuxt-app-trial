<script setup lang="ts">
const title = "Usulan Produk";
useHead({ title });
</script>
<template>
  <UsulanList :title="title" icon="i-tabler:box" entity-type="PRODUCT" base-path="/usulan/product" />
</template>
