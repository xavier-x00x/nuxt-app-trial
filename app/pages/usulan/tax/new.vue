<script setup lang="ts">
const title = "Usulan Pajak Baru";
useHead({ title });
</script>
<template>
  <UsulanForm entityType="TAX" :title="title" icon="i-tabler:receipt-tax" basePath="/usulan/tax" />
</template>
