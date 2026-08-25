<script setup lang="ts">
const title = "Usulan Pajak";
useHead({ title });
</script>
<template>
  <UsulanList entity-type="TAX" :title="title" icon="i-tabler:receipt-tax" base-path="/usulan/tax" />
</template>
