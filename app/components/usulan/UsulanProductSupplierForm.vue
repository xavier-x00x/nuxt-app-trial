<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';

const { setFlash } = useFlash();

interface Props {
  title?: string;
  icon?: string;
  basePath?: string;
  id?: string;
  proposal?: any;
}

const props = withDefaults(defineProps<Props>(), {
  title: "Usulan Kontrak Supplier Baru",
  icon: "i-tabler:building-store",
  basePath: "/usulan/product-supplier",
  id: undefined,
  proposal: undefined,
});

const isEdit = computed(() => !!props.id);
const reason = ref("");

const items = ref<Record<string, any>[]>([
  {
    product_id: null,
    product_id_text: "",
    product_id_obj: null,
    supplier_id: null,
    supplier_id_text: "",
    supplier_id_obj: null,
    supplier_sku: "",
    default_lead_time_days: 0,
    purchase_uom_id: null,
    offered_price: 0,
    min_order_qty: 0,
    is_primary: false,
    is_consignment: false,
    is_returnable: false,
    _action: 'CREATE',
    _existing_id: null,
    _loading: false,
    _context_loaded: false,
    _is_initial: false,
    _last_product_id: null,
    _last_supplier_id: null,
    _product_detail: null,
    _valid_uoms: [],
  }
]);

const parsePayload = (payload: any) => {
  if (!payload) return {};
  if (typeof payload === "object") return payload;
  try {
    return JSON.parse(payload);
  } catch {
    return {};
  }
};

const formatEntityText = (keyOrType: string, obj: any): string => {
  if (!obj) return "";
  const isAccount = keyOrType === "ap_account_id" || keyOrType === "tax_account_id" || keyOrType === "parent_id" || keyOrType === "CHART_OF_ACCOUNT" || keyOrType === "ap_account" || keyOrType === "tax_account" || keyOrType === "parent" || (obj && typeof obj === 'object' && 'account_code' in obj);
  if (isAccount) {
    const code = obj.account_code || obj.code;
    const name = obj.name;
    if (code && name) {
      return `${code} - ${name}`;
    }
  }
  const isProduct = keyOrType === "product_id" || keyOrType === "PRODUCT" || keyOrType === "product" || (obj && typeof obj === 'object' && 'sku' in obj);
  if (isProduct) {
    const sku = obj.sku;
    const name = obj.name;
    if (sku && name) {
      let text = `[ ${sku} ] - ${name}`;
      if (obj.base_uom?.name) {
        text += ` (Base UOM: ${obj.base_uom.name})`;
      } else if (obj.uom_name) {
        text += ` (UOM: ${obj.uom_name})`;
      }
      return text;
    }
  }
  return obj.name || obj.code || obj.account_code || obj.id || "";
};

const globalSupplierId = computed({
  get: () => items.value.length > 0 ? items.value[0]?.supplier_id : undefined,
  set: (val) => { items.value.forEach((item: any) => item.supplier_id = val); }
});

const globalSupplierIdText = computed({
  get: () => items.value.length > 0 ? items.value[0]?.supplier_id_text : undefined,
  set: (val) => { items.value.forEach((item: any) => item.supplier_id_text = val); }
});

const globalSupplierIdObj = computed({
  get: () => items.value.length > 0 ? items.value[0]?.supplier_id_obj : undefined,
  set: (val) => { items.value.forEach((item: any) => item.supplier_id_obj = val); }
});

const resolveRelationText = async (item: Record<string, any>, fieldKey: string, apiUrl: string) => {
  if (!apiUrl || !item[fieldKey]) return;
  const detailUrl = apiUrl.replace('/pagination', '').replace('/query', '') + '/' + item[fieldKey];
  try {
    const { data } = await useApi<any>(detailUrl);
    if (data?.data) {
      item[fieldKey + '_text'] = formatEntityText(fieldKey, data.data);
    }
  } catch {}
};

