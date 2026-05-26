<script setup lang="ts">
const route = useRoute();
const { setFlash } = useFlash();
const id = String(route.params.id);
const title = "Edit Usulan UOM Conversion";
useHead({ title });

const { data: resp, error } = await useApiFetch<any>(`/master-data/${id}`);
if (error.value || !resp.value?.data) {
  setFlash("Proposal tidak ditemukan", "error");
  navigateTo("/usulan/product-uom");
}
</script>
<template>
  <UsulanForm
    v-if="resp?.data"
    :id="id"
    :proposal="resp.data"
    :title="title"
    icon="i-tabler:arrows-exchange"
    entity-type="PRODUCT_UOM_CONVERSION"
    base-path="/usulan/product-uom"
  />
</template>
