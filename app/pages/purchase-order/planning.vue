<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { PurchaseOrderPlanning } from "~/types/purchase-order";

const title = "Purchase Order Planning (Rekomendasi)";
useHead({ title });

const { loading: submitting, submitForm } = useForm2();

const stores = ref<any[]>([]);
const warehouses = ref<any[]>([]);
const selectedStoreId = ref<string>("");
const selectedWarehouseId = ref<string>("");
const plannings = ref<PurchaseOrderPlanning[]>([]);
const displayedCount = ref(50);
const displayedPlannings = computed(() => plannings.value.slice(0, displayedCount.value));
const loading = ref(false);
const loadMoreTrigger = ref<HTMLElement | null>(null);

const loadStoresAndWarehouses = async () => {
  const [storeRes, whRes] = await Promise.all([
    useApi<{ data: any[] }>("/inventory/stores"),
    useApi<{ data: any[] }>("/inventory/warehouses"),
  ]);
  if (storeRes.data?.data) {
    stores.value = storeRes.data.data;
    const auth = useAuthStore();
    if (auth.user?.store_id) {
      selectedStoreId.value = auth.user.store_id;
    } else if (stores.value.length > 0) {
      selectedStoreId.value = stores.value[0].id;
    }
  }
  if (whRes.data?.data) {
    warehouses.value = whRes.data.data;
    if (warehouses.value.length > 0) {
      selectedWarehouseId.value = warehouses.value[0].id;
    }
  }
  if (selectedStoreId.value) {
    fetchPlannings();
  }
};

const searchQuery = ref("");
let searchTimeout: any = null;

const fetchPlannings = async () => {
  if (!selectedStoreId.value) return;
  loading.value = true;
  displayedCount.value = 50;
  let url = `/planning/pending?store_id=${selectedStoreId.value}`;
  if (searchQuery.value.trim() !== "") {
    url += `&search=${encodeURIComponent(searchQuery.value.trim())}`;
  }
  const res = await useApi<{ data: PurchaseOrderPlanning[] }>(url);
  if (res.data?.data) {
    plannings.value = res.data.data;
  } else {
    plannings.value = [];
  }
  loading.value = false;
};

watch(selectedStoreId, () => {
  fetchPlannings();
});

watch(searchQuery, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchPlannings();
  }, 500);
});

onMounted(() => {
  loadStoresAndWarehouses();

  const observer = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting && !loading.value) {
      if (displayedCount.value < plannings.value.length) {
        displayedCount.value += 50;
      }
    }
  });

  // Watch for the trigger element to be available and observe it
  watch(loadMoreTrigger, (el) => {
    if (el) {
      observer.observe(el);
    } else {
      observer.disconnect();
    }
  });
});

const handleCalculate = async () => {
  if (!selectedStoreId.value) {
    alert("Silakan pilih Toko terlebih dahulu");
    return;
  }
  const res = await submitForm("/planning/calculate", {
    method: "POST",
    body: {
      store_id: selectedStoreId.value,
      force_recal: true,
    },
    successMessage: "Kalkulasi rekomendasi stok berhasil diperbarui!",
  });
  if (res && res.status >= 200 && res.status < 300) {
    fetchPlannings();
  }
};

// Checkbox selection logic
const selectedItems = computed(() => plannings.value.filter((p) => p.is_selected));
const isAllSelected = computed(() => plannings.value.length > 0 && selectedItems.value.length === plannings.value.length);

const toggleSelectAll = async (e: any) => {
  const isChecked = e.target.checked;
  plannings.value.forEach((p) => {
    p.is_selected = isChecked;
  });
  
  await useApi("/planning/bulk-select", {
    method: "POST",
    body: {
      ids: plannings.value.map((p) => p.id),
      is_selected: isChecked
    }
  });
};

const handleApproveSelected = async () => {
  if (selectedItems.value.length === 0) return;
  const items = selectedItems.value;
  const payload = {
    product_ids: items.map((p) => p.id),
    order_quantities: items.map((p) => Number(p.order_qty)),
    product_supplier_ids: items.map((p) => p.product_supplier_id || "")
  };

  const res = await submitForm("/planning/approve", {
    method: "POST",
    body: payload,
    successMessage: `${items.length} rekomendasi berhasil disetujui!`,
  });

  if (res && res.status >= 200 && res.status < 300) {
    fetchPlannings();
  }
};

const handleIgnoreSelected = async () => {
  if (selectedItems.value.length === 0) return;
  if (!confirm(`Abaikan ${selectedItems.value.length} item rekomendasi ini?`)) return;

  const res = await submitForm("/planning/ignore", {
    method: "POST",
    body: {
      ids: selectedItems.value.map(p => p.id),
    },
    successMessage: "Rekomendasi berhasil diabaikan!",
  });

  if (res && res.status >= 200 && res.status < 300) {
    fetchPlannings();
  }
};

const showGeneratePOModal = ref(false);

