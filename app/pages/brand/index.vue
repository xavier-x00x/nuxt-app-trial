<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { Column } from "~/components/DataTable3.vue";

const { openConfirmDelete } = useConfirmDelete();
const title = "Brand Management";
useHead({ title });

interface DataList {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ColumnConfig extends Column<DataList> {
  key: keyof DataList;
}

const columns: ColumnConfig[] = [
  {
    key: "logo_url",
    label: "Logo",
    className: "text-center",
    width: "80px",
  },
  {
    key: "name",
    label: "Brand Name",
  },
  {
    key: "description",
    label: "Description",
  },
  {
    key: "is_active",
    label: "Status",
    className: "text-center",
    width: "100px",
  },
  {
    key: "updated_at",
    label: "Updated At",
    className: "text-center",
    width: "150px",
  },
];

const tableRef = ref();
const { success, submitForm } = useForm2();

const deleteItem = async (id: string) => {
  await submitForm(`/catalog/brands/${id}`, {
    method: "DELETE",
  });
  if (success.value) tableRef.value?.removeRow(id);
};

const options = {
  columns,
  ajax: {
    url: `/catalog/brands/pagination`,
  },
  pathKey: "brands",
  showActions: true,
};
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:tags">
      <NuxtLink
        to="/brand/new"
        class="btn btn-primary rounded-1 d-none d-sm-inline-block"
      >
        <Icon name="i-tabler:plus" class="icon icon-2 me-0" />
        Create New
      </NuxtLink>
    </PageHeader>
    <PageBody>
      <DataTable3 ref="tableRef" :options="options">
        <template #cell-logo_url="{ value }">
          <span v-if="value" class="avatar avatar-sm rounded-1" :style="{ backgroundImage: `url(${value})` }"></span>
          <span v-else class="avatar avatar-sm rounded-1 bg-secondary-lt">
            <Icon name="i-tabler:photo-off" class="icon icon-2" />
          </span>
        </template>
        <template #cell-description="{ value }">
          {{ value || '-' }}
        </template>
        <template #cell-is_active="{ value }">
          <span :class="value ? 'badge bg-success-lt text-success' : 'badge bg-danger-lt text-danger'">
            {{ value ? 'Active' : 'Inactive' }}
          </span>
        </template>
        <template #cell-updated_at="{ value }">
          {{ formatDate(value as string) }}
        </template>

        <!-- row actions -->
        <template #row-actions="{ row }">
          <NuxtLink
            :to="`/brand/${row.id}`"
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
