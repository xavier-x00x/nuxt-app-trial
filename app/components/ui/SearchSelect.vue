<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useDebounce } from "@vueuse/core";

const props = defineProps<{
  apiUrl: string;
  limit?: number;
  xname: string;
}>();

const emit = defineEmits(["update:modelValue"]);

const items = ref<Product[]>([]);
const page = ref(1);
const loading = ref(false);
const hasMore = ref(true);
const searchQuery = ref("");
const selectedItem = ref("");
const debouncedSearch = useDebounce(searchQuery, 500);

const showDropdown = ref(false);
const dropUp = ref(false);

const wrapper = ref<HTMLElement | null>(null);
const dropdownx = ref<HTMLElement | null>(null);
const searchInput = ref<HTMLElement | null>(null);

interface Product {
  id: number;
  sku: string;
  name: string;
  price: string;
  qty: string;
}

interface ProductListResponse {
  data: Product[];
  total: number;
  total_filtered: number;
}

const fetchData = async () => {
  if (loading.value || !hasMore.value) return;
  loading.value = true;

  try {
    const url = `${props.apiUrl}?page=${page.value}&limit=${
      props.limit || 10
    }&search=${encodeURIComponent(searchQuery.value)}`;
    const res = await $fetch<ProductListResponse>(url);

    if (res.data.length < (props.limit || 10)) {
      hasMore.value = false;
    }

    res.data.forEach((product) => {
      product.price = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(product.price));

      product.qty = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
      }).format(Number(product.qty));
    });

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

const selectItem = (item: Product) => {
  selectedItem.value = item.sku + " - " + item.name;
  emit("update:modelValue", item.sku);
  showDropdown.value = false;
};

const handleFocus = async () => {
  searchQuery.value = "";
  showDropdown.value = true;
  await nextTick();
  checkDropdownPosition();
};

const checkDropdownPosition = () => {
  if (!wrapper.value || !dropdownx.value) return;
  const rect = wrapper.value.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const dropdownHeight = dropdownx.value.offsetHeight || 200; // fallback
  dropUp.value = spaceBelow < dropdownHeight;
};

const handleClickOutside = (e: MouseEvent) => {
  if (wrapper.value && !wrapper.value.contains(e.target as Node)) {
    showDropdown.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  fetchData();

  const dropdownElement = document.getElementById(props.xname);
  if (dropdownElement) {
    dropdownElement.addEventListener("shown.bs.dropdown", function () {
      searchInput.value?.focus();
      if (dropdownx.value) {
        dropdownx.value.scrollTop = 0;
      }
    });
  }
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div ref="wrapper" class="position-relative" :class="dropUp ? 'dropup' : ''">
    <!-- Input Search -->
    <input
      :id="props.xname"
      v-model="selectedItem"
      name="search"
      type="text"
      class="form-control dropdown-toggle"
      placeholder="Cari..."
      data-bs-toggle="dropdown"
      readonly
      @focus="handleFocus"
    />

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
        style="max-height: 200px; overflow-y: auto"
        @scroll="handleScroll"
      >
        <div
          v-for="item in items"
          :key="item.id"
          class="dropdown-item"
          @click="selectItem(item)"
        >
          {{ `${item.sku} - ${item.name}` }}
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
