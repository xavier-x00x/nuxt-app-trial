<script setup lang="ts">
const title = "Usulan Produk Baru";
useHead({ title });
</script>
<template>
  <UsulanForm :title="title" icon="i-tabler:box" entity-type="PRODUCT" base-path="/usulan/product" />
</template>
