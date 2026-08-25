<script setup lang="ts">
const title = "Usulan Akun";
useHead({ title });
</script>
<template>
  <UsulanList entity-type="CHART_OF_ACCOUNT" :title="title" icon="i-tabler:book" base-path="/usulan/coa" />
</template>