watch(
  items,
  (newItems) => {
    newItems.forEach(async (item: any) => {
      const pid = item.product_id;
      const sid = item.supplier_id;

      if (pid && sid) {
        if (pid !== item._last_product_id || sid !== item._last_supplier_id) {
          item._last_product_id = pid;
          item._last_supplier_id = sid;
          
          item._loading = true;
          item._context_loaded = false;

          try {
            const [productRes, suppliersRes, uomConvRes] = await Promise.all([
              useApi<any>(`/catalog/products/${pid}`),
              useApi<any>(`/catalog/products/${pid}/suppliers`),
              useApi<any>(`/catalog/product-uoms/product/${pid}`)
            ]);

            const productData = productRes.data?.data;
            const uomConversions = uomConvRes.data?.data || [];
            item._product_detail = productData;
            
            const validUoms: any[] = [];
            if (productData?.base_uom_id) {
              validUoms.push({
                id: productData.base_uom_id,
                name: productData.uom_name || "Base UOM"
              });
            }
            if (uomConversions.length > 0) {
              uomConversions.forEach((conv: any) => {
                if (conv.uom && !validUoms.find((u: any) => u.id === conv.uom.id)) {
                  validUoms.push(conv.uom);
                }
              });
            }
            item._valid_uoms = validUoms;

            const suppliers = suppliersRes.data?.data || [];
            const existing = suppliers.find((s: any) => s.supplier_id === sid);

            if (existing) {
              item._action = 'UPDATE';
              item._existing_id = existing.id;
              if (!item._is_initial) {
                item.supplier_sku = existing.supplier_sku || "";
                item.default_lead_time_days = existing.default_lead_time_days || 0;
                item.purchase_uom_id = existing.purchase_uom_id || null;
                item.offered_price = existing.offered_price || 0;
                item.min_order_qty = existing.min_order_qty || 0;
                item.is_primary = existing.is_primary || false;
                item.is_consignment = existing.is_consignment || false;
                item.is_returnable = existing.is_returnable || false;
              }
            } else {
              item._action = 'CREATE';
              item._existing_id = null;
              if (!item._is_initial) {
                item.supplier_sku = "";
                item.default_lead_time_days = 0;
                item.purchase_uom_id = productData?.base_uom_id || null;
                item.offered_price = 0;
                item.min_order_qty = 0;
                item.is_primary = false;
                item.is_consignment = false;
                item.is_returnable = false;
              }
            }

            item._is_initial = false;
            item._context_loaded = true;
          } catch (err) {
            console.error(err);
          } finally {
            item._loading = false;
          }
        }
      } else {
        if (!pid || !sid) {
          item._last_product_id = pid;
          item._last_supplier_id = sid;
          item._context_loaded = false;
          item._action = 'CREATE';
          item._existing_id = null;
        }
      }
    });
  },
  { deep: true }
);

function fillForm(proposal: any) {
  reason.value = proposal.reason || "";
  
  items.value = proposal.items.map((item: any) => {
    const parsedPayload = parsePayload(item.payload_json);

    return {
      _item_id: item.id,
      _existing_id: item.entity_id || null,
      _action: proposal.action_type || 'CREATE',

      product_id: parsedPayload.product_id || null,
      product_id_text: parsedPayload.product_id_text || "",

      supplier_id: parsedPayload.supplier_id || null,
      supplier_id_text: parsedPayload.supplier_id_text || "",

      supplier_sku: parsedPayload.supplier_sku || "",
      default_lead_time_days: parsedPayload.default_lead_time_days || 0,
      purchase_uom_id: parsedPayload.purchase_uom_id || null,
      offered_price: parsedPayload.offered_price || 0,
      min_order_qty: parsedPayload.min_order_qty || 0,
      is_primary: parsedPayload.is_primary || false,
      is_consignment: parsedPayload.is_consignment || false,
      is_returnable: parsedPayload.is_returnable || false,

      _is_initial: true,
      _context_loaded: false,
      _loading: false,
      _last_product_id: null,
      _last_supplier_id: null,
      _product_detail: null,
      _valid_uoms: [],
    };
  });

  items.value.forEach((item: any) => {
    if (item.product_id && !item.product_id_text) {
      resolveRelationText(item, 'product_id', '/products/pagination');
    }
    if (item.supplier_id && !item.supplier_id_text) {
      resolveRelationText(item, 'supplier_id', '/suppliers/pagination');
    }
  });
}

watch(
  () => props.proposal,
  (newVal) => {
    if (newVal) {
      fillForm(newVal);
    }
  },
  { immediate: true }
);

const addItem = () => {
  items.value.push({
    product_id: null,
    product_id_text: "",
    product_id_obj: null,
    supplier_id: globalSupplierId.value || null,
    supplier_id_text: globalSupplierIdText.value || "",
    supplier_id_obj: globalSupplierIdObj.value || null,
    supplier_sku: "",
    default_lead_time_days: 0,
    purchase_uom_id: null,
    offered_price: 0,
    min_order_qty: 0,
    is_primary: false,
    is_consignment: false,
    is_returnable: false,
    _action: 'CREATE',
    _existing_id: null,
    _loading: false,
    _context_loaded: false,
    _is_initial: false,
    _last_product_id: null,
    _last_supplier_id: null,
    _product_detail: null,
    _valid_uoms: [],
  });
};

