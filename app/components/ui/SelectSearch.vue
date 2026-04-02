<script setup lang="ts">
import { useDebounce } from "@vueuse/core";

interface ApiResponse<T> {
  data: T[];
  total?: number;
}

interface Props<T> {
  xname: string;
  apiUrl: string;
  modelValue: unknown;
  valueKey: keyof T;
  limit?: number;
  maxHeight?: number;
  placeholder?: string;
  selectFormat?: (item: T) => string;
  selectedFormat?: (item: T) => string;
}

// const auth = useAuthStore();

const props = withDefaults(defineProps<Props<Record<string, unknown>>>(), {
  limit: 10,
  maxHeight: 200,
  placeholder: "Cari...",
  selectFormat: (item: Record<string, unknown>) => `${item.id ?? ""}`,
  selectedFormat: (item: Record<string, unknown>) => `${item.id ?? ""}`,
});

const emit = defineEmits<{
  (e: "update:modelValue" | "data-selected", value: unknown): void;
}>();

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

const auth = useAuthStore();

if (props.modelValue) {
  const itemx = {
    [props.valueKey]: props.modelValue,
  };
  selectedItem.value = props.selectedFormat(itemx);
}

const fetchData = async () => {
  if (loading.value || !hasMore.value) return;
  loading.value = true;

  try {
    const url = `${props.apiUrl}?page=${page.value}&limit=${
      props.limit
    }&search=${encodeURIComponent(searchQuery.value)}`;

    const res = await $fetch<ApiResponse<Record<string, unknown>>>(url, {
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
      },
    });
    // const res = await useApi<ApiResponse<Record<string, unknown>>>(url);

    if (res.data.length < props.limit) {
      hasMore.value = false;
    }

    if (page.value === 1) {
      items.value = res.data;
    } else {
      items.value.push(...res.data);
    }
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
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
  emit("update:modelValue", item[props.valueKey]);
  emit("data-selected", item);
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
    <!-- Input Search -->
    <div ref="dopdownToggle" class="input-icon" data-bs-toggle="dropdown">
      <input
        :id="props.xname"
        v-model="selectedItem"
        name="search"
        type="text"
        class="form-control rounded-1 input-search"
        :placeholder="placeholder"
        readonly
        @focus="handleFocus"
      />
      <span class="input-icon-addon">
        <Icon name="i-tabler:chevron-down" size="1.15rem" />
      </span>
    </div>

    <!-- Dropdown List -->
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
  /* position: relative; */
  padding-right: 3rem; /* beri ruang untuk panah */
  cursor: pointer;
}
.input-icon-addon {
  min-width: 3rem;
}
.dropdown-menu {
  width: max-content; /* atau min-width */
  min-width: max-content; /* pastikan tidak kepotong */
}
</style>
