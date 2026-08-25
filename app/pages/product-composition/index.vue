<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { Column } from "~/components/DataTable3.vue";

const { openConfirmDelete } = useConfirmDelete();
const title = "Komposisi / BOM Management";
useHead({ title });

interface ProductRef {
  id: string;
  sku: string;
  name: string;
}

interface UOMRef {
  id: string;
  name: string;
  code: string;
}

interface DataList {
  id: string;
  parent_product_id: string;
  component_product_id: string;
  quantity: number | string;
  scrap_percentage: number | string;
  uom_id: string;
  work_center_id: string | null;
  parent_product?: ProductRef;
  component_product?: ProductRef;
  uom?: UOMRef;
  created_at: string;
  updated_at: string;
}

interface ColumnConfig extends Column<DataList> {
  key: keyof DataList;
}

const columns: ColumnConfig[] = [
  {
    key: "parent_product_id",
    label: "Produk Induk (Parent)",
  },
  {
    key: "component_product_id",
    label: "Komponen Bahan (Component)",
  },
  {
    key: "quantity",
    label: "Kuantitas",
    className: "text-center",
  },
  {
    key: "uom_id",
    label: "Satuan (UOM)",
    className: "text-center",
  },
  {
    key: "scrap_percentage",
    label: "Susut (Scrap %)",
    className: "text-center",
  },
  {
    key: "work_center_id",
    label: "Stasiun Kerja / Work Center",
    className: "text-center",
  },
  {
    key: "updated_at",
    label: "Updated At",
    className: "text-center",
  },
];

const tableRef = ref();
const { success, submitForm } = useForm2();

const deleteItem = async (id: string) => {
  await submitForm(`/catalog/product-compositions/${id}`, {
    method: "DELETE",
  });
  if (success.value) tableRef.value?.removeRow(id);
};

const options = {
  columns,
  ajax: {
    url: `/catalog/product-compositions/pagination`,
  },
  pathKey: "product-compositions",
  showActions: true,
};
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:binary-tree">
      <NuxtLink
        to="/product-composition/new"
        class="btn btn-primary rounded-1 d-none d-sm-inline-block"
      >
        <Icon name="i-tabler:plus" class="icon icon-2 me-0" />
        Create New
      </NuxtLink>
    </PageHeader>
    <PageBody>
      <DataTable3 ref="tableRef" :options="options">
        <template #cell-parent_product_id="{ row }">
          <div v-if="row.parent_product">
            <span class="badge bg-blue-lt me-1">{{ row.parent_product.sku }}</span>
            <span class="fw-semibold">{{ row.parent_product.name }}</span>
          </div>
          <span v-else class="text-muted">{{ row.parent_product_id }}</span>
        </template>

        <template #cell-component_product_id="{ row }">
          <div v-if="row.component_product">
            <span class="badge bg-indigo-lt me-1">{{ row.component_product.sku }}</span>
            <span class="fw-semibold">{{ row.component_product.name }}</span>
          </div>
          <span v-else class="text-muted">{{ row.component_product_id }}</span>
        </template>

        <template #cell-quantity="{ value }">
          <span class="badge bg-teal-lt fs-6">{{ value }}</span>
        </template>

        <template #cell-uom_id="{ row }">
          <span v-if="row.uom" class="badge bg-purple-lt">{{ row.uom.name || row.uom.code }}</span>
          <span v-else class="text-muted">{{ row.uom_id }}</span>
        </template>

        <template #cell-scrap_percentage="{ value }">
          <span v-if="Number(value) > 0" class="badge bg-warning-lt text-warning">{{ value }}%</span>
          <span v-else class="text-muted">0%</span>
        </template>

        <template #cell-work_center_id="{ value }">
          <span v-if="value" class="badge bg-secondary-lt">{{ value }}</span>
          <span v-else class="text-muted italic">-</span>
        </template>

        <template #cell-updated_at="{ value }">
          {{ formatDate(value as string) }}
        </template>

        <!-- row actions -->
        <template #row-actions="{ row }">
          <NuxtLink
            :to="`/product-composition/${row.id}`"
            class="btn btn-sm py-1 px-2 rounded-1 text-nowrap me-1"
          >
            <Icon name="i-tabler:pencil" class="icon icon-2" />
            Edit
          </NuxtLink>
          <a
            href="#"
            class="btn btn-sm py-1 px-2 rounded-1 text-nowrap"
            @click.prevent="openConfirmDelete(row.id, deleteItem)"
          >
            <Icon name="i-tabler:trash" class="icon icon-2" />
            Delete
          </a>
        </template>
      </DataTable3>
    </PageBody>
    <ui-confirm-delete-modal />
  </div>
</template>
