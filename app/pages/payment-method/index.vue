<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { Column } from "~/components/DataTable3.vue";

const title = "Metode Pembayaran (Payment Method)";
useHead({ title });

interface PaymentMethodList {
  id: string;
  code: string;
  name: string;
  type: string;
  is_active: boolean;
}

const columns: Column<PaymentMethodList>[] = [
  {
    key: "code",
    label: "Kode",
    width: "20%",
  },
  {
    key: "name",
    label: "Nama Metode Pembayaran",
  },
  {
    key: "type",
    label: "Tipe Pembayaran",
    width: "20%",
  },
  {
    key: "is_active",
    label: "Status",
    className: "text-center",
    width: "15%",
  },
];

const tableRef = ref();

const options = {
  columns,
  ajax: {
    url: "/finance/payment-methods/pagination",
  },
  pathKey: "payment-methods",
  showActions: false,
};
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:credit-card" />

    <PageBody>
      <DataTable3 ref="tableRef" :options="options">
        <template #cell-type="{ value }">
          <span class="badge bg-secondary-lt fs-4">{{ value || 'TRANSFER' }}</span>
        </template>

        <template #cell-is_active="{ value }">
          <span :class="['badge', value ? 'bg-success text-white' : 'bg-secondary text-white']">
            {{ value ? 'Aktif' : 'Non-Aktif' }}
          </span>
        </template>
      </DataTable3>
    </PageBody>
  </div>
</template>
