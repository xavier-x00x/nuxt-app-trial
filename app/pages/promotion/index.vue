<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { Column } from "~/components/DataTable3.vue";

const title = "Promosi & Diskon Penjualan (Promotion)";
useHead({ title });

const { formatDate } = useDateFormatter();

interface PromotionList {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  priority: number;
  is_active: boolean;
}

const columns: Column<PromotionList>[] = [
  {
    key: "name",
    label: "Nama Program Promo",
  },
  {
    key: "start_date",
    label: "Periode Mulai",
    width: "15%",
  },
  {
    key: "end_date",
    label: "Periode Berakhir",
    width: "15%",
  },
  {
    key: "priority",
    label: "Prioritas",
    className: "text-center",
    width: "10%",
  },
  {
    key: "is_active",
    label: "Status",
    className: "text-center",
    width: "12%",
  },
];

const tableRef = ref();
const { submitForm } = useForm2();

const deletePromo = async (id: string) => {
  if (!confirm("Hapus program promo ini?")) return;
  const res = await submitForm(`/sales/promotions/${id}`, { method: "DELETE" });
  if (res?.success) {
    tableRef.value?.reload();
  }
};

const options = {
  columns,
  ajax: {
    url: "/sales/promotions/pagination",
  },
  pathKey: "promotions",
  showActions: true,
  actionWidth: "12%",
};
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:discount-2">
      <NuxtLink
        to="/promotion/form"
        class="btn btn-primary rounded-1 d-none d-sm-inline-block"
      >
        <Icon name="i-tabler:plus" class="icon icon-2 me-0" />
        Buat Promo Baru
      </NuxtLink>
    </PageHeader>

    <PageBody>
      <DataTable3 ref="tableRef" :options="options">
        <template #cell-start_date="{ value }">
          {{ formatDate(value as string) }}
        </template>

        <template #cell-end_date="{ value }">
          {{ formatDate(value as string) }}
        </template>

        <template #cell-is_active="{ value }">
          <span :class="['badge', value ? 'bg-success text-white' : 'bg-secondary text-white']">
            {{ value ? 'Aktif' : 'Non-Aktif' }}
          </span>
        </template>

        <template #row-actions="{ row }">
          <div class="d-flex gap-1">
            <NuxtLink
              :to="`/promotion/form?id=${row.id}`"
              class="btn btn-sm btn-outline-info py-1 px-2 rounded-1 text-nowrap"
            >
              <Icon name="i-tabler:pencil" class="icon icon-2" />
              Edit
            </NuxtLink>
            <button
              type="button"
              class="btn btn-sm btn-outline-danger py-1 px-2 rounded-1 text-nowrap"
              @click="deletePromo(row.id)"
            >
              <Icon name="i-tabler:trash" class="icon icon-2" />
            </button>
          </div>
        </template>
      </DataTable3>
    </PageBody>
  </div>
</template>
