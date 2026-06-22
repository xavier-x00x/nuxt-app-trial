
<script setup lang="ts">
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

const actionTypes = [
  { value: "CREATE", label: "Create" },
  { value: "UPDATE", label: "Update" },
  { value: "DELETE", label: "Delete" },
];

const proposalType = ref("CREATE");
const reason = ref("");
const items = ref<Record<string, any>[]>([{}]);

const entityFields = [
  {
    "key": "product_id",
    "label": "Product",
    "type": "selectx",
    "apiUrl": "/products/pagination",
    "required": true,
    "col": "col-md-6"
  },
  {
    "key": "supplier_id",
    "label": "Supplier",
    "type": "selectx",
    "apiUrl": "/suppliers/pagination",
    "required": true,
    "col": "col-md-6"
  },
  {
    "key": "supplier_sku",
    "label": "Supplier SKU",
    "type": "text",
    "col": "col-md-6"
  },
  {
    "key": "default_lead_time_days",
    "label": "Lead Time (days)",
    "type": "number",
    "col": "col-md-6"
  },
  {
    "key": "offered_price",
    "label": "Offered Price",
    "type": "number",
    "col": "col-md-6"
  },
  {
    "key": "min_order_qty",
    "label": "Min Order Qty",
    "type": "number",
    "col": "col-md-6"
  },
  {
    "key": "is_primary",
    "label": "Is Primary",
    "type": "switch",
    "col": "col-md-4"
  },
  {
    "key": "is_consignment",
    "label": "Is Consignment",
    "type": "switch",
    "col": "col-md-4"
  },
  {
    "key": "is_returnable",
    "label": "Is Returnable",
    "type": "switch",
    "col": "col-md-4"
  }
];
const fieldsKeys = ["product_id", "supplier_id", "supplier_sku", "default_lead_time_days", "purchase_uom_id", "offered_price", "min_order_qty", "is_primary", "is_consignment", "is_returnable"];

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

const resolveEntityText = async (item: Record<string, any>) => {
  const apiUrl = "/product-suppliers/pagination";
  if (!apiUrl || !item.entity_id) return;
  const detailUrl = apiUrl.replace('/pagination', '') + '/' + item.entity_id;
  try {
    const { data } = await useApi<any>(detailUrl);
    if (data?.data) {
      item.entity_text = formatEntityText("PRODUCT_SUPPLIER", data.data);
      item._selected_obj = data.data;
    }
  } catch {}
};

watch(
  () => items.value,
  (newItems) => {
    newItems.forEach((item: any) => {
      if (item._selected_obj && item._selected_obj.id !== item._last_selected_id) {
        item.entity_id = item._selected_obj.id;
        item.entity_text = formatEntityText("PRODUCT_SUPPLIER", item._selected_obj);
        item._last_selected_id = item._selected_obj.id;
        
        for (const field of entityFields) {
          item[field.key] = item._selected_obj[field.key] !== undefined ? item._selected_obj[field.key] : null;
          
          if (field.type === 'selectx') {
            const relKey = field.key.replace(/_id$/, '');
            if (item._selected_obj[relKey] && typeof item._selected_obj[relKey] === 'object') {
              item[field.key + '_text'] = formatEntityText(field.key, item._selected_obj[relKey]);
            } else if (item._selected_obj[field.key + '_name']) {
              item[field.key + '_text'] = item._selected_obj[field.key + '_name'];
            } else if (item._selected_obj[field.key + '_text']) {
              item[field.key + '_text'] = item._selected_obj[field.key + '_text'];
            } else if (item[field.key]) {
              resolveRelationText(item, field.key, field.apiUrl!);
            }
          }
        }
      } else if (!item._selected_obj && !item.entity_id && item._last_selected_id) {
        item.entity_id = null;
        item.entity_text = "";
        item._last_selected_id = null;
        for (const field of entityFields) {
          item[field.key] = null;
          if (field.type === 'selectx') {
            item[field.key + '_text'] = "";
          }
        }
      }

      if (item.product_id && item.product_id !== item._last_product_id) {
        item._last_product_id = item.product_id;
        fetchUOMConversions(item);
      }
    });
  },
  { deep: true }
);

const fetchUOMConversions = async (item: any) => {
  item.loading_uom = true;
  try {
    const { data } = await useApi<any>(`/product-uoms/product/${item.product_id}`);
    if (data?.data) {
      item.product_uom_conversions = data.data;
    } else {
      item.product_uom_conversions = [];
    }
  } catch {
    item.product_uom_conversions = [];
  } finally {
    item.loading_uom = false;
  }
};

watch(proposalType, (newVal, oldVal) => {
  if (newVal !== oldVal && !isEdit.value) {
    items.value = [{}];
  }
});

if (props.proposal) {
  fillForm(props.proposal);
}

