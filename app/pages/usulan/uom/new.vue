<script setup lang="ts">
const title = "Usulan Satuan (UOM) Baru";
useHead({ title });
</script>
<template>
  <UsulanUomForm :title="title" icon="i-tabler:scale" base-path="/usulan/uom" />
</template>
