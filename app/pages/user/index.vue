<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { Column } from "~/components/DataTable.vue";
const { setFlash } = useFlash();
const { openConfirmDelete } = useConfirmDelete();
const title = "Role";
useHead({
  title: title,
});

interface DataList {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  updated_at: string;
}

const columns: Column<DataList>[] = [
  {
    key: "name",
    label: "name",
  },
  {
    key: "username",
    label: "username",
  },
  {
    key: "email",
    label: "email",
  },
  {
    key: "role",
    label: "role",
    className: "text-center",
  },
  {
    key: "updated_at",
    label: "updated at",
    className: "text-center",
  },
];

// const load_data = ref(false);
const tableRef = ref(); // table ref catatan: ref dikosongkan untuk element

// const onClickHandler = async () => {
//   load_data.value = true;
//   load_data.value = false;
//   tableRef.value?.reload(); // update data list;
// };

// const { success, submitForm } = useForm();

const deleteItem = async (id: number) => {
  try {
    // await $fetch(`http://localhost:3050/api/autorization/routes/${id}`, {
    //   method: "DELETE",
    // });

    // await submitForm(`http://localhost:3050/api/autorization/roles/${id}`, {
    //   method: "DELETE",
    // });
    // if (!success.value) return;
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
    <PageHeader :title="title" icon="i-tabler:package" />
    <PageBody>
      <DataTable2
        ref="tableRef"
        api-url="http://localhost:3050/api/users"
        :columns="columns"
        :limit="20"
        show-actions
      >
        <!-- custom cell qty -->
        <template #cell-role="{ value }">
          <span
            v-if="value"
            class="badge bg-primary-lt text-nowrap text-uppercase"
          >
            {{ value }}
          </span>
        </template>

        <!-- row actions -->
        <template #row-actions="{ row }">
          <NuxtLink
            :to="`/user/${row.id}`"
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
      </DataTable2>
    </PageBody>
    <!-- <ui-prompt ref="promptElx" /> -->
    <ui-confirm-delete-modal />
  </div>
</template>