const openGeneratePOModal = () => {
  if (!selectedStoreId.value || !selectedWarehouseId.value) {
    alert("Pilih Toko dan Gudang Tujuan terlebih dahulu");
    return;
  }
  showGeneratePOModal.value = true;
};

const handleBulkGeneratePO = async () => {
  showGeneratePOModal.value = false;

  const res = await submitForm("/purchasing/purchase-orders/bulk-from-approved", {
    method: "POST",
    body: {
      store_id: selectedStoreId.value,
      warehouse_id: selectedWarehouseId.value,
    },
    successMessage: "Dokumen PO berhasil dibuat secara otomatis dari rekomendasi!",
  });

  if (res && res.status >= 200 && res.status < 300) {
    useRouter().push("/purchase-order");
  }
};

// Alternative Supplier Logic
const showSupplierModal = ref(false);
const activePlanningItem = ref<PurchaseOrderPlanning | null>(null);
const availableSuppliers = ref<any[]>([]);
const loadingSuppliers = ref(false);

const openSupplierModal = async (p: PurchaseOrderPlanning) => {
  activePlanningItem.value = p;
  showSupplierModal.value = true;
  loadingSuppliers.value = true;
  availableSuppliers.value = [];
  
  const res = await useApi<{ data: any[] }>(`/catalog/products/${p.product_id}/suppliers`);
  if (res.data?.data) {
    availableSuppliers.value = res.data.data;
  }
  loadingSuppliers.value = false;
};

const selectAlternativeSupplier = async (ps: any) => {
  if (activePlanningItem.value) {
    const p = activePlanningItem.value;
    
    // Update local state directly
    p.product_supplier_id = ps.id;
    p.supplier_name = ps.supplier?.name;
    p.supplier_code = ps.supplier?.code;
    p.is_manual_supplier = true;

    // Auto update backend
    await updatePlanningInline(p, ps.id);
  }
  showSupplierModal.value = false;
};

