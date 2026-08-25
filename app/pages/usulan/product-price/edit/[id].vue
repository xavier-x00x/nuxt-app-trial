<script setup lang="ts">
const route = useRoute();
const { setFlash } = useFlash();
const id = String(route.params.id);
const title = "Edit Usulan Product Price";
useHead({ title });

const { data: resp, error } = await useApiFetch<any>(`/system/proposals/${id}`);
if (error.value || !resp.value?.data) {
  setFlash("Proposal tidak ditemukan", "error");
  navigateTo("/usulan/product-price");
}
</script>
<template>
  <UsulanProductPriceForm
    v-if="resp?.data"
    :id="id"
    :proposal="resp.data"
    :title="title"
  />
</template>
