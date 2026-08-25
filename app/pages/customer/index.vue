<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { Column } from "~/components/DataTable3.vue";

const title = "Data Pelanggan & Member (Customer)";
useHead({ title });

interface CustomerList {
  id: string;
  code: string;
  name: string;
  phone_number?: string;
  email?: string;
  customer_tier: string;
  loyalty_points: number;
  is_active: boolean;
  created_at: string;
}

const columns: Column<CustomerList>[] = [
  {
    key: "code",
    label: "Kode Member",
    width: "16%",
  },
  {
    key: "name",
    label: "Nama Pelanggan",
  },
  {
    key: "phone_number",
    label: "No. Telepon / WA",
    width: "16%",
  },
  {
    key: "customer_tier",
    label: "Tier / Level",
    className: "text-center",
    width: "14%",
  },
  {
    key: "loyalty_points",
    label: "Poin Loyalitas",
    className: "text-end",
    width: "14%",
  },
];

const tableRef = ref();
const { submitForm } = useForm2();

const getTierBadgeClass = (tier: string) => {
  switch (tier) {
    case "PLATINUM":
      return "bg-purple text-white";
    case "GOLD":
      return "bg-yellow text-dark";
    case "SILVER":
      return "bg-secondary text-white";
    case "GROSIR_B2B":
      return "bg-indigo text-white";
    default:
      return "bg-azure-lt";
  }
};

const deleteCustomer = async (id: string) => {
  if (!confirm("Hapus data member ini?")) return;
  const res = await submitForm(`/sales/customers/${id}`, { method: "DELETE" });
  if (res?.success) {
    tableRef.value?.reload();
  }
};

const options = {
  columns,
  ajax: {
    url: "/sales/customers/pagination",
  },
  pathKey: "customers",
  showActions: true,
  actionWidth: "12%",
};

const filterParams = ref<Record<string, any>>({
  tier: "",
});
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:users">
      <NuxtLink
        to="/customer/form"
        class="btn btn-primary rounded-1 d-none d-sm-inline-block"
      >
        <Icon name="i-tabler:plus" class="icon icon-2 me-0" />
        Tambah Pelanggan Baru
      </NuxtLink>
    </PageHeader>

    <PageBody>
      <DataTable3 ref="tableRef" :options="options" :filter-params="filterParams">
        <template #filter-popup>
          <div class="mb-3">
            <label class="form-label fw-medium">Tier Member</label>
            <select v-model="filterParams.tier" class="form-select form-select-md">
              <option value="">Semua Tier</option>
              <option value="REGULAR">REGULAR</option>
              <option value="SILVER">SILVER</option>
              <option value="GOLD">GOLD</option>
              <option value="PLATINUM">PLATINUM</option>
              <option value="GROSIR_B2B">GROSIR B2B</option>
            </select>
          </div>
        </template>

        <template #cell-code="{ value }">
          <span class="fw-bold font-monospace text-primary">{{ value }}</span>
        </template>

        <template #cell-phone_number="{ value }">
          <span>{{ value || '-' }}</span>
        </template>

        <template #cell-customer_tier="{ value }">
          <span :class="['badge', getTierBadgeClass(value as string)]">
            {{ value || 'REGULAR' }}
          </span>
        </template>

        <template #cell-loyalty_points="{ value }">
          <span class="fw-bold text-warning">{{ Number(value || 0).toLocaleString('id-ID') }} Pts</span>
        </template>

        <template #row-actions="{ row }">
          <div class="d-flex gap-1">
            <NuxtLink
              :to="`/customer/form?id=${row.id}`"
              class="btn btn-sm btn-outline-info py-1 px-2 rounded-1 text-nowrap"
            >
              <Icon name="i-tabler:pencil" class="icon icon-2" />
              Edit
            </NuxtLink>
            <button
              type="button"
              class="btn btn-sm btn-outline-danger py-1 px-2 rounded-1 text-nowrap"
              @click="deleteCustomer(row.id)"
            >
              <Icon name="i-tabler:trash" class="icon icon-2" />
            </button>
          </div>
        </template>
      </DataTable3>
    </PageBody>
  </div>
</template>
