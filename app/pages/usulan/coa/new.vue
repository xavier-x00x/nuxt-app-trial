<script setup lang="ts">
const title = "Usulan Akun Baru";
useHead({ title });
</script>
<template>
  <UsulanForm entityType="CHART_OF_ACCOUNT" :title="title" icon="i-tabler:book" basePath="/usulan/coa" />
</template>
