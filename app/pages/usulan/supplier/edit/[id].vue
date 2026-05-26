<script setup lang="ts">
const route = useRoute();
const { setFlash } = useFlash();
const id = String(route.params.id);
const title = "Edit Usulan Supplier";
useHead({ title });

const { data: resp, error } = await useApiFetch<any>(`/master-data/${id}`);
if (error.value || !resp.value?.data) {
  setFlash("Proposal tidak ditemukan", "error");
  navigateTo("/usulan/supplier");
}
</script>
<template>
  <UsulanForm
    v-if="resp?.data"
    :id="id"
    :proposal="resp.data"
    :title="title"
    icon="i-tabler:truck"
    entity-type="SUPPLIER"
    base-path="/usulan/supplier"
  />
</template>
