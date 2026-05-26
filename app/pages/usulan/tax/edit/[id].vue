<script setup lang="ts">
const route = useRoute();
const { setFlash } = useFlash();
const id = String(route.params.id);
const title = "Edit Usulan Tax";
useHead({ title });

const { data: resp, error } = await useApiFetch<any>(`/master-data/${id}`);
if (error.value || !resp.value?.data) {
  setFlash("Proposal tidak ditemukan", "error");
  navigateTo("/usulan/tax");
}
</script>
<template>
  <UsulanForm
    v-if="resp?.data"
    :id="id"
    :proposal="resp.data"
    :title="title"
    icon="i-tabler:receipt-tax"
    entity-type="TAX"
    base-path="/usulan/tax"
  />
</template>
