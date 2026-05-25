<script setup lang="ts">
const title = "Usulan Akun";
useHead({ title });
</script>
<template>
  <UsulanList entityType="CHART_OF_ACCOUNT" :title="title" icon="i-tabler:book" basePath="/usulan/coa" />
</template>