const removeItem = (idx: number) => {
  items.value.splice(idx, 1);
};

const formEl = ref<HTMLFormElement>();
const { loading, success, errors, formatError, submitForm } = useForm2();

const onSubmit = async () => {
  const dataPayload: Record<string, any> = {
    entity_type: "PRODUCT_SUPPLIER",
    action_type: items.value.every((i: any) => i._action === 'CREATE') ? 'CREATE' : 'UPDATE',
    reason: reason.value || undefined,
    items: items.value.map((item: any) => {
      const payload: Record<string, any> = {
        supplier_id: item.supplier_id,
        product_id: item.product_id,
        supplier_sku: item.supplier_sku,
        default_lead_time_days: Number(item.default_lead_time_days) || 0,
        purchase_uom_id: item.purchase_uom_id || null,
        offered_price: Number(item.offered_price) || 0,
        min_order_qty: Number(item.min_order_qty) || 0,
        is_primary: !!item.is_primary,
        is_consignment: !!item.is_consignment,
        is_returnable: !!item.is_returnable,
      };

      if (item.supplier_id_text) payload.supplier_id_text = item.supplier_id_text;
      if (item.product_id_text) payload.product_id_text = item.product_id_text;
      
      const uom = item._valid_uoms?.find((u: any) => u.id === item.purchase_uom_id);
      if (uom) {
        payload.purchase_uom_id_text = uom.name;
      }

      const result: Record<string, any> = {
        entity_id: item._action === 'UPDATE' ? (item._existing_id || null) : null,
        payload_json: JSON.stringify(payload),
      };

      if (isEdit.value && item._item_id) {
        result.id = item._item_id;
      }
      return result;
    }),
  };

  if (isEdit.value) {
    await submitForm(`/system/proposals/${props.id}`, { method: "PUT", body: dataPayload });
  } else {
    await submitForm("/system/proposals", { method: "POST", body: dataPayload });
  }
  if (success.value) navigateTo(props.basePath);
};
</script>

