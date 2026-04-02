<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import { useDebounce } from "@vueuse/core";

const { syncData } = useSyncRoutes();
const { setFlash } = useFlash();
const { openConfirmDelete } = useConfirmDelete();
const title = "Product";
useHead({
  title: title,
});

const page = ref(1);
const limit = ref(20);
const order_by = ref("name");
const search = ref("");
const debouncedSearch = useDebounce(search, 500);
const total = ref(0);
const total_filtered = ref(0);

const dataList = ref<DataList[]>([]);
const loading = ref(false);
const hasMore = ref(true);
const loadMoreTrigger = ref<HTMLElement | null>(null);
const load_data = ref(false);

interface DataList {
  id: number;
  path: string;
  name: string;
}

interface DataListResponse {
  data: DataList[];
  total: number;
  total_filtered: number;
}

async function loadDataList() {
  if (loading.value || !hasMore.value) return;

  loading.value = true;

  try {
    if (dataList.value.length === 0) page.value = 1;
    const res = await $fetch<DataListResponse>(
      "http://localhost:3050/api/autorization/routes",
      {
        params: {
          search: debouncedSearch.value,
          page: page.value,
          limit: limit.value,
          order_by: order_by.value,
        },
      }
    );

    if (res.data.length < limit.value) {
      hasMore.value = false;
    }

    total.value = res.total;
    total_filtered.value = res.total_filtered;

    dataList.value.push(...res.data);
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
}

watch([debouncedSearch, order_by], () => {
  page.value = 1;
  dataList.value = [];
  hasMore.value = true;
  setTimeout(() => {
    loadDataList();
  }, 500);
});

const onClickHandler = async () => {
  load_data.value = true;
  await syncData();
  load_data.value = false;

  page.value = 1;
  dataList.value = [];
  hasMore.value = true;
  setTimeout(() => {
    loadDataList();
  }, 500);
};

const deleteItem = async (id: number) => {
  try {
    await $fetch(`http://localhost:3050/api/autorization/routes/${id}`, {
      method: "DELETE",
    });
    console.log("Data berhasil dihapus:", id);
    const index = dataList.value.findIndex((item) => item.id === id);
    if (index !== -1) {
      dataList.value.splice(index, 1);
    }
    setFlash("Data berhasil dihapus", "success");
  } catch (err) {
    console.error("Gagal hapus:", err);
  }
};

// const promptElx = ref<unknown>(null);

// const onDeleteHandler = async (data) => {
//   promptElx.value?.show(
//     "Hapus Data",
//     `Yakin ingin menghapus data "${data.name}" ?`
//   );

//   // const index = dataList.value.findIndex((item) => item.id === idx);
//   // if (index !== -1) {
//   //   try {
//   //     await $fetch("http://localhost:3050/api/autorization/routes/" + idx, {
//   //       method: "DELETE",
//   //     });
//   //     dataList.value.splice(index, 1);
//   //     setFlash("Data berhasil dihapus", "success");
//   //   } catch (err) {
//   //     console.error(err);
//   //   }
//   // }
// };

onMounted(() => {
  loadDataList();

  const observer = new IntersectionObserver((entries) => {
    if (
      entries[0] &&
      entries[0].isIntersecting &&
      hasMore.value &&
      !loading.value
    ) {
      page.value++;
      loadDataList();
    }
  });

  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value);
  }

  const tableHeaders = document.querySelectorAll(".table-sort");
  tableHeaders.forEach((header) => {
    header.addEventListener("click", () => {
      let sort = "asc";
      if (header.classList.contains("asc")) {
        sort = "desc";
      } else if (header.classList.contains("desc")) {
        sort = "asc";
      }
      tableHeaders.forEach((h) => h.classList.remove("asc", "desc"));
      header.classList.add(sort);
      order_by.value =
        (header.parentElement?.getAttribute("data-order") || "") + " " + sort;
    });
  });
});
</script>
<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:package">
      <a
        :disabled="load_data"
        href="#"
        class="btn btn-primary d-none d-sm-inline-block"
        @click.prevent="onClickHandler"
      >
        <Icon name="i-tabler:plus" class="icon icon-2 me-0" />
        Sync Data
      </a>
    </PageHeader>
    <PageBody>
      <div class="row mb-2">
        <div class="ms-auto col-xl-2 col-md-4 col-sm-12">
          <input
            v-model="search"
            type="text"
            class="form-control py-2 px-3 rounded-1"
            placeholder="Search"
            aria-label="Search"
            aria-describedby="search"
            autocomplete="off"
            @focus="(event) => (event.target && (event.target as HTMLInputElement).select())"
          />
        </div>
      </div>
      <div class="table-responsive" style="max-height: 500px; overflow-y: auto">
        <table class="table table-vcenter table-nowrap">
          <thead class="sticky-top">
            <tr>
              <ui-th xwidth="5%" xclass="text-end">No.</ui-th>
              <ui-th xwidth="20%" xclass="text-center">action</ui-th>
              <ui-th xclass="text-center" xorder="path"> path </ui-th>
              <ui-th xclass="text-center" xorder="name"> name </ui-th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, i) in dataList" :key="item.id">
              <td class="text-end">{{ i + 1 }}.</td>
              <td class="text-center text-nowrap py-0">
                <a
                  href="#"
                  class="btn btn-sm py-1 px-2 rounded-1 text-nowrap"
                  @click="openConfirmDelete(item.id, deleteItem)"
                >
                  <Icon name="i-tabler:trash" class="icon icon-2" />
                  Delete
                </a>
              </td>
              <td class="text-center">{{ item.path }}</td>
              <td class="text-center">{{ item.name }}</td>
            </tr>
            <tr ref="loadMoreTrigger">
              <td colspan="4" class="text-center">
                <span v-if="loading">Memuat data...</span>
                <span v-else-if="!hasMore">Semua data telah dimuat.</span>
                <span v-else>Tidak ada data.</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="row mt-2">
        <div class="col">
          <span class="text-muted">
            Tampil {{ dataList.length }} dari {{ total_filtered }} (
            {{ total }} total data )
          </span>
        </div>
      </div>
    </PageBody>
    <!-- <ui-prompt ref="promptElx" /> -->
    <ui-confirm-delete-modal />
  </div>
</template>

<style scoped>
thead.sticky-top {
  z-index: 1;
}
</style>
