<script setup lang="ts">
const title = "Usulan Supplier Baru";
useHead({ title });
</script>
<template>
  <UsulanForm entityType="SUPPLIER" :title="title" icon="i-tabler:truck" basePath="/usulan/supplier" />
</template>
