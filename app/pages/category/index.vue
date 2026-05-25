<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { Column } from "~/components/DataTable3.vue";

const { openConfirmDelete } = useConfirmDelete();
const title = "Kategori Management";
useHead({ title });

interface DataList {
  id: string;
  parent_id: string | null;
  parent: { name: string } | null;
  name: string;
  slug: string;
  default_markup_pct: number;
  created_at: string;
  updated_at: string;
}

interface ColumnConfig extends Column<DataList> {
  key: keyof DataList;
}

const columns: ColumnConfig[] = [
  {
    key: "name",
    label: "Name",
  },
  {
    key: "slug",
    label: "Slug",
  },
  {
    key: "parent_id",
    label: "Parent",
    className: "text-center",
  },
  {
    key: "default_markup_pct",
    label: "Markup %",
    className: "text-center",
  },
  {
    key: "updated_at",
    label: "updated at",
    className: "text-center",
  },
];

const tableRef = ref();
const { success, submitForm } = useForm2();

const deleteItem = async (id: string) => {
  await submitForm(`/categories/${id}`, {
    method: "DELETE",
  });
  if (success.value) tableRef.value?.removeRow(id);
};

const options = {
  columns,
  ajax: {
    url: `/categories/pagination`,
  },
  pathKey: "categories",
  showActions: true,
};
</script>
<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:category">
      <NuxtLink
        to="/category/new"
        class="btn btn-primary rounded-1 d-none d-sm-inline-block"
      >
        <Icon name="i-tabler:plus" class="icon icon-2 me-0" />
        Create New
      </NuxtLink>
    </PageHeader>
    <PageBody>
      <DataTable3 ref="tableRef" :options="options">
        <template #cell-parent_id="{ row }">
          {{ row.parent?.name || '-' }}
        </template>
        <template #cell-default_markup_pct="{ value }">
          {{ value }}%
        </template>
        <template #cell-updated_at="{ value }">
          {{ formatDate(value as string) }}
        </template>

        <!-- row actions -->
        <template #row-actions="{ row }">
          <NuxtLink
            :to="`/category/${row.id}`"
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
