<template>
  <div ref="wrapperRef" class="position-relative select-search-wrapper" :class="[hasLabelOrError ? 'mb-3' : '']">
    <!-- Label -->
    <label 
      v-if="label" 
      :for="inputId" 
      class="form-label mb-1"
    >
      {{ label }}
      <span v-if="required" class="text-danger">*</span>
    </label>

    <!-- Dropdown Toggle Input -->
    <div 
      class="input-icon position-relative select-toggle"
      @click="toggleDropdown"
    >
      <input
        :id="inputId"
        :value="displayValue"
        type="text"
        :class="[
          'form-control rounded-1 input-search-toggle',
          // { 'is-invalid': !!error },
          iclass
        ]"
        :placeholder="placeholder"
        readonly
        :disabled="disabled"
        @keydown.down.prevent="openAndFocus"
        @keydown.enter.prevent="openAndFocus"
      />
      
      <!-- Clear Button & Chevron -->
      <span class="input-icon-addon-end select-addons">
        <button
          v-if="clearable && hasValue"
          type="button"
          class="btn-clear text-muted border-0 bg-transparent p-0 me-1 mt-1"
          title="Clear selection"
          @click.stop="clearSelection"
        >
          <Icon name="i-tabler:x" size="1.05rem" />
        </button>
        <Icon :name="isOpen ? 'i-tabler:chevron-up' : 'i-tabler:chevron-down'" size="1.15rem" class="text-muted" />
      </span>
    </div>

    <!-- Dropdown Menu -->
    <div 
      v-if="isOpen"
      :class="['dropdown-menu w-100 p-0 show shadow-sm border', { 'dropup-active': dropup }]"
      :style="{ zIndex: 1050 }"
    >
      <!-- Search Input inside dropdown -->
      <div class="p-0 border-bottom dropdown-search-header">
        <div class="input-icon">
          <span class="input-icon-addon">
            <Icon name="i-tabler:search" size="1rem" class="text-muted" />
          </span>
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            class="form-control rounded-0 rounded-top border-0"
            placeholder="Ketik untuk mencari..."
            @keydown.down.prevent="navigateItems('next')"
            @keydown.up.prevent="navigateItems('prev')"
            @keydown.enter.prevent="selectHighlighted"
            @keydown.esc.prevent="closeDropdown"
          />
        </div>
      </div>

      <!-- Items List -->
      <div
        ref="listRef"
        class="options-list"
        :style="{ maxHeight: maxHeight + 'px', overflowY: 'auto' }"
        @scroll="handleScroll"
      >
        <div
          v-for="(item, index) in items"
          :key="String(item[valueKey]) + '_' + index"
          :class="[
            'dropdown-item d-flex align-items-center py-2 px-3',
            { 'active-highlight': index === activeIndex }
          ]"
          @click="onSelectItem(item as T)"
          @mouseenter="activeIndex = index"
        >
          <slot name="option" :item="item">
            {{ formatItem(item as T) }}
          </slot>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="dropdown-item text-center text-muted py-2">
          <span class="spinner-border spinner-border-sm me-2" role="status"></span>
          Memuat data...
        </div>

        <!-- Empty State -->
        <div
          v-else-if="items.length === 0"
          class="dropdown-item text-muted text-center py-3"
        >
          Tidak ada data
        </div>

        <!-- All Loaded State -->
        <div
          v-if="items.length > 0 && !loading && !hasMore"
          class="dropdown-item text-muted text-center py-2 small"
        >
          Semua data telah dimuat
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="invalid-feedback d-block mt-1">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useDebounce } from '@vueuse/core';

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

interface Props {
  xname: string;
  apiUrl: string;
  valueKey: string;
  limit?: number;
  maxHeight?: number;
  placeholder?: string;
  selectFormat?: (item: T) => string;
  selectedFormat?: (item: T) => string;
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  iclass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  limit: 10,
  maxHeight: 200,
  placeholder: "Pilih data...",
  selectFormat: ((item: unknown) => `${(item as any).name || (item as any).id || ""}`) as (item: T) => string,
  selectedFormat: ((item: unknown) => `${(item as any).name || (item as any).id || ""}`) as (item: T) => string,
  label: "",
  error: "",
  required: false,
  disabled: false,
  clearable: true,
  iclass: "",
});