function fillForm(proposal: any) {
  proposalType.value = proposal.action_type;
  reason.value = proposal.reason || "";
  
  items.value = proposal.items.map((item: any) => {
    const base: Record<string, any> = { _item_id: item.id, entity_id: item.entity_id || null };
    const parsedPayload = parsePayload(item.payload_json);
    
    if (proposal.action_type === "CREATE" || proposal.action_type === "UPDATE" || proposal.action_type === "DELETE") {
      const snapshot = parsePayload(item.snapshot_json);
      const displayVal = snapshot && Object.keys(snapshot).length ? formatEntityText("PRODUCT_SUPPLIER", snapshot) : (item.entity_id || "");
      const merged = { 
        ...base, ...parsedPayload, entity_text: displayVal,
        _selected_obj: snapshot && Object.keys(snapshot).length ? snapshot : null,
        _last_selected_id: item.entity_id,
        _last_product_id: parsedPayload.product_id
      };

      if (proposal.action_type !== "DELETE") {
        for (const field of entityFields) {
          if (field.type === 'selectx') {
            const textKey = field.key + '_text';
            if (merged[field.key] && !merged[textKey] && snapshot && Object.keys(snapshot).length) {
              const relKey = field.key.replace(/_id$/, '');
              if (snapshot[relKey] && typeof snapshot[relKey] === 'object') {
                merged[textKey] = formatEntityText(field.key, snapshot[relKey]);
              } else if (snapshot[field.key + '_name']) {
                merged[textKey] = snapshot[field.key + '_name'];
              } else if (snapshot[textKey]) {
                merged[textKey] = snapshot[textKey];
              }
            }
          }
        }
      }
      return merged;
    }
    return base;
  });

  items.value.forEach((item: any) => {
    if (proposal.action_type === "CREATE" || proposal.action_type === "UPDATE") {
      if (item.entity_id && !item._selected_obj) resolveEntityText(item);
      for (const field of entityFields) {
        if (field.type === 'selectx') {
          const textKey = field.key + '_text';
          if (item[field.key] && !item[textKey]) {
            resolveRelationText(item, field.key, field.apiUrl!);
          }
        }
      }
    } else if (proposal.action_type === "DELETE") {
      if (item.entity_id && !item._selected_obj) resolveEntityText(item);
    }
  });
}

const addItem = () => {
  items.value.push({});
};

const removeItem = (idx: number) => {
  items.value.splice(idx, 1);
};

const formEl = ref<HTMLFormElement>();
const { loading, success, errors, formatError, submitForm } = useForm2();

