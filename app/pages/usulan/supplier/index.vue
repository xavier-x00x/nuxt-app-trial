<script setup lang="ts">
const title = "Usulan Supplier";
useHead({ title });
</script>
<template>
  <UsulanList :title="title" icon="i-tabler:truck" entityType="SUPPLIER" basePath="/usulan/supplier" />
</template>
