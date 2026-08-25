<script setup lang="ts">
const title = "Usulan Kontrak Supplier";
useHead({ title });
</script>
<template>
  <UsulanList entity-type="PRODUCT_SUPPLIER" :title="title" icon="i-tabler:affiliate" base-path="/usulan/product-supplier" />
</template>