const updatePlanningInline = async (p: PurchaseOrderPlanning, productSupplierId?: string) => {
  try {
    const payload: any = {};
    if (p.order_qty !== undefined) payload.order_qty = Number(p.order_qty);
    if (productSupplierId) payload.product_supplier_id = productSupplierId;
    if (p.is_selected !== undefined) payload.is_selected = p.is_selected;

    await useApi(`/planning/${p.id}`, {
      method: "PUT",
      body: payload
    });
  } catch (error) {
    console.error("Failed to update planning inline", error);
  }
};
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:clipboard-check">
      <div>
        <button
          type="button"
          class="btn btn-outline-primary rounded-1 me-2"
          :disabled="submitting || loading"
          @click="handleCalculate"
        >
          <Icon name="i-tabler:refresh" class="icon icon-2 me-1" />
          Kalkulasi Ulang
        </button>
        <button
          type="button"
          class="btn btn-success rounded-1"
          :disabled="submitting || !selectedWarehouseId"
          @click="openGeneratePOModal"
        >
          <Icon name="i-tabler:sparkles" class="icon icon-2 me-1" />
          Generate PO dari Approved Planning
        </button>
      </div>
    </PageHeader>

    <PageBody>
      <!-- Filter Card -->
      <div class="card shadow-sm mb-3">
        <div class="card-body">
          <div class="row g-3 align-items-center">
            <div class="col-md-3">
              <label class="form-label fw-bold">Pilih Toko</label>
              <select v-model="selectedStoreId" class="form-select">
                <option v-for="st in stores" :key="st.id" :value="st.id">
                  {{ st.name }} ({{ st.code }})
                </option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label fw-bold">Gudang Tujuan PO</label>
              <select v-model="selectedWarehouseId" class="form-select">
                <option v-for="wh in warehouses" :key="wh.id" :value="wh.id">
                  {{ wh.name }}
                </option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label fw-bold">Cari Produk / Supplier</label>
              <div class="input-icon">
                <span class="input-icon-addon">
                  <Icon name="i-tabler:search" class="icon" />
                </span>
                <input v-model="searchQuery" type="text" class="form-control" placeholder="Ketik kata kunci...">
              </div>
            </div>
            <div class="col-md-2 text-end pt-4">
              <span class="badge bg-secondary-lt fs-6">
                {{ plannings.length }} Item Rekomendasi
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Plannings Table Card -->
      <div class="card shadow-sm">
        <div v-if="selectedItems.length > 0" class="card-header bg-primary-lt d-flex justify-content-between align-items-center py-2">
          <span class="fw-bold text-primary">
            {{ selectedItems.length }} item dipilih
          </span>
          <div class="d-flex gap-2">
            <button
              type="button"
              class="btn btn-sm btn-success rounded-1"
              :disabled="submitting"
              @click="handleApproveSelected"
            >
              <Icon name="i-tabler:check" class="icon icon-2 me-1" />
              Approve Selected
            </button>
            <button
              type="button"
              class="btn btn-sm btn-outline-danger rounded-1"
              :disabled="submitting"
              @click="handleIgnoreSelected"
            >
              <Icon name="i-tabler:circle-minus" class="icon icon-2 me-1" />
              Ignore Selected
            </button>
          </div>
        </div>

        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
          <div class="mt-2 text-muted">Memuat rekomendasi stok...</div>
        </div>

        <div v-else-if="plannings.length === 0" class="text-center py-5 text-muted">
          <Icon name="i-tabler:checkup-list" class="icon icon-4 mb-2 text-secondary opacity-50" />
          <div>Tidak ada rekomendasi pembelian (stok dalam keadaan aman).</div>
        </div>

        <div v-else class="table-responsive">
          <table class="table table-vcenter table-hover card-table">
            <thead>
              <tr>
                <th style="width: 40px" class="text-center">
                  <input
                    type="checkbox"
                    class="form-check-input"
                    :checked="isAllSelected"
                    @change="toggleSelectAll"
                  />
                </th>
                <th>Produk / SKU</th>
                <th>Supplier Utama</th>
                <th class="text-end">Stok Sekarang</th>
                <th class="text-end">Safety Stock</th>
                <th class="text-end">Reorder Point (ROP)</th>
                <th class="text-end">Rekomendasi Order</th>
                <th class="text-center" style="width: 120px;">Order Qty</th>
                <th class="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              <PurchaseOrderPlanningRow 
                v-for="p in displayedPlannings" 
                :key="p.id" 
                :p="p" 
                @update="updatePlanningInline" 
                @open-supplier="openSupplierModal" 
              />
              <tr v-if="displayedCount < plannings.length" ref="loadMoreTrigger">
                <td colspan="9" class="text-center py-3 text-muted">
                  Memuat lebih banyak data...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </PageBody>

    <!-- Alternative Supplier Modal -->
    <div class="modal modal-blur fade" :class="{ show: showSupplierModal }" :style="{ display: showSupplierModal ? 'block' : 'none' }" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Pilih Supplier Alternatif</h5>
            <button type="button" class="btn-close" aria-label="Close" @click="showSupplierModal = false"></button>
          </div>
          <div class="modal-body p-0">
            <div class="p-3 bg-light border-bottom">
              <div class="fw-bold text-dark">{{ activePlanningItem?.product_name }}</div>
              <div class="text-muted small">SKU: {{ activePlanningItem?.product_sku }}</div>
            </div>

            <div v-if="loadingSuppliers" class="text-center py-4">
              <div class="spinner-border text-primary spinner-border-sm" role="status"></div>
              <div class="mt-2 text-muted small">Mencari supplier...</div>
            </div>
            
            <div v-else-if="availableSuppliers.length === 0" class="text-center py-4 text-muted">
              Belum ada supplier alternatif untuk produk ini.
            </div>

            <div v-else class="list-group list-group-flush">
              <button 
                v-for="ps in availableSuppliers" 
                :key="ps.id"
                class="list-group-item list-group-item-action p-3"
                @click="selectAlternativeSupplier(ps)"
              >
                <div class="d-flex w-100 justify-content-between align-items-center">
                  <div>
                    <h5 class="mb-1 fw-bold">{{ ps.supplier?.name }}</h5>
                    <div class="text-muted small">{{ ps.supplier?.code }}</div>
                  </div>
                  <div class="text-end">
                    <span v-if="ps.is_primary" class="badge bg-success-lt mb-1">Utama</span>
                    <div class="small fw-semibold text-primary">Rp {{ Number(ps.offered_price).toLocaleString('id-ID') }}</div>
                  </div>
                </div>
                <div class="mt-2 small text-muted">
                  Lead Time: {{ ps.default_lead_time_days }} hari | MOQ: {{ ps.min_order_qty }}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showSupplierModal" class="modal-backdrop fade show"></div>
    <!-- Confirm Generate PO Modal -->
    <div class="modal modal-blur fade" :class="{ show: showGeneratePOModal }" :style="{ display: showGeneratePOModal ? 'block' : 'none' }" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-sm modal-dialog-centered" role="document">
        <div class="modal-content">
          <button type="button" class="btn-close" aria-label="Close" @click="showGeneratePOModal = false"></button>
          <div class="modal-status bg-success"></div>
          <div class="modal-body text-center py-4">
            <Icon name="i-tabler:alert-triangle" class="icon mb-2 text-green icon-lg" style="font-size: 3rem;" />
            <h3>Konfirmasi</h3>
            <div class="text-muted">
              Generate Purchase Order secara otomatis dari seluruh rekomendasi yang sudah disetujui (Approved)?
            </div>
          </div>
          <div class="modal-footer">
            <div class="w-100">
              <div class="row">
                <div class="col"><button type="button" class="btn w-100" @click="showGeneratePOModal = false">Batal</button></div>
                <div class="col"><button type="button" class="btn btn-success w-100" :disabled="submitting" @click="handleBulkGeneratePO">Generate PO</button></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showGeneratePOModal" class="modal-backdrop fade show"></div>
  </div>
</template>
