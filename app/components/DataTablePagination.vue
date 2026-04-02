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
const loading = ref(false);

interface ListResponse<T> {
  data: T[];
  total: number;
  total_filtered: number;
}

async function loadData() {
  loading.value = true;
  try {
    const res = await $fetch<ListResponse<T>>(props.apiUrl, {
      params: {
        search: debouncedSearch.value,
        page: page.value,
        limit: limit.value,
        order_by: order_by.value,
      },
    });

    rows.value = res.data;
    total.value = res.total;
    total_filtered.value = res.total_filtered;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
}

watch([debouncedSearch, order_by, limit], () => {
  page.value = 1;
  loadData();
});

watch(page, () => {
  loadData();
});

onMounted(() => {
  loadData();
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

function removeRow(id: number) {
  const index = rows.value.findIndex((r) => r.id === id);
  if (index !== -1) {
    rows.value.splice(index, 1);
    total_filtered.value--;
    total.value--;
  }
}

function reload() {
  page.value = 1;
  loadData();
}

defineExpose({ removeRow, reload });

/** 🔹 Buat daftar halaman dengan ellipsis */
const pages = computed(() => {
  const totalPages = Math.ceil(total_filtered.value / limit.value);
  const current = page.value;
  const delta = 2; // tampilkan 2 halaman di kiri & kanan current
  const range: (number | "...")[] = [];

  if (totalPages <= 7) {
    // Kalau total halaman <= 7, tampil semua
    for (let i = 1; i <= totalPages; i++) range.push(i);
  } else {
    range.push(1);
    if (current - delta > 2) range.push("...");

    for (
      let i = Math.max(2, current - delta);
      i <= Math.min(totalPages - 1, current + delta);
      i++
    ) {
      range.push(i);
    }

    if (current + delta < totalPages - 1) range.push("...");
    range.push(totalPages);
  }

  return range;
});
</script>

<template>
  <div>
    <!-- Search + Limit -->
    <div class="row mb-2">
      <div class="col-sm-12 col-md-6">
        <div class="d-flex align-items-center">
          <span class="me-2">Tampilkan</span>
          <select
            v-model="limit"
            class="form-select form-select-sm"
            style="width: auto"
          >
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
          <span class="ms-2">baris</span>
        </div>
      </div>

      <div class="ms-auto col-md-4 col-sm-12">
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
          <tr v-if="rows.length === 0 && !loading">
            <td
              :colspan="props.columns.length + (props.showActions ? 2 : 1)"
              class="text-center"
            >
              Tidak ada data.
            </td>
          </tr>

          <tr v-for="(row, i) in rows" :key="row.id">
            <td class="text-end">{{ (page - 1) * limit + i + 1 }}.</td>
            <td v-if="props.showActions" class="text-center">
              <slot name="row-actions" :row="row" />
            </td>
            <td
              v-for="col in props.columns"
              :key="String(col.key)"
              :class="col.className || ''"
            >
              <slot
                :name="`cell-${String(col.key)}`"
                :row="row"
                :value="row[col.key]"
              >
                {{ col.format ? col.format(row[col.key], row) : row[col.key] }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Info + Smart Pagination -->
    <div class="row mt-2 align-items-center">
      <div class="col">
        <span class="text-muted">
          Tampil {{ rows.length }} dari {{ total_filtered }} ( {{ total }} total
          data )
        </span>
      </div>

      <div class="col-auto">
        <nav>
          <ul class="pagination mb-0">
            <li class="page-item" :class="{ disabled: page === 1 }">
              <a class="page-link" href="#" @click.prevent="page--">«</a>
            </li>

            <li
              v-for="p in pages"
              :key="p"
              class="page-item"
              :class="{ active: page === p }"
            >
              <a
                v-if="p !== '...'"
                class="page-link"
                href="#"
                @click.prevent="page = p as number"
              >
                {{ p }}
              </a>
              <span v-else class="page-link">…</span>
            </li>

            <li
              class="page-item"
              :class="{ disabled: page === Math.ceil(total_filtered / limit) }"
            >
              <a class="page-link" href="#" @click.prevent="page++">»</a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </div>
</template>
