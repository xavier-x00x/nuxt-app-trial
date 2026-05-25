<script setup lang="ts">
const title = "Usulan Konversi Satuan Baru";
useHead({ title });
</script>
<template>
  <UsulanForm entityType="PRODUCT_UOM_CONVERSION" :title="title" icon="i-tabler:arrows-exchange" basePath="/usulan/product-uom" />
</template>
