<script setup lang="ts">
const title = "Usulan Harga Jual";
useHead({ title });
</script>
<template>
  <UsulanList entityType="PRODUCT_PRICE" :title="title" icon="i-tabler:currency-dollar" basePath="/usulan/product-price" />
</template>
