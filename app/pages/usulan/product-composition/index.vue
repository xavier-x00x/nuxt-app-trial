<script setup lang="ts">
const title = "Usulan Komposisi / BOM";
useHead({ title });
</script>
<template>
  <UsulanList :title="title" icon="i-tabler:binary-tree" entity-type="PRODUCT_COMPOSITION" base-path="/usulan/product-composition" />
</template>
