<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import { useDebounce } from "@vueuse/core";
const title = "Product";
useHead({
  title: title,
});

const auth = useAuthStore();

// const { accessToken } = useAuth();

const page = ref(1);
const limit = ref(20);
const order_by = ref("name");
const search = ref("");
const debouncedSearch = useDebounce(search, 500);
const total = ref(0);
const total_filtered = ref(0);

const products = ref<Product[]>([]);
const loading = ref(false);
const hasMore = ref(true);
const loadMoreTrigger = ref<HTMLElement | null>(null);

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

async function loadProducts() {
  if (loading.value || !hasMore.value) return;

  loading.value = true;

  try {
    const res = await $fetch<ProductListResponse>(
      "http://localhost:3050/api/products/list",
      {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
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

    total.value = res.total;
    total_filtered.value = res.total_filtered;

    products.value.push(...res.data);
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
}

watch([debouncedSearch, order_by], () => {
  page.value = 1;
  products.value = [];
  hasMore.value = true;
  setTimeout(() => {
    loadProducts();
  }, 500);
});

onMounted(() => {
  loadProducts();

  const observer = new IntersectionObserver((entries) => {
    if (
      entries[0] &&
      entries[0].isIntersecting &&
      hasMore.value &&
      !loading.value
    ) {
      page.value++;
      loadProducts();
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
      <NuxtLink
        to="/product/new"
        class="btn btn-primary d-none d-sm-inline-block"
      >
        <Icon name="i-tabler:plus" class="icon icon-2 me-0" />
        Create New
      </NuxtLink>
      <NuxtLink to="/product/new" class="btn btn-primary d-sm-none btn-icon">
        <Icon name="i-tabler:plus" class="icon" />
      </NuxtLink>
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
              <ui-th xwidth="20%" xclass="text-center" xorder="sku">
                sku
              </ui-th>
              <ui-th xorder="name"> name </ui-th>
              <ui-th xwidth="20%" xclass="text-end" xorder="price">
                price
              </ui-th>
              <ui-th xwidth="20%" xclass="text-end" xorder="qty"> qty </ui-th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, i) in products" :key="item.id">
              <td class="text-end">{{ i + 1 }}.</td>
              <td class="text-center">{{ item.sku }}</td>
              <td>{{ item.name }}</td>
              <td class="fw-bold text-end">{{ item.price }}</td>
              <td class="fw-bold text-end">{{ item.qty }}</td>
            </tr>
            <tr ref="loadMoreTrigger">
              <td colspan="5" class="text-center">
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
            Tampil {{ products.length }} dari {{ total_filtered }} (
            {{ total }} total data )
          </span>
        </div>
      </div>
    </PageBody>
  </div>
</template>

<style scoped>
thead.sticky-top {
  z-index: 1;
}
</style>