// ─── defineModel: 2 v-model ───────────────────────────────────────────────────
const modelValue = defineModel<any>("modelValue");
const selectedData = defineModel<T | null>("selectedData", { default: null });
// ─────────────────────────────────────────────────────────────────────────────

const inputId = useId();
const hasLabelOrError = computed(() => !!props.label || !!props.error);

// Dropdown state
const isOpen = ref(false);
const dropup = ref(false);
const wrapperRef = ref<HTMLElement | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);
const listRef = ref<HTMLElement | null>(null);

// Data state
const page = ref(1);
const items = ref<T[]>([]);
const hasMore = ref(true);
const loading = ref(false);
const searchQuery = ref("");
const displayValue = ref("");
const debouncedSearch = useDebounce(searchQuery, 400);

// Keyboard navigation
const activeIndex = ref(-1);

const formatItem = (item: T) => props.selectFormat(item);

const hasValue = computed(() => {
  const val = modelValue.value;
  return val !== undefined && val !== null && val !== "";
});

// ─── Sync display label (Pendekatan 3) ───────────────────────────────────────
const syncDisplayValue = () => {
  if (modelValue.value !== undefined && modelValue.value !== null && modelValue.value !== "") {
    // Prioritas 1: gunakan selectedData (untuk form edit sebelum items ter-load)
    if (selectedData.value) {
      displayValue.value = props.selectedFormat(selectedData.value as T);
      return;
    }
    
    // Prioritas 2: cari dari items yang sudah ter-load
    const found = items.value.find(
      (item) => item[props.valueKey] == modelValue.value
    );

    if (found) {
      displayValue.value = props.selectedFormat(found as T);
      return;
    }

    // Prioritas 3: fallback dari modelValue saja
    displayValue.value = props.selectedFormat({
      [props.valueKey]: modelValue.value,
    } as unknown as T);
  } else {
    displayValue.value = "";
  }
};

// Watch ketiganya agar label selalu sinkron
watch(modelValue,   () => syncDisplayValue());
watch(selectedData, () => syncDisplayValue());
watch(items,        () => syncDisplayValue(), { deep: true });

syncDisplayValue();
// ─────────────────────────────────────────────────────────────────────────────

const fetchData = async (reset = false) => {
  if (loading.value) return;
  if (!reset && !hasMore.value) return;

  loading.value = true;
  if (reset) {
    page.value = 1;
    items.value = [];
    hasMore.value = true;
    activeIndex.value = -1;
  }

  try {
    const { data: response } = await useApi<ApiResponse<T>>(props.apiUrl, {
      params: {
        search: debouncedSearch.value,
        page: page.value,
        limit: props.limit,
      },
    });

    if (response?.error) {
      console.error("[SelectSearch] Gagal fetch data:", response.error);
      return;
    }

    const fetchedItems = (response?.data ?? []) as T[];
    if (fetchedItems.length < props.limit) {
      hasMore.value = false;
    }

    if (page.value === 1) {
      items.value = fetchedItems as T[];
    } else {
      items.value = [...items.value, ...fetchedItems] as T[];
    }
  } catch (err) {
    console.error("[SelectSearch] HTTP request error:", err);
  } finally {
    loading.value = false;
  }
};

watch(debouncedSearch, () => fetchData(true));

const handleScroll = () => {
  if (!listRef.value || loading.value || !hasMore.value) return;
  const { scrollTop, scrollHeight, clientHeight } = listRef.value;
  if (scrollTop + clientHeight >= scrollHeight - 10) {
    page.value++;
    fetchData();
  }
};

// ─── Select item: set kedua model sekaligus ───────────────────────────────────
const onSelectItem = (item: T) => {
  modelValue.value  = item[props.valueKey];  // ← string/number
  selectedData.value = item as T;                 // ← full object
  displayValue.value = props.selectedFormat(item);
  closeDropdown();
};
// ─────────────────────────────────────────────────────────────────────────────

