<script setup lang="ts">
import type { Column } from "~/components/DataTable3.vue";

const { syncData } = useSyncRoutes();
const { openConfirmDelete } = useConfirmDelete();
const title = "Daftar Hak Akses (Permissions)";
useHead({ title });

interface DataList {
  id: string;
  path: string;
  name: string;
  updated_at: string;
}

const columns: Column<DataList>[] = [
  {
    key: "path",
    label: "Permission Path / Scope",
  },
  {
    key: "name",
    label: "Deskripsi Hak Akses",
    sortable: false,
  },
  {
    key: "updated_at",
    label: "Terakhir Diubah",
    className: "text-center",
  },
];

const load_data = ref(false);
const tableRef = ref();

const onClickHandler = async () => {
  load_data.value = true;
  await syncData();
  load_data.value = false;
  tableRef.value?.reload();
};

const { success, submitForm } = useForm2();

const deleteItem = async (id: string) => {
  await submitForm(`/permissions/${id}`, {
    method: "DELETE",
  });
  if (success.value) tableRef.value?.removeRow(id);
};

const options = {
  columns,
  ajax: {
    url: `/permissions/pagination`,
  },
  pathKey: "permissions",
  showActions: true,
};
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:lock-access">
      <button
        :disabled="load_data"
        class="btn btn-outline-primary rounded-1 d-none d-sm-inline-block"
        @click.prevent="onClickHandler"
      >
        <Icon name="i-tabler:refresh" class="icon icon-2 me-1" />
        {{ load_data ? 'Sinkronisasi...' : 'Sinkronisasi Route' }}
      </button>
    </PageHeader>
    <PageBody>
      <DataTable3 ref="tableRef" :options="options">
        <template #cell-path="{ value }">
          <code class="text-primary font-monospace fs-5">{{ value }}</code>
        </template>

        <template #cell-name="{ value }">
          <span class="fw-medium">{{ value }}</span>
        </template>

        <template #cell-updated_at="{ value }">
          {{ formatDate(value as string) }}
        </template>

        <!-- row actions -->
        <template #row-actions="{ row }">
          <a
            href="#"
            class="btn btn-sm py-1 px-2 rounded-1 text-nowrap text-danger"
            @click.prevent="openConfirmDelete(row.id, deleteItem)"
          >
            <Icon name="i-tabler:trash" class="icon icon-2" />
            Hapus
          </a>
        </template>
      </DataTable3>
    </PageBody>
    <ui-confirm-delete-modal />
  </div>
</template>
