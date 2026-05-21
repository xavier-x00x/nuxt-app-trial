<script setup lang="ts">
import type { Column } from "~/components/DataTable3.vue";

const { setFlash } = useFlash();
const { openConfirmDelete } = useConfirmDelete();
const config = useRuntimeConfig();
const title = "User Management";
useHead({ title });

interface DataList {
  id: string;
  name: string;
  username: string;
  email: string;
  store_name: string;
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
    key: "store_name",
    label: "store",
    className: "text-center",
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

const tableRef = ref(); // table ref catatan: ref dikosongkan untuk element
const { success, submitForm } = useForm();


const deleteItem = async (id: string) => {

  const { status, message } = await submitForm(`${config.public.apiUrl}/users/${id}`, {
    method: "DELETE",
  });

  if (status === 200) {
    console.log("Data berhasil dihapus:", id);
    // update data list
    tableRef.value?.removeRow(id); // update data list;
    setFlash(message, "success");
  } else {
    console.error("Gagal hapus:", message);
    setFlash(message, "error");
  }
};

const options = {
  columns,
  ajax: {
    url: `${config.public.apiUrl}/users/pagination`,
  },
  pathKey: "users",
  showActions: true,
};
</script>
<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:package" />
    <PageBody>
      <DataTable3 ref="tableRef" :options="options">
        <!-- custom cell qty -->
        <template #cell-role="{ value }">
          <span
            v-if="value"
            class="badge bg-primary-lt text-nowrap text-uppercase"
          >
            {{ value }}
          </span>
        </template>
        <template #cell-updated_at="{ value }">
          {{ formatDate(value as string) }}
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
      </DataTable3>
    </PageBody>
    <!-- <ui-prompt ref="promptElx" /> -->
    <ui-confirm-delete-modal />
  </div>
</template>
