<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { Column } from "~/components/DataTable3.vue";

const { openConfirmDelete } = useConfirmDelete();
const title = "Price List Management";
useHead({ title });

interface DataList {
  id: string;
  code: string;
  name: string;
  start_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const columns: Column<DataList>[] = [
  {
    key: "code",
    label: "Code",
  },
  {
    key: "name",
    label: "Name",
  },
  {
    key: "start_date",
    label: "Effective Date",
    className: "text-center",
  },
  {
    key: "is_active",
    label: "Status",
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
  await submitForm(`/price-lists/${id}`, {
    method: "DELETE",
  });
  if (success.value) tableRef.value?.removeRow(id);
};

const options = {
  columns,
  ajax: {
    url: `/price-lists`,
  },
  pathKey: "price-lists",
  showActions: true,
};
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:tag">
      <NuxtLink
        to="/price-list/new"
        class="btn btn-primary rounded-1 d-none d-sm-inline-block"
      >
        <Icon name="i-tabler:plus" class="icon icon-2 me-0" />
        Create New
      </NuxtLink>
    </PageHeader>
    <PageBody>
      <DataTable3 ref="tableRef" :options="options">
        <template #cell-start_date="{ value }">
          {{ value ? formatDate(value as string) : "-" }}
        </template>
        <template #cell-updated_at="{ value }">
          {{ formatDate(value as string) }}
        </template>
        <template #cell-is_active="{ value }">
          <span :class="['badge', value ? 'bg-success text-white' : 'bg-danger text-white']">
            {{ value ? 'Active' : 'Inactive' }}
          </span>
        </template>

        <!-- row actions -->
        <template #row-actions="{ row }">
          <NuxtLink
            :to="`/price-list/${row.id}`"
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
