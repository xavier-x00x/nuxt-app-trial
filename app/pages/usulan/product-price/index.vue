<script setup lang="ts">
const title = "Usulan Harga Jual";
useHead({ title });

const { loading, submitForm } = useForm2();

const handleGenerate = async (reload: () => void) => {
  const res = await submitForm("/system/proposals/generate-prices", {
    method: "POST",
    successMessage: "Berhasil menghasilkan usulan harga!",
  });
  if (res && res.status >= 200 && res.status < 300 && !res.error) {
    reload();
  }
};
</script>

<template>
  <UsulanList entity-type="PRODUCT_PRICE" :title="title" icon="i-tabler:currency-dollar" base-path="/usulan/product-price">
    <template #actions="{ reload }">
      <button
        type="button"
        class="btn btn-success rounded-1 me-2 d-none d-sm-inline-block"
        :disabled="loading"
        @click="handleGenerate(reload)"
      >
        <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status"></span>
        <Icon v-else name="i-tabler:sparkles" class="icon icon-2 me-1" />
        Generate Usulan Harga
      </button>
    </template>
  </UsulanList>
</template>
