<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { Column } from "~/components/DataTable3.vue";

const title = "Pemetaan Akun Otomatis (Account Mapping)";
useHead({ title });

interface AccountMappingList {
  id: string;
  transaction_type: string;
  mapping_key: string;
  account_id: string;
  account_code?: string;
  account_name?: string;
  description?: string;
}

const columns: Column<AccountMappingList>[] = [
  {
    key: "transaction_type",
    label: "Tipe Transaksi",
    width: "20%",
  },
  {
    key: "mapping_key",
    label: "Kunci Pemetaan (Mapping Key)",
    width: "25%",
  },
  {
    key: "account_name",
    label: "Akun Terhubung (COA)",
  },
  {
    key: "description",
    label: "Deskripsi",
  },
];

const tableRef = ref();

const options = {
  columns,
  ajax: {
    url: "/finance/account-mappings/pagination",
  },
  pathKey: "account-mappings",
  showActions: false,
};
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:arrows-split" />

    <PageBody>
      <DataTable3 ref="tableRef" :options="options">
        <template #cell-transaction_type="{ value }">
          <span class="badge bg-primary-lt fs-4">{{ value }}</span>
        </template>

        <template #cell-mapping_key="{ value }">
          <span class="fw-bold font-monospace">{{ value }}</span>
        </template>

        <template #cell-account_name="{ row, value }">
          <span class="fw-medium text-info">{{ value || row.account_id }}</span>
        </template>
      </DataTable3>
    </PageBody>
  </div>
</template>
