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

interface ListResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_filtered: number;
    last_page: number;
  };
}

interface Options<T> {
  ajax: {
    url: string;
    method?: string;
    params?: Record<string, T[keyof T]>;
  };
  limit?: number;
  columns: Column<T>[];
  pathKey: string; // key
  showActions?: boolean;
  actionWidth?: string;
}

interface Props<T> {
  options?: Options<T>;
  filterParams?: Record<string, any>;
}

const props = withDefaults(defineProps<Props<T>>(), {
  options: () => ({
    ajax: {
      url: "",
      method: "GET",
    },
    columns: [],
    pathKey: Math.random().toString(36).slice(2, 9),
    showActions: true,
    actionWidth: "15%",
  }),
  filterParams: () => ({}),
});

const options = computed(() => {
  const opts = props.options || {};
  return {
    ajax: {
      method: "GET",
      ...opts.ajax,
    },
    columns: opts.columns || [],
    pathKey: opts.pathKey || "default-key",
    showActions: opts.showActions ?? true,
    actionWidth: opts.actionWidth || "15%",
    limit: opts.limit,
  };
});
const page = ref(1);
const limit = ref(options.value.limit || 20);
const search = ref("");
const debouncedSearch = useDebounce(search, 500);
const order_column = ref("");
const order_direction = ref("");

const rows = ref<Array<T>>([]) as Ref<T[]>;
const total = ref(0);
const total_filtered = ref(0);
const loading = ref(false);
const hasMore = ref(true);
const loadMoreTrigger = ref<HTMLElement | null>(null);

const filterToggleRef = ref<HTMLElement | null>(null);

const closeFilterPopup = () => {
  if (import.meta.client && filterToggleRef.value) {
    const dropdown = window.bootstrap?.Dropdown.getInstance(filterToggleRef.value);
    if (dropdown) {
      dropdown.hide();
    } else {
      (filterToggleRef.value as HTMLElement).click();
    }
  }
};

const responseData = async () => {
  const { data } = await useApi<ListResponse<T>>(options.value.ajax.url, {
    params: {
      search: debouncedSearch.value,
      page: rows.value.length === 0 ? 1 : page.value,
      limit: limit.value,
      order_column: order_column.value,
      order_dir: order_direction.value,
      ...props.filterParams,
    },
  });

  return data;
};

const fetchData = (response: ListResponse<T> | null, refresh: boolean) => {
  if (response) {
    if (response.data === null) {
      response.data = [];
    }
    hasMore.value = response.meta ? response.data.length === limit.value : false;
    rows.value = refresh ? response.data : [...rows.value, ...response.data];
    total.value = response.meta?.total ?? response.data.length;
    total_filtered.value = response.meta?.total_filtered ?? response.data.length;
  }
};

async function loadData(refresh = false) {
  if (loading.value || !hasMore.value) return;
  loading.value = true;

  const data = await responseData();
  fetchData(data, refresh);

  loading.value = false;
}

watch([debouncedSearch, order_column, order_direction, () => props.filterParams], () => {
  page.value = 1;
  hasMore.value = true;
  loadData(true);
}, { deep: true });

onMounted(() => {
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
  // if (!col.sortable) return;
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
  order_column.value = String(col.key);
  order_direction.value = sort;
}

function removeRow(id: number) {
  const index = rows.value.findIndex((r) => r.id === id);
  if (index !== -1) {
    rows.value.splice(index, 1);
  }
}

function reload() {
  page.value = 1;
  rows.value = [];
  hasMore.value = true;
  loadData();
}

defineExpose({ removeRow, reload });

// fetch data di server
const { data } = await useAsyncData(`data-${options.value.pathKey}`, async () => {
  const data = await responseData();
  return data;
}, { watch: [() => props.filterParams] });

if (data.value) {
  fetchData(data.value, true);
}

// end fetch
</script>

<template>
  <div>
    <!-- Search & Filter -->
    <div class="row mb-2">
      <div class="ms-auto col-sm-12 col-xl-3 col-md-4" > 
        <div class="row align-items-center justify-content-end">
          <div v-if="$slots['filter-popup']" class="col-sm-3 col-md-2 text-end py-1">
            <span ref="filterToggleRef" class="text-muted px-1 align-middle" data-bs-toggle="dropdown" data-bs-auto-close="false" aria-expanded="false" role="button" tabindex="0" style="cursor: pointer; line-height: 1;">
              <Icon name="i-tabler-filter-cog" size="1.15rem" />
            </span>
            <div class="dropdown-menu dropdown-menu-end shadow border-0 p-0" style="min-width: 300px; z-index: 1050; border-radius: 8px;">
              <div class="d-flex align-items-center justify-content-between px-3 py-2 border rounded-top-2 bg-light-custom">
                <span class="fw-semibold small text-uppercase text-muted">Filter</span>
                <span class="text-muted" role="button" tabindex="0" style="cursor: pointer; line-height: 1;" @click="closeFilterPopup">
                  <Icon name="i-tabler:x" size="1.1rem" />
                </span>
              </div>
              <div class="p-3">
                <slot name="filter-popup" />
              </div>
            </div>
          </div>
          <div class="col-sm-9 col-xl-8 col-md-8" >
            <input
              v-model="search"
              type="text"
              class="form-control py-2 px-3 rounded-1 col-7 col-md-8"
              placeholder="Search"
              autocomplete="off"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="table-responsive" style="max-height: 500px; overflow-y: auto">
      <table class="table table-vcenter table-nowrap">
        <thead class="sticky-top">
          <tr>
            <ui-th xwidth="5%" xclass="text-end">No.</ui-th>
            <ui-th v-if="options.showActions" :xwidth="options.actionWidth" xclass="text-center">
              Aksi
            </ui-th>
            <ui-th
              v-for="col in options.columns"
              :key="String(col.key)"
              :xorder="
                !(col.sortable === undefined || col.sortable === true)
                  ? ''
                  : String(col.key)
              "
              :xwidth="col.width || ''"
              :xclass="col.className || ''"
              v-on="{
                click: (e: MouseEvent) => setSort(col as Column<T>, e.target as HTMLElement)
              }"
            >
              {{ col.label }}
            </ui-th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in rows" :key="row.id">
            <td class="text-end">{{ i + 1 }}.</td>
            <td v-if="options.showActions" class="text-center py-0">
              <slot name="row-actions" :row="row" />
            </td>
            <td
              v-for="col in options.columns"
              :key="String(col.key)"
              :class="col.className || ''"
            >
              <!-- custom slot untuk cell -->
              <slot
                :name="`cell-${String(col.key)}`"
                :row="row"
                :value="row[col.key as keyof T]"
              >
                {{ col.format ? col.format(row[col.key as keyof T], row) : row[col.key as keyof T] }}
              </slot>
            </td>
          </tr>

          <tr ref="loadMoreTrigger">
            <td
              :colspan="options.columns.length + (options.showActions ? 2 : 1)"
              class="text-center"
            >
              <span v-if="loading">Memuat data...</span>
              <span v-else-if="!hasMore">Semua data telah dimuat.</span>
              <span v-else>Tidak ada data.</span>
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

<style scoped>
:root {
  --colorx-bg-dark: #ffffff;
}

/* ─── Dark Mode ────────────────────────────────────── */
:root[data-bs-theme="dark"] {
  --colorx-bg-dark: #182433;
}

.bg-light-custom {
  background-color: var(--colorx-bg-dark) !important;
}

</style>
