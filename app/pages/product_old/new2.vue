<!-- eslint-disable vue/valid-v-model -->
<script setup lang="ts">
// import { useDebounce } from "@vueuse/core";
const title = "Create New Product";
const tanggal = ref("");
useHead({
  title: title,
});

onMounted(() => {});
</script>
<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:package" />
    <PageBody>
      <div class="row justify-content-start">
        <div class="col-xl-4 col-md-6 col-sm-12">
          <div class="mb-2">
            <label class="form-label mb-1">Nama Produk</label>
            <input
              type="text"
              class="form-control rounded-1"
              name="name"
              placeholder="Input Nama Produk"
            />
          </div>
          <div class="mb-2">
            <label class="form-label mb-1">Nama Produk</label>
            <input
              type="text"
              class="form-control rounded-1"
              name="name"
              placeholder="Input Nama Produk"
            />
          </div>
          <div class="mb-2">
            <label class="form-label mb-1">Nama Produk</label>
            <input
              type="text"
              class="form-control rounded-1"
              name="name"
              placeholder="Input Nama Produk"
            />
          </div>
          <ui-date-pickerx v-model="tanggal" placeholder="Pilih tanggal" />
          {{ tanggal }}
        </div>
      </div>
    </PageBody>
  </div>
</template>
