<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { Column } from "~/components/DataTable3.vue";

const title = "Product";
useHead({
  title: title,
});

interface DataList {
  id: number;
  sku: string;
  name: string;
  price: string;
  qty: string;
}

const columns: Column<DataList>[] = [
  {
    key: "sku",
    label: "sku",
    className: "text-center",
  },
  {
    key: "name",
    label: "name",
  },
  {
    key: "price",
    label: "price",
    className: "text-end",
  },
  {
    key: "qty",
    label: "qty",
    className: "text-end",
  },
];
const tableRef = ref(); // table ref catatan: ref dikosongkan untuk element

function fNumber(value: number, digits: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number(value));
}
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:package">
      <NuxtLink
        to="/product/new"
        class="btn btn-primary d-none d-sm-inline-block"
      >
        <Icon name="i-tabler:plus" class="icon icon-2 me-0" />
        Create New
      </NuxtLink>
      <NuxtLink to="/product/new" class="btn btn-primary d-sm-none btn-icon">
        <Icon name="i-tabler:plus" class="icon" />
      </NuxtLink>
    </PageHeader>
    <PageBody>
      <DataTable3
        ref="tableRef"
        xkey="products"
        api-url="http://localhost:3050/api/products/list"
        :columns="columns"
        :limit="20"
      >
        <!-- custom cell price -->
        <template #cell-price="{ value }">
          <div class="d-flex justify-content-between">
            <span>Rp.</span>
            <span>{{ fNumber(Number(value), 2) }}</span>
          </div>
        </template>

        <!-- row actions -->
        <!-- <template #row-actions="{ row }">
          <a
            href="#"
            class="btn btn-sm py-1 px-2 rounded-1 text-nowrap"
            @click.prevent="openConfirmDelete(row.id, deleteItem)"
          >
            <Icon name="i-tabler:trash" class="icon icon-2" />
            Delete
          </a>
        </template> -->
      </DataTable3>
    </PageBody>
  </div>
</template>