const clearSelection = () => {
  modelValue.value   = null;
  selectedData.value = null as unknown as T | null;
  displayValue.value = "";
  closeDropdown();
};

const toggleDropdown = () => {
  if (props.disabled) return;
  isOpen.value ? closeDropdown() : openDropdown();
};

const openDropdown = () => {
  if (wrapperRef.value) {
    const rect = wrapperRef.value.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceNeeded = (props.maxHeight || 200) + 60;
    dropup.value = spaceBelow < spaceNeeded && rect.top > spaceNeeded;
  }

  isOpen.value = true;
  searchQuery.value = "";
  fetchData(true);

  nextTick(() => {
    searchInputRef.value?.focus();
    if (listRef.value) listRef.value.scrollTop = 0;
  });
};

const closeDropdown = () => {
  isOpen.value = false;
  activeIndex.value = -1;
};

const openAndFocus = () => {
  if (!isOpen.value) openDropdown();
};

const navigateItems = (direction: 'next' | 'prev') => {
  if (items.value.length === 0) return;

  if (direction === 'next') {
    activeIndex.value = (activeIndex.value + 1) % items.value.length;
  } else {
    activeIndex.value = activeIndex.value <= 0 ? items.value.length - 1 : activeIndex.value - 1;
  }

  nextTick(() => {
    if (listRef.value) {
      const activeEl = listRef.value.querySelector('.active-highlight') as HTMLElement;
      if (activeEl) {
        const listHeight = listRef.value.clientHeight;
        const itemTop = activeEl.offsetTop;
        const itemHeight = activeEl.clientHeight;

        if (itemTop + itemHeight > listRef.value.scrollTop + listHeight) {
          listRef.value.scrollTop = itemTop + itemHeight - listHeight;
        } else if (itemTop < listRef.value.scrollTop) {
          listRef.value.scrollTop = itemTop;
        }
      }
    }
  });
};

const selectHighlighted = () => {
  if (activeIndex.value >= 0 && activeIndex.value < items.value.length) {
    onSelectItem(items.value[activeIndex.value] as T);
  }
};

const clickOutsideHandler = (event: MouseEvent) => {
  if (wrapperRef.value && !wrapperRef.value.contains(event.target as Node)) {
    closeDropdown();
  }
};

onMounted(() => document.addEventListener('click', clickOutsideHandler));
onBeforeUnmount(() => document.removeEventListener('click', clickOutsideHandler));
</script>

<style scoped>
.input-search-toggle:disabled {
  background-color: #f6f8fb !important;
  cursor: not-allowed;
}

.input-search-toggle,
.select-toggle {
  cursor: pointer;
}

.select-addons {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  z-index: 5;
}

.btn-clear {
  transition: color 0.15s ease-in-out;
}
.btn-clear:hover {
  color: var(--tblr-danger, #d63939) !important;
}

.dropdown-item {
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.dropdown-item:hover,
.active-highlight {
  background-color: var(--tblr-active-bg, #f1f5f9) !important;
  color: var(--tblr-body-color, #1d273b);
}

.dropdown-menu {
  display: block;
  top: 100%;
  left: 0;
  max-height: 350px;
  overflow: hidden;
}

.dropdown-menu.dropup-active {
  top: auto;
  bottom: 100%;
  margin-bottom: 4px;
}

.small {
  font-size: 0.75rem;
}

/* ─── Light Mode ───────────────────────────────────── */
:root {
  --colorx-bg-dark: #ffffff;
}

/* ─── Dark Mode ────────────────────────────────────── */
:root[data-bs-theme="dark"] {
  --colorx-bg-dark: #182433;
}

.options-list {
  background-color: var(--colorx-bg-dark) !important;
}

@media (prefers-color-scheme: dark) {
  .dropdown-search-header,
  .bg-light-lt {
    background-color: var(--tblr-bg-dark, #2b2b2b) !important;
    color: var(--tblr-body-color, #ffffff) !important;
  }
}
</style>