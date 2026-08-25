<script setup lang="ts">
const title = "Usulan Satuan (UOM)";
useHead({ title });
</script>
<template>
  <UsulanList :title="title" icon="i-tabler:scale" entity-type="UOM" base-path="/usulan/uom" />
</template>
