<script setup lang="ts">
const route = useRoute();
const { setFlash } = useFlash();
const id = String(route.params.id);
const title = "Edit Usulan COA";
useHead({ title });

const { data: resp, error } = await useApiFetch<any>(`/master-data/${id}`);
if (error.value || !resp.value?.data) {
  setFlash("Proposal tidak ditemukan", "error");
  navigateTo("/usulan/coa");
}
</script>
<template>
  <UsulanForm
    v-if="resp?.data"
    :id="id"
    :proposal="resp.data"
    :title="title"
    icon="i-tabler:book"
    entity-type="CHART_OF_ACCOUNT"
    base-path="/usulan/coa"
  />
</template>
