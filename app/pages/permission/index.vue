<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { Column } from "~/components/DataTable3.vue";

const { syncData } = useSyncRoutes();
const { setFlash } = useFlash();
const { openConfirmDelete } = useConfirmDelete();
const title = "Permission";
useHead({
  title: title,
});

interface DataList {
  id: number;
  path: string;
  name: string;
}

const columns: Column<DataList>[] = [
  {
    key: "path",
    label: "path",
    className: "text-center",
  },
  {
    key: "name",
    label: "name",
    className: "text-center",
    sortable: false,
  },
];

const load_data = ref(false);
const tableRef = ref(); // table ref catatan: ref dikosongkan untuk element

const onClickHandler = async () => {
  load_data.value = true;
  await syncData();
  load_data.value = false;
  tableRef.value?.reload(); // update data list;
};

const deleteItem = async (id: number) => {
  try {
    await $fetch(`http://localhost:3050/api/autorization/routes/${id}`, {
      method: "DELETE",
    });
    console.log("Data berhasil dihapus:", id);
    // update data list
    tableRef.value?.removeRow(id); // update data list;
    setFlash("Data berhasil dihapus", "success");
  } catch (err) {
    console.error("Gagal hapus:", err);
  }
};
</script>
<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:package">
      <a
        :disabled="load_data"
        href="#"
        class="btn btn-primary rounded-1 d-none d-sm-inline-block"
        @click.prevent="onClickHandler"
      >
        <Icon name="i-tabler:replace-filled" class="icon icon-2 me-0" />
        Sync Data
      </a>
    </PageHeader>
    <PageBody>
      <DataTable3
        ref="tableRef"
        xkey="routes"
        api-url="http://localhost:3050/api/autorization/routes"
        :columns="columns"
        :limit="20"
        show-actions
      >
        <!-- custom cell qty -->
        <!-- <template #cell-qty="{ value }">
          <span
            :class="['badge', (value as number) > 50 ? 'bg-success' : 'bg-danger']"
          >
            {{ value }}
          </span>
        </template> -->

        <!-- row actions -->
        <template #row-actions="{ row }">
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