<template>
  <div>
    <PageHeader :title="title" :icon="icon">
      <ui-button-back :to="basePath" />
      <ui-button-save :loading="loading" :form="formEl" @save="formEl?.requestSubmit()" />
    </PageHeader>
    <PageBody>
      <form ref="formEl" autocomplete="off" novalidate @submit.prevent="onSubmit">
        <div class="row justify-content-center">
          <div class="col-xl-12 col-md-12 col-sm-12">
            <div class="row align-items-stretch mb-4">
              <div class="col-md-6">
                <div v-if="items.length > 0" class="p-3 border rounded-1 bg-body-secondary h-100">
                  <label class="form-label fw-bold mb-2">Supplier Utama untuk Usulan Ini <span class="text-danger">*</span></label>
                  <UiSelectSearch5
                    v-model="globalSupplierId"
                    v-model:display-value="globalSupplierIdText"
                    v-model:selected-data="globalSupplierIdObj"
                    value-key="id"
                    api-url="/purchasing/suppliers/pagination"
                    xname="global_supplier_id"
                    placeholder="Pilih Supplier..."
                    :clearable="true"
                    :selected-format="(e) => formatEntityText('supplier_id', e)"
                    :select-format="(e) => formatEntityText('supplier_id', e)"
                    :error="formatError('Supplier Utama', 'supplier_id')"
                  />
                  <div class="form-text mt-2 mb-0">
                    <Icon name="i-tabler:info-circle" /> Memilih Supplier di sini akan menerapkannya ke semua item di bawah secara otomatis.
                  </div>
                </div>
              </div>
              <div class="col-md-6 d-flex flex-column">
                <ui-textarea
                  v-model="reason"
                  class="flex-grow-1"
                  label="Reason"
                  placeholder="Optional reason for this proposal"
                  :error="formatError('Reason', 'reason')"
                />
              </div>
            </div>

            <label class="fw-semibold mb-3">Items</label>

            <div v-for="(item, idx) in items" :key="idx" class="border rounded-1 p-3 mb-3 position-relative bg-body shadow-sm">
              <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                <div>
                  <span class="fw-bold text-primary small text-uppercase me-2">Item #{{ idx + 1 }}</span>
                  <template v-if="item._context_loaded">
                    <span v-if="item._action === 'CREATE'" class="badge bg-success px-1" style="font-size: 0.65rem">NEW</span>
                    <span v-else-if="item._action === 'UPDATE'" class="badge bg-warning text-dark px-1" style="font-size: 0.65rem">UPD</span>
                  </template>
                </div>
                <button v-if="items.length > 1" type="button" class="btn btn-sm btn-link text-danger p-0 border-0 text-decoration-none d-flex align-items-center" @click="removeItem(idx)">
                  <Icon name="i-tabler:trash" class="icon me-1" style="font-size: 1.1rem;" /> Hapus
                </button>
              </div>

              <div class="row g-3">
                <div class="col-md-9">
                  <label class="form-label">Product <span class="text-danger">*</span></label>
                  <UiSelectSearch5
                    v-model="item.product_id"
                    v-model:display-value="item.product_id_text"
                    v-model:selected-data="item.product_id_obj"
                    value-key="id"
                    api-url="/catalog/products/pagination"
                    xname="product_id"
                    placeholder="Select Product"
                    :clearable="true"
                    :selected-format="(e) => formatEntityText('product_id', e)"
                    :select-format="(e) => formatEntityText('product_id', e)"
                    :error="formatError(`Product ${idx + 1}`, `items[${idx}].product_id`)"
                  />
                </div>
                
                <div class="col-md-3">
                  <label class="form-label">Satuan Order</label>
                  <select
                    v-if="item._valid_uoms && item._valid_uoms.length > 0" 
                    v-model="item.purchase_uom_id" 
                    class="form-select" 
                    :class="{ 'is-invalid': formatError(`UOM ${idx + 1}`, `items[${idx}].purchase_uom_id`) }"
                  >
                    <option v-for="opt in item._valid_uoms" :key="opt.id" :value="opt.id">
                      {{ opt.name }}
                    </option>
                  </select>
                  <select v-else class="form-select" disabled>
                    <option>Pilih Product</option>
                  </select>
                </div>

                <template v-if="item._loading">
                  <div class="col-12 py-3 text-center text-muted">
                    <span class="spinner-border spinner-border-sm me-2" role="status"></span> Loading details...
                  </div>
                </template>

                <template v-else>
                  <div class="col-md-3">
                    <ui-input2 v-model="item.supplier_sku" label="Supplier SKU" type="text" placeholder="SKU" />
                  </div>
                  <div class="col-md-3">
                    <ui-input2 v-model="item.default_lead_time_days" label="Lead Time (hari)" type="number" placeholder="Hari" />
                  </div>
                  <div class="col-md-3">
                    <ui-input2 v-model="item.offered_price" label="Harga Beli (Offered)" type="number" placeholder="Harga" />
                  </div>
                  <div class="col-md-3">
                    <ui-input2 v-model="item.min_order_qty" label="Min Order (MOQ)" type="number" placeholder="MOQ" />
                  </div>
                  
                  <div class="col-12 mt-1 d-flex flex-wrap gap-4">
                    <div class="form-check form-switch">
                      <input :id="`field-${idx}-is_primary`" v-model="item.is_primary" class="form-check-input" type="checkbox" :true-value="true" :false-value="false" />
                      <label class="form-check-label" :for="`field-${idx}-is_primary`">Supplier Utama</label>
                    </div>
                    <div class="form-check form-switch">
                      <input :id="`field-${idx}-is_consignment`" v-model="item.is_consignment" class="form-check-input" type="checkbox" :true-value="true" :false-value="false" />
                      <label class="form-check-label" :for="`field-${idx}-is_consignment`">Konsinyasi (Titip Jual)</label>
                    </div>
                    <div class="form-check form-switch">
                      <input :id="`field-${idx}-is_returnable`" v-model="item.is_returnable" class="form-check-input" type="checkbox" :true-value="true" :false-value="false" />
                      <label class="form-check-label" :for="`field-${idx}-is_returnable`">Bisa Diretur (Returnable)</label>
                    </div>
                  </div>
                </template>
              </div>
            </div>

            <button type="button" class="btn btn-outline-primary w-100 py-2 d-flex align-items-center justify-content-center rounded-1 mt-2 mb-5" style="border-style: dashed; border-width: 2px;" @click="addItem">
              <Icon name="i-tabler:plus" class="me-1" style="font-size: 1.15rem;" /> Tambah Item Lainnya
            </button>
          </div>
        </div>
      </form>
    </PageBody>
  </div>
</template>
