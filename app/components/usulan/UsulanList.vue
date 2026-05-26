<script setup lang="ts">
import type { Column } from "~/components/DataTable3.vue";

const props = withDefaults(defineProps<{
  entityType?: string;
  title: string;
  icon: string;
  basePath: string;
}>(), {
  entityType: "",
  title: "Proposals",
  icon: "i-tabler:file-check",
  basePath: "/usulan",
});

interface DataList {
  id: string;
  reference_number: string;
  entity_type: string;
  action_type: string;
  total_items: number;
  status: string;
  proposed_by_id: string;
  proposed_by_name: string;
  reason: string | null;
  created_at: string;
}

const entityColor: Record<string, string> = {
  PRODUCT: "bg-blue text-white",
  PRODUCT_PRICE: "bg-indigo text-white",
  PRODUCT_UOM_CONVERSION: "bg-purple text-white",
  SUPPLIER: "bg-teal text-white",
  PRODUCT_SUPPLIER: "bg-cyan text-white",
  CHART_OF_ACCOUNT: "bg-orange text-white",
  TAX: "bg-pink text-white",
};

const actionColor: Record<string, string> = {
  CREATE: "bg-success text-white",
  UPDATE: "bg-primary text-white",
  DELETE: "bg-danger text-white",
};

const statusColor: Record<string, string> = {
  PENDING: "bg-warning text-dark",
  APPROVED: "bg-success text-white",
  REJECTED: "bg-danger text-white",
  EXECUTED: "bg-secondary text-white",
};

const columns: Column<DataList>[] = [
  { key: "reference_number", label: "Reference Number" },
  { key: "entity_type", label: "Entity Type", className: "text-center" },
  { key: "action_type", label: "Action", className: "text-center" },
  { key: "total_items", label: "Items", className: "text-center" },
  { key: "status", label: "Status", className: "text-center" },
  { key: "proposed_by_name", label: "Proposed By" },
  { key: "reason", label: "Reason" },
  { key: "created_at", label: "Created At", className: "text-center" },
];

defineSlots<{
  'filter-popup'?: (props: {}) => any;
}>();

const entityEditBase: Record<string, string> = {
  PRODUCT: "/usulan/product/edit",
  SUPPLIER: "/usulan/supplier/edit",
  CHART_OF_ACCOUNT: "/usulan/coa/edit",
  TAX: "/usulan/tax/edit",
  PRODUCT_PRICE: "/usulan/product-price/edit",
  PRODUCT_UOM_CONVERSION: "/usulan/product-uom/edit",
  PRODUCT_SUPPLIER: "/usulan/product-supplier/edit",
};

const editUrl = (row: DataList) => {
  const base = entityEditBase[row.entity_type];
  return base ? `${base}/${row.id}` : `/master-data/${row.id}`;
};

const filterStatus = ref("");

const filterParams = computed(() => {
  const p: Record<string, any> = {};
  if (filterStatus.value) p.status = filterStatus.value;
  if (props.entityType) p.entity_type = props.entityType;
  return p;
});

const options = {
  columns,
  ajax: {
    url: `/master-data/pagination`,
  },
  pathKey: "usulan-list",
  showActions: true,
  actionWidth: "15%",
};
</script>
<template>
  <div>
    <PageHeader :title="title" :icon="icon">
      <NuxtLink
        :to="`${basePath}/new`"
        class="btn btn-primary rounded-1 d-none d-sm-inline-block"
      >
        <Icon name="i-tabler:plus" class="icon icon-2 me-0" />
        New Proposal
      </NuxtLink>
    </PageHeader>
    <PageBody>
      <DataTable3 :options="options" :filter-params="filterParams">
        <template #filter-popup>
          <div class="mb-2">
            <label class="form-label">Status</label>
            <select v-model="filterStatus" class="form-select rounded-1">
              <option value="">All</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="EXECUTED">EXECUTED</option>
            </select>
          </div>
          <slot name="filter-popup" />
        </template>

        <template #cell-entity_type="{ value }">
          <span :class="['badge', entityColor[value as string] || 'bg-secondary']">
            {{ value }}
          </span>
        </template>
        <template #cell-action_type="{ value }">
          <span :class="['badge', actionColor[value as string] || 'bg-secondary']">
            {{ value }}
          </span>
        </template>
        <template #cell-status="{ value }">
          <span :class="['badge', statusColor[value as string] || 'bg-secondary']">
            {{ value }}
          </span>
        </template>
        <template #cell-reason="{ value }">
          <span :title="(value as string) || ''" class="d-inline-block text-truncate" style="max-width: 200px;">
            {{ value || '-' }}
          </span>
        </template>
        <template #cell-created_at="{ value }">
          {{ formatDate(value as string) }}
        </template>

        <template #row-actions="{ row }">
          <div class="d-flex gap-1">
            <NuxtLink
              v-if="row.status === 'PENDING'"
              :to="editUrl(row as DataList)"
              class="btn btn-sm py-1 px-2 rounded-1 text-nowrap btn-warning text-dark"
            >
              <Icon name="i-tabler:pencil" class="icon icon-2" />
              Edit
            </NuxtLink>
            <NuxtLink
              :to="`/master-data/${row.id}`"
              class="btn btn-sm py-1 px-2 rounded-1 text-nowrap"
            >
              <Icon name="i-tabler:eye" class="icon icon-2" />
              Detail
            </NuxtLink>
          </div>
        </template>
      </DataTable3>
    </PageBody>
  </div>
</template>
