<script setup lang="ts" generic="T extends { id: number | string }">
import { useDebounce } from "@vueuse/core";

export interface Column<T> {
  key: keyof T;
  label: string;
  className?: string;
  width?: string;
  sortable?: boolean;
  format?: (value: T[keyof T], row: T) => string;
}

interface Props<T> {
  apiUrl: string;
  columns: Column<T>[];
  limit?: number;
  showActions?: boolean;
}

const props = defineProps<Props<T>>();

const page = ref(1);
const limit = ref(props.limit || 20);
const order_by = ref("");
const search = ref("");
const debouncedSearch = useDebounce(search, 500);

const rows = ref<Array<T>>([]) as Ref<T[]>;
const total = ref(0);
const total_filtered = ref(0);
const hasMore = ref(true);
const loadMoreTrigger = ref<HTMLElement | null>(null);

interface ListResponse<T> {
  data: T[];
  total: number;
  total_filtered: number;
}

// Computed query parameters untuk useFetch
const queryParams = computed(() => ({
  search: debouncedSearch.value,
  page: rows.value.length === 0 ? 1 : page.value,
  limit: limit.value,
  order_by: order_by.value,
}));

// useFetch dengan reactivity (tanpa await)
const {
  data: fetchData,
  pending: loading,
  error,
  refresh,
} = useFetch<ListResponse<T>>(props.apiUrl, {
  query: queryParams,
  server: true, // client-side only untuk infinite scroll
  default: () => ({ data: [], total: 0, total_filtered: 0 }),
});

async function loadData() {
  console.log("loadData", loading.value);
  if (import.meta.server) return;
  if (!hasMore.value) return;

  try {
    await refresh();

    if (fetchData.value) {
      const res = fetchData.value;

      if (res.data.length < limit.value) {
        hasMore.value = false;
      }

      // Jika halaman pertama atau ada perubahan search/sort, replace data
      if (page.value === 1 || rows.value.length === 0) {
        rows.value = [...res.data];
      } else {
        // Untuk infinite scroll, append data
        rows.value.push(...res.data);
      }

      total.value = res.total;
      total_filtered.value = res.total_filtered;
    }
  } catch (err) {
    console.error("Error loading data:", err);
  }
}

// Watch untuk reset data ketika search atau sort berubah
watch([debouncedSearch, order_by], () => {
  page.value = 1;
  rows.value = [];
  hasMore.value = true;
  nextTick(() => {
    loadData();
  });
});

watch([loading], () => {});

onMounted(async () => {
  loadData();

  const observer = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting && hasMore.value && !loading.value) {
      page.value++;
      loadData();
    }
  });

  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value);
  }
});

function setSort(col: Column<T>, header: HTMLElement) {
  if (!(col.sortable === undefined || col.sortable === true)) return;

  const parent = header.closest(".table-sort") as HTMLElement;
  let sort = "asc";

  if (parent.classList.contains("asc")) {
    sort = "desc";
  } else if (parent.classList.contains("desc")) {
    sort = "asc";
  }

  document
    .querySelectorAll(".table-sort")
    .forEach((h) => h.classList.remove("asc", "desc"));
  parent.classList.add(sort);
  order_by.value = String(col.key) + " " + sort;
}

function removeRow(id: number | string) {
  const index = rows.value.findIndex((r) => r.id === id);
  if (index !== -1) {
    rows.value.splice(index, 1);
    total_filtered.value--;
    total.value--;
  }
}

function reload() {
  page.value = 1;
  rows.value = [];
  hasMore.value = true;
  search.value = "";
  order_by.value = "";
  nextTick(() => {
    loadData();
  });
}

defineExpose({ removeRow, reload, refresh });
</script>

<template>
  <div>
    <!-- Search -->
    <div class="row mb-2">
      <div class="ms-auto col-xl-2 col-md-4 col-sm-12">
        <input
          v-model="search"
          type="text"
          class="form-control py-2 px-3 rounded-1"
          placeholder="Search"
          autocomplete="off"
        />
      </div>
    </div>

    <!-- Table -->
    <div class="table-responsive" style="max-height: 500px; overflow-y: auto">
      <table class="table table-vcenter table-nowrap">
        <thead class="sticky-top">
          <tr>
            <ui-th xwidth="5%" xclass="text-end">No.</ui-th>
            <ui-th v-if="props.showActions" xwidth="15%" xclass="text-center">
              Aksi
            </ui-th>
            <ui-th
              v-for="col in props.columns"
              :key="String(col.key)"
              :xorder="
                !(col.sortable === undefined || col.sortable === true)
                  ? ''
                  : String(col.key)
              "
              :xwidth="col.width || ''"
              :xclass="col.className || ''"
              v-on="col.key ? { click: (e: MouseEvent) => setSort(col, e.target as HTMLElement) } : {}"
            >
              {{ col.label }}
            </ui-th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in rows" :key="row.id">
            <td class="text-end">{{ i + 1 }}.</td>
            <td v-if="props.showActions" class="text-center py-0">
              <slot name="row-actions" :row="row" />
            </td>
            <td
              v-for="col in props.columns"
              :key="String(col.key)"
              :class="col.className || ''"
            >
              <!-- custom slot untuk cell -->
              <slot
                :name="`cell-${String(col.key)}`"
                :row="row"
                :value="row[col.key]"
              >
                {{ col.format ? col.format(row[col.key], row) : row[col.key] }}
              </slot>
            </td>
          </tr>

          <tr ref="loadMoreTrigger">
            <td
              :colspan="props.columns.length + (props.showActions ? 2 : 1)"
              class="text-center"
            >
              <span v-if="loading">Memuat data...</span>
              <span v-else-if="!hasMore">Semua data telah dimuat.</span>
              <span v-else-if="error">Terjadi kesalahan saat memuat data.</span>
              <span v-else-if="rows.length === 0">Tidak ada data.</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Info -->
    <div class="row mt-2">
      <div class="col">
        <span class="text-muted">
          Tampil {{ rows.length }} dari {{ total_filtered }} ( {{ total }} total
          data )
        </span>
      </div>
    </div>
  </div>
</template>
