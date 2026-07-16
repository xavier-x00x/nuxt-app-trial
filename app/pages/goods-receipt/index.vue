<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { Column } from "~/components/DataTable3.vue";
import type { GoodsReceiptList } from "~/types/goods-receipt";

const title = "Penerimaan Barang (Goods Receipt)";
useHead({ title });

const { formatDate } = useDateFormatter();

const columns: Column<GoodsReceiptList>[] = [
  {
    key: "gr_number",
    label: "No. GR",
    width: "15%",
  },
  {
    key: "receipt_date",
    label: "Tanggal",
    width: "12%",
  },
  {
    key: "po_number",
    label: "No. PO",
    width: "15%",
  },
  {
    key: "supplier_name",
    label: "Supplier",
  },
  {
    key: "warehouse_name",
    label: "Gudang",
  },
  {
    key: "status",
    label: "Status",
    className: "text-center",
    width: "12%",
  },
];

const tableRef = ref();

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case "DRAFT":
      return "bg-secondary text-white";
    case "CONFIRMED":
      return "bg-success text-white";
    case "CANCELLED":
      return "bg-danger text-white";
    default:
      return "bg-secondary text-white";
  }
};

const options = {
  columns,
  ajax: {
    url: `/goods-receipts/pagination`,
  },
  pathKey: "goods_receipts",
  showActions: true,
  selectable: false,
  actionWidth: "20%",
};

const { openConfirmDelete } = useConfirmDelete();
const { success, submitForm } = useForm2();

const cancelItem = async (id: string) => {
  await submitForm(`/goods-receipts/${id}/cancel`, {
    method: "POST",
    successMessage: "Draft berhasil dihapus",
  });
  if (success.value) tableRef.value?.reload();
};
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:building-warehouse">
      <NuxtLink to="/goods-receipt/form" class="btn btn-primary rounded-1">
        <Icon name="i-tabler:plus" class="icon icon-2 me-1" />
        Buat Penerimaan
      </NuxtLink>
    </PageHeader>
    <PageBody>
      <DataTable3 ref="tableRef" :options="options">
        <template #cell-receipt_date="{ value }">
          {{ formatDate(value as string, false) }}
        </template>

        <template #cell-status="{ value }">
          <span :class="['badge', getStatusBadgeClass(value as string)]">
            {{ value }}
          </span>
        </template>

        <!-- row actions -->
        <template #row-actions="{ row }">
          <div class="d-flex gap-1">
            <NuxtLink
              :to="`/goods-receipt/${row.id}`"
              class="btn btn-sm btn-outline-secondary py-1 px-2 rounded-1 text-nowrap"
            >
              <Icon name="i-tabler:eye" class="icon icon-2" />
              Detail
            </NuxtLink>
            <NuxtLink
              v-if="row.status === 'DRAFT'"
              :to="`/goods-receipt/form?id=${row.id}`"
              class="btn btn-sm btn-outline-info py-1 px-2 rounded-1 text-nowrap"
            >
              <Icon name="i-tabler:pencil" class="icon icon-2" />
              Edit
            </NuxtLink>
            <button
              v-if="row.status === 'DRAFT'"
              class="btn btn-sm btn-outline-danger py-1 px-2 rounded-1 text-nowrap"
              @click.prevent="openConfirmDelete(row.id, cancelItem)"
            >
              <Icon name="i-tabler:trash" class="icon icon-2" />
              Hapus
            </button>
          </div>
        </template>
      </DataTable3>
    </PageBody>
    <UiConfirmDeleteModal />
  </div>
</template>
