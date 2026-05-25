<script setup lang="ts">
import type { Column } from "~/components/DataTable3.vue";

const { openConfirmDelete } = useConfirmDelete();
const title = "Role";
useHead({ title });

interface DataList {
  id: number;
  name: string;
  updated_at: string;
}

const columns: Column<DataList>[] = [
  {
    key: "name",
    label: "Role Name",
    className: "text-center py-0",
  },
  {
    key: "updated_at",
    label: "Updated At",
    className: "text-center",
  },
];

const tableRef = ref(); // table ref catatan: ref dikosongkan untuk element
const { success, submitForm } = useForm2();

const deleteItem = async (id: number) => {
  await submitForm(`/roles/${id}`, {
    method: "DELETE",
  });
  if (success.value) tableRef.value?.removeRow(id);
};

const options = {
  columns,
  ajax: {
    url: `/roles/pagination`,
  },
  pathKey: "roles",
  showActions: true,
};

const filterParams = ref<Record<string, any>>({
  is_active: '',
  date_from: '',
  date_to: '',
  period:'',
});

</script>
<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:adjustments-horizontal">
      <NuxtLink
        to="/role/new"
        class="btn btn-primary rounded-1 d-none d-sm-inline-block"
      >
        <Icon name="i-tabler:plus" class="icon icon-2 me-0" />
        Create New
      </NuxtLink>
    </PageHeader>
    <PageBody>
      <DataTable3 ref="tableRef" :options="options" :filter-params="filterParams">
        <template #filter-popup>
          <div class="mb-3">
            <label class="form-label fw-medium">Status</label>
            <select v-model="filterParams.is_active" class="form-select form-select-md">
              <option value="">Semua</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div class="row g-2 mb-3">
            <div class="col-12">
              <label class="form-label fw-medium">Tanggal</label>
              <UiDatePickerRange v-model:start="filterParams.date_from" v-model:end="filterParams.date_to" class-name="form-control-md" placeholder="Pilih tanggal" />
            </div>
          </div>
          <div class="row g-2 mb-3">
            <div class="col-6">
              <label class="form-label fw-medium">Periode</label>
              <UiDatePickerPeriod v-model="filterParams.period" class-name="form-control-md" placeholder="Pilih periode" />
            </div>
          </div>
          <hr class="my-2">
          <div class="d-flex justify-content-between">
            <button class="btn btn-sm-custom btn-outline-secondary" @click="filterParams = { is_active: '', date_from: '', date_to: '' }">
              Reset
            </button>
            <span class="text-muted small align-self-center">Filter otomatis diterapkan</span>
          </div>
        </template>
        <template #cell-name="{ value }">
          <span class="badge bg-light text-dark fs-4">
            {{ value }}
          </span>
        </template>

        <template #cell-updated_at="{ value }">
          {{ formatDate(value as string) }}
        </template>

        <!-- row actions -->
        <template #row-actions="{ row }">
          <NuxtLink
            :to="`/role/${row.id}`"
            class="btn btn-sm py-1 px-2 me-2 rounded-1 text-nowrap"
          >
            <Icon name="i-tabler:edit" class="icon icon-2" />
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
    <!-- <ui-prompt ref="promptElx" /> -->
    <ui-confirm-delete-modal />
  </div>
</template>

<style scoped>
.btn-sm-custom {
    padding: 0.3125rem 0.5rem !important;
    font-size: 0.75rem !important;
    border-radius: var(--tblr-border-radius-sm) !important;
}
</style>
