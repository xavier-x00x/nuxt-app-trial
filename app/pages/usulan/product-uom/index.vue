<script setup lang="ts">
const title = "Usulan Konversi Satuan";
useHead({ title });
</script>
<template>
  <UsulanList entityType="PRODUCT_UOM_CONVERSION" :title="title" icon="i-tabler:arrows-exchange" basePath="/usulan/product-uom" />
</template>
