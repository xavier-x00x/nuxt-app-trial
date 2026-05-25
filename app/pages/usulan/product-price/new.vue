<script setup lang="ts">
const title = "Usulan Harga Jual Baru";
useHead({ title });
</script>
<template>
  <UsulanForm entityType="PRODUCT_PRICE" :title="title" icon="i-tabler:currency-dollar" basePath="/usulan/product-price" />
</template>
