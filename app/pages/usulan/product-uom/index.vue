<script setup lang="ts">
const title = "Usulan Konversi Satuan";
useHead({ title });
</script>
<template>
  <UsulanList entity-type="PRODUCT_UOM_CONVERSION" :title="title" icon="i-tabler:arrows-exchange" base-path="/usulan/product-uom" />
</template>
