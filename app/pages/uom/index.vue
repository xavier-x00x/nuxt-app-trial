<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { Column } from "~/components/DataTable3.vue";

const title = "Measurement Unit Management";
useHead({ title });

interface DataList {
  id: string;
  code: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface ColumnConfig extends Column<DataList> {
  key: keyof DataList;
}

const columns: ColumnConfig[] = [
  {
    key: "code",
    label: "Code",
    width: "10%",
  },
  {
    key: "name",
    label: "Name",
  },
  {
    key: "updated_at",
    label: "Updated At",
    className: "text-center",
  },
];

const tableRef = ref();

const options = {
  columns,
  ajax: {
    url: `/uoms/pagination`,
  },
  pathKey: "uoms",
  showActions: true,
};
</script>
<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:scale">
      <NuxtLink
        to="/uom/new"
        class="btn btn-primary rounded-1 d-none d-sm-inline-block"
      >
        <Icon name="i-tabler:plus" class="icon icon-2 me-0" />
        Create New
      </NuxtLink>
    </PageHeader>
    <PageBody>
      <DataTable3 ref="tableRef" :options="options">
        <template #cell-updated_at="{ value }">
          {{ formatDate(value as string) }}
        </template>

        <!-- row actions -->
        <template #row-actions="{ row }">
          <NuxtLink
            :to="`/uom/${row.id}`"
            class="btn btn-sm py-1 px-2 rounded-1 text-nowrap me-1"
          >
            <Icon name="i-tabler:pencil" class="icon icon-2" />
            Edit
          </NuxtLink>
        </template>
      </DataTable3>
    </PageBody>
  </div>
</template>
