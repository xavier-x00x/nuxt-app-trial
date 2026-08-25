<script setup lang="ts">
const title = "Usulan Brand";
useHead({ title });
</script>
<template>
  <UsulanList :title="title" icon="i-tabler:tags" entity-type="BRAND" base-path="/usulan/brand" />
</template>
