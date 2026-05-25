<script setup lang="ts">
const title = "Usulan Kontrak Supplier Baru";
useHead({ title });
</script>
<template>
  <UsulanForm entityType="PRODUCT_SUPPLIER" :title="title" icon="i-tabler:affiliate" basePath="/usulan/product-supplier" />
</template>