const onSubmit = async () => {
  const dataPayload: Record<string, any> = {
    entity_type: "PRODUCT_SUPPLIER",
    action_type: proposalType.value,
    reason: reason.value || undefined,
    items: items.value.map((item: any) => {
      let payload: any;
      if (proposalType.value === "CREATE" || proposalType.value === "UPDATE") {
        payload = {};
        for (const key of fieldsKeys) {
          if (key === 'supplier_id') {
            payload.supplier_id = items.value[0]?.supplier_id;
            payload.supplier_id_text = items.value[0]?.supplier_id_text;
            continue;
          }
          if (item[key] !== undefined) payload[key] = item[key];
          if (item[key+'_text'] !== undefined) payload[key+'_text'] = item[key+'_text'];
        }
      } else {
        payload = {};
      }
      const result: Record<string, any> = {
        entity_id: item.entity_id || null,
        payload_json: JSON.stringify(payload),
      };
      if (isEdit.value && item._item_id) result.id = item._item_id;
      return result;
    }),
  };

  if (isEdit.value) {
    await submitForm(`/master-data/${props.id}`, { method: "PUT", body: dataPayload });
  } else {
    await submitForm("/master-data", { method: "POST", body: dataPayload });
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
          <div class="col-xl-8 col-md-8 col-sm-12">
            <div class="mb-3">
              <label class="form-label">Action <span class="text-danger">*</span></label>
              <select v-model="proposalType" class="form-select rounded-1" :disabled="isEdit">
                <option v-for="at in actionTypes" :key="at.value" :value="at.value">{{ at.label }}</option>
              </select>
            </div>

            <ui-textarea v-model="reason" label="Reason" placeholder="Optional reason for this proposal" :error="formatError('Reason', 'reason')" />

            <hr class="my-3" />
            
            <div v-if="(proposalType === 'CREATE' || proposalType === 'UPDATE') && items.length > 0" class="mb-4 p-3 border rounded-1 bg-body-secondary">
              <label class="form-label fw-bold mb-2">Supplier Utama untuk Usulan Ini <span class="text-danger">*</span></label>
              <UiSelectSearch5
                v-model="globalSupplierId"
                v-model:display-value="globalSupplierIdText"
                v-model:selected-data="globalSupplierIdObj"
                value-key="id"
                api-url="/suppliers/pagination"
                xname="global_supplier_id"
                placeholder="Pilih Supplier..."
                :clearable="true"
                :selected-format="(e) => formatEntityText('supplier_id', e)"
                :select-format="(e) => formatEntityText('supplier_id', e)"
              />
              <div class="form-text mt-2 mb-0">
                <Icon name="i-tabler:info-circle" /> Supplier yang dipilih di sini akan diterapkan secara otomatis untuk seluruh baris item di bawah.
              </div>
            </div>

            <label class="fw-semibold mb-3">Items</label>

            <div v-for="(item, idx) in items" :key="idx" class="border rounded-1 p-3 mb-3 position-relative bg-body shadow-sm">
              <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                <span class="fw-bold text-primary small text-uppercase">Item #{{ idx + 1 }}</span>
                <button v-if="items.length > 1" type="button" class="btn btn-sm btn-link text-danger p-0 border-0 text-decoration-none d-flex align-items-center" @click="removeItem(idx)">
                  <Icon name="i-tabler:trash" class="icon me-1" style="font-size: 1.1rem;" /> Hapus
                </button>
              </div>

              <!-- UPDATE/DELETE Mode Search -->
              <div v-if="proposalType === 'UPDATE' || proposalType === 'DELETE'" class="mb-4">
                <label class="form-label">Cari Data <span class="text-danger">*</span></label>
                <UiSelectSearch5
                  v-model="item.entity_id"
                  v-model:display-value="item.entity_text"
                  v-model:selected-data="item._selected_obj"
                  value-key="id"
                  api-url="/product-suppliers/pagination"
                  xname="entity_id"
                  placeholder="Ketik untuk mencari..."
                  :clearable="true"
                  :selected-format="(e) => formatEntityText('PRODUCT_SUPPLIER', e)"
                  :select-format="(e) => formatEntityText('PRODUCT_SUPPLIER', e)"
                />
                
                <div v-if="proposalType === 'DELETE' && item._selected_obj" class="mt-3 p-3 bg-body-secondary rounded-1 border">
                  <div class="fw-semibold mb-2 small text-uppercase text-muted">Ringkasan Data yang Akan Dihapus:</div>
                  <div class="row g-2 small">
                    <template v-for="field in entityFields.filter(f => f.type !== 'switch' && f.type !== 'textarea').slice(0, 4)" :key="field.key">
                      <div class="col-6">
                        <strong>{{ field.label }}:</strong> {{ item._selected_obj[field.key] !== undefined && item._selected_obj[field.key] !== null ? item._selected_obj[field.key] : '-' }}
                      </div>
                    </template>
                  </div>
                </div>
              </div>

              <!-- CREATE & UPDATE Dynamic Fields -->
              <template v-if="proposalType === 'CREATE' || (proposalType === 'UPDATE' && item.entity_id)">
                <div class="row g-3">

                  <div class="col-md-9">
                    <label class="form-label">Product <span class="text-danger">*</span></label>
                    <UiSelectSearch5
                      v-model="item.product_id"
                      v-model:display-value="item.product_id_text"
                      v-model:selected-data="item.product_id_obj"
                      value-key="id"
                      api-url="/products/pagination"
                      xname="product_id"
                      placeholder="Select Product"
                      :clearable="true"
                      :selected-format="(e) => formatEntityText('product_id', e)"
                      :select-format="(e) => formatEntityText('product_id', e)"
                    />
                  </div>
                  
                  <div class="col-md-3">
                    <label class="form-label">Satuan Order</label>
                    <select v-model="item.purchase_uom_id" class="form-select" :disabled="!item.product_id">
                      <option :value="undefined">{{ item.product_id_obj?.base_uom?.name || 'Base UOM' }} (Default)</option>
                      <option v-for="conv in item.product_uom_conversions || []" :key="conv.id" :value="conv.uom_id">
                        {{ conv.uom?.name }} (1 = {{ conv.conversion_rate }})
                      </option>
                    </select>
                    <div v-if="item.loading_uom" class="form-text text-muted small mt-1">
                      <span class="spinner-border spinner-border-sm me-1" role="status"></span> Memuat...
                    </div>
                  </div>

                  <div class="col-md-3">
                    <ui-input2 v-model="item.supplier_sku" label="Supplier SKU" type="text" placeholder="SKU" />
                  </div>
                  <div class="col-md-3">
                    <ui-input2 v-model="item.default_lead_time_days" label="Lead Time (hari)" type="number" placeholder="Hari" />
                  </div>
                  <div class="col-md-3">
                    <ui-input2 v-model="item.offered_price" label="Harga (Offered)" type="number" placeholder="Harga" />
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
                </div>
              </template>
            </div>

            <button v-if="proposalType === 'CREATE' || proposalType === 'UPDATE'" type="button" class="btn btn-outline-primary w-100 py-2 d-flex align-items-center justify-content-center rounded-1 mt-2 mb-5" style="border-style: dashed; border-width: 2px;" @click="addItem">
              <Icon name="i-tabler:plus" class="me-1" style="font-size: 1.15rem;" /> Tambah Item Lainnya
            </button>
          </div>
        </div>
      </form>
    </PageBody>
  </div>
</template>
