<script setup lang="ts" generic="T extends { id: number | string }">
import { useDebounce } from "@vueuse/core";

interface ApiResponse<T> {
  data: T[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    total_filtered: number;
    last_page: number;
  };
  error?: string;
}

interface Props<T> {
  xname: string;
  apiUrl: string;
  valueKey: keyof T;
  limit?: number;
  maxHeight?: number;
  placeholder?: string;
  selectFormat?: (item: T) => string;
  selectedFormat?: (item: T) => string;
}

const props = withDefaults(defineProps<Props<Record<string, unknown>>>(), {
  limit: 10,
  maxHeight: 200,
  placeholder: "Cari...",
  selectFormat: (item: Record<string, unknown>) => `${item.id ?? ""}`,
  selectedFormat: (item: Record<string, unknown>) => `${item.id ?? ""}`,
});

// ─── defineModel: 2 v-model ───────────────────────────────────────────────────
const modelValue = defineModel<unknown>("modelValue");
const selectedData = defineModel<Record<string, unknown> | null>("selectedData", {
  default: null,
});
// ─────────────────────────────────────────────────────────────────────────────

const page = ref(1);
const items = ref<Record<string, unknown>[]>([]);
const hasMore = ref(true);
const loading = ref(false);
const searchQuery = ref("");
const selectedItem = ref("");
const debouncedSearch = useDebounce(searchQuery, 500);
const showDropdown = ref(false);

const wrapper = ref<HTMLElement | null>(null);
const dropdownx = ref<HTMLElement | null>(null);
const searchInput = ref<HTMLElement | null>(null);
const dopdownToggle = ref<HTMLElement | null>(null);

// ─── Sync label dari items atau selectedData (Pendekatan 3) ───────────────────
const syncSelectedLabel = () => {
  if (modelValue.value !== "" && modelValue.value != null) {
    // Prioritas 1: cari dari items yang sudah ter-load
    const found = items.value.find(
      (item) => item[props.valueKey] == modelValue.value
    );

    if (found) {
      selectedItem.value = props.selectedFormat(found);
      return;
    }

    // Prioritas 2: gunakan selectedData (untuk form edit sebelum items ter-load)
    if (selectedData.value) {
      selectedItem.value = props.selectedFormat(selectedData.value);
      return;
    }

    // Prioritas 3: fallback dari modelValue saja
    selectedItem.value = props.selectedFormat({
      [props.valueKey]: modelValue.value,
    });
  } else {
    selectedItem.value = "";
  }
};

// Watch items: saat list ter-load, sync label
watch(items, () => syncSelectedLabel(), { deep: true });

// Watch modelValue: saat parent set ID baru (load edit data)
watch(modelValue, () => syncSelectedLabel());

// Watch selectedData: saat parent set object dari API edit
watch(selectedData, () => syncSelectedLabel());
// ─────────────────────────────────────────────────────────────────────────────

const fetchData = async () => {
  if (loading.value || !hasMore.value) return;
  loading.value = true;

  const { data: response } = await useApi<ApiResponse<T>>(props.apiUrl, {
    params: {
      search: debouncedSearch.value,
      page: page.value,
      limit: props.limit,
    },
  });

  if (response?.error) {
    console.error("Gagal fetch data:", response.error);
    loading.value = false;
    return;
  }

  const dataLength = response?.data?.length ?? 0;
  if (dataLength < props.limit) {
    hasMore.value = false;
  }

  if (page.value === 1) {
    items.value = response?.data ?? [];
  } else {
    items.value.push(...(response?.data ?? []));
  }

  loading.value = false;
};

watch(debouncedSearch, () => {
  page.value = 1;
  items.value = [];
  hasMore.value = true;
  fetchData();
});

const handleScroll = () => {
  if (!dropdownx.value) return;
  const { scrollTop, scrollHeight, clientHeight } = dropdownx.value;
  if (scrollTop + clientHeight >= scrollHeight - 5) {
    page.value++;
    fetchData();
  }
};

const selectItem = (item: Record<string, unknown>) => {
  selectedItem.value = props.selectedFormat(item);
  modelValue.value = item[props.valueKey];     // ← string/number
  selectedData.value = item;                   // ← full object
  showDropdown.value = false;
};

const handleFocus = async () => {
  searchQuery.value = "";
  showDropdown.value = true;
  await nextTick();
};

const handleClickOutside = (e: MouseEvent) => {
  if (wrapper.value && !wrapper.value.contains(e.target as Node)) {
    showDropdown.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  fetchData();
  if (dopdownToggle.value) {
    dopdownToggle.value.addEventListener("shown.bs.dropdown", function () {
      searchInput.value?.focus();
      if (dropdownx.value) {
        dropdownx.value.scrollTop = 0;
        fetchData();
      }
    });
    dopdownToggle.value.addEventListener("hide.bs.dropdown", function () {
      page.value = 1;
      items.value = [];
      hasMore.value = true;
    });
  }
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div ref="wrapper" class="position-relative">
    <div ref="dopdownToggle" class="input-icon" data-bs-toggle="dropdown">
      <input
        :id="props.xname"
        v-model="selectedItem"
        name="search"
        type="text"
        class="form-control rounded-1 input-search trialx"
        :placeholder="placeholder"
        readonly
        @focus="handleFocus"
      />
      <span class="input-icon-addon">
        <Icon name="i-tabler:chevron-down" size="1.15rem" />
      </span>
    </div>

    <div class="dropdown-menu w-100 p-0">
      <input
        ref="searchInput"
        v-model="searchQuery"
        type="text"
        class="form-control rounded-0 rounded-top border-0 cari"
        placeholder="Cari..."
      />
      <div
        ref="dropdownx"
        :style="{ maxHeight: maxHeight + 'px', overflowY: 'auto' }"
        @scroll="handleScroll"
      >
        <div
          v-for="(item, index) in items"
          :key="String(item[valueKey]) + '_' + index"
          class="dropdown-item"
          @click="selectItem(item)"
        >
          <slot name="option" :item="item">
            {{ selectFormat(item) }}
          </slot>
        </div>
        <div v-if="loading" class="dropdown-item text-center">Loading...</div>
        <div
          v-else-if="!loading && items.length === 0"
          class="dropdown-item text-muted"
        >
          Tidak ada data
        </div>
        <div
          v-if="items.length > 0 && !loading && !hasMore"
          class="dropdown-item text-muted"
        >
          Semua data telah dimuat.
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dropdown-item {
  cursor: pointer;
}
.input-search {
  padding-right: 3rem;
  cursor: pointer;
}
.input-icon-addon {
  min-width: 3rem;
}
.dropdown-menu {
  width: max-content;
  min-width: max-content;
}
</style>