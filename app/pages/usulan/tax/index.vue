<script setup lang="ts">
const title = "Usulan Pajak";
useHead({ title });
</script>
<template>
  <UsulanList entityType="TAX" :title="title" icon="i-tabler:receipt-tax" basePath="/usulan/tax" />
</template>
