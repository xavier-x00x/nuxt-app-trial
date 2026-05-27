<script setup lang="ts">
const { setFlash } = useFlash();

interface Props {
  entityType: string;
  title: string;
  icon: string;
  basePath: string;
  id?: string;
  proposal?: any;
}

const props = withDefaults(defineProps<Props>(), {
  entityType: "PRODUCT",
  title: "New Proposal",
  icon: "i-tabler:file-check",
  basePath: "/usulan",
  id: undefined,
  proposal: undefined,
});

const isEdit = computed(() => !!props.id);

const actionTypes = [
  { value: "CREATE", label: "Create" },
  { value: "UPDATE", label: "Update" },
  { value: "DELETE", label: "Delete" },
];

interface FieldDef {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  apiUrl?: string;
  col?: string;
}

const entityFields: Record<string, FieldDef[]> = {
  PRODUCT: [
    { key: "sku", label: "SKU", type: "text", required: true, col: "col-md-6" },
    { key: "barcode", label: "Barcode", type: "text", col: "col-md-6" },
    { key: "name", label: "Name", type: "text", required: true, col: "col-md-12" },
    { key: "category_id", label: "Kategori", type: "selectx", apiUrl: "/categories/pagination", col: "col-md-6" },
    { key: "base_uom_id", label: "Satuan Dasar", type: "selectx", apiUrl: "/uoms/pagination", col: "col-md-6" },
    { key: "length", label: "Panjang", type: "number", col: "col-md-3" },
    { key: "width", label: "Lebar", type: "number", col: "col-md-3" },
    { key: "height", label: "Tinggi", type: "number", col: "col-md-3" },
    { key: "weight", label: "Berat", type: "number", col: "col-md-3" },
    { key: "is_stackable", label: "Dapat Ditumpuk", type: "switch", col: "col-md-6" },
    { key: "is_stockable", label: "Dapat Disimpan", type: "switch", col: "col-md-6" },
    { key: "max_stack_layer", label: "Max Tumpukan", type: "number", col: "col-md-12" },
  ],
  SUPPLIER: [
    { key: "code", label: "Code", type: "text", required: true, col: "col-md-6" },
    { key: "name", label: "Name", type: "text", required: true, col: "col-md-6" },
    { key: "contact_person", label: "Contact Person", type: "text", col: "col-md-6" },
    { key: "contact_phone", label: "Contact Phone", type: "text", col: "col-md-6" },
    { key: "phone_number", label: "Phone Number", type: "text", col: "col-md-6" },
    { key: "email", label: "Email", type: "email", col: "col-md-6" },
    { key: "preferred_notification_method", label: "Notification Method", type: "text", col: "col-md-6" },
    { key: "tax_reg_number", label: "Tax Reg Number", type: "text", col: "col-md-6" },
    { key: "supplier_category_id", label: "Supplier Category", type: "selectx", apiUrl: "/supplier-categories/pagination", col: "col-md-6" },
    { key: "ap_account_id", label: "AP Account", type: "selectx", apiUrl: "/accounts/query", col: "col-md-6" },
    { key: "payment_term_days", label: "Payment Term (days)", type: "number", col: "col-md-6" },
    { key: "payment_mode", label: "Payment Mode", type: "text", col: "col-md-6" },
    { key: "min_order_amount", label: "Min Order Amount", type: "number", col: "col-md-6" },
    { key: "bank_name", label: "Bank Name", type: "text", col: "col-md-6" },
    { key: "bank_account", label: "Bank Account", type: "text", col: "col-md-6" },
    { key: "bank_account_name", label: "Bank Account Name", type: "text", col: "col-md-6" },
    { key: "is_pkp", label: "Is PKP", type: "switch", col: "col-md-12" },
    { key: "address", label: "Address", type: "textarea", col: "col-md-12" },
  ],
  CHART_OF_ACCOUNT: [
    { key: "account_code", label: "Account Code", type: "text", required: true, col: "col-md-6" },
    { key: "name", label: "Name", type: "text", required: true, col: "col-md-6" },
    {
      key: "account_type", label: "Account Type", type: "select", required: true, col: "col-md-6",
      options: [
        { value: "ASSET", label: "Asset" },
        { value: "LIABILITY", label: "Liability" },
        { value: "EQUITY", label: "Equity" },
        { value: "REVENUE", label: "Revenue" },
        { value: "EXPENSE", label: "Expense" },
      ],
    },
    {
      key: "normal_balance", label: "Normal Balance", type: "select", required: true, col: "col-md-6",
      options: [
        { value: "DEBIT", label: "Debit" },
        { value: "CREDIT", label: "Credit" },
      ],
    },
    { key: "parent_id", label: "Parent Account", type: "selectx", apiUrl: "/accounts/pagination", col: "col-md-12" },
  ],
  TAX: [
    { key: "name", label: "Name", type: "text", required: true, col: "col-md-6" },
    { key: "rate_percentage", label: "Rate (%)", type: "number", required: true, col: "col-md-6" },
    { key: "tax_account_id", label: "Tax Account", type: "selectx", apiUrl: "/accounts/pagination", col: "col-md-12" },
  ],
  PRODUCT_PRICE: [
    { key: "price_list_id", label: "Price List", type: "selectx", apiUrl: "/price-lists/pagination", required: true, col: "col-md-6" },
    { key: "product_id", label: "Product", type: "selectx", apiUrl: "/products/pagination", required: true, col: "col-md-6" },
    { key: "uom_id", label: "UOM", type: "selectx", apiUrl: "/uoms/pagination", col: "col-md-6" },
    { key: "markup_pct", label: "Markup %", type: "number", col: "col-md-6" },
    { key: "sell_price", label: "Sell Price", type: "number", required: true, col: "col-md-6" },
    { key: "discount_pct", label: "Discount %", type: "number", col: "col-md-6" },
  ],
  PRODUCT_UOM_CONVERSION: [
    { key: "product_id", label: "Product", type: "selectx", apiUrl: "/products/pagination", required: true, col: "col-md-6" },
    { key: "uom_id", label: "UOM", type: "selectx", apiUrl: "/uoms/pagination", required: true, col: "col-md-6" },
    { key: "conversion_rate", label: "Conversion Rate", type: "number", required: true, col: "col-md-6" },
    { key: "barcode", label: "Barcode", type: "text", col: "col-md-6" },
    { key: "length", label: "Length", type: "number", col: "col-md-3" },
    { key: "width", label: "Width", type: "number", col: "col-md-3" },
    { key: "height", label: "Height", type: "number", col: "col-md-3" },
    { key: "weight", label: "Weight", type: "number", col: "col-md-3" },
    { key: "is_stackable", label: "Is Stackable", type: "switch", col: "col-md-6" },
    { key: "max_stack_layer", label: "Max Stack Layer", type: "number", col: "col-md-6" },
  ],
  PRODUCT_SUPPLIER: [
    { key: "product_id", label: "Product", type: "selectx", apiUrl: "/products/pagination", required: true, col: "col-md-6" },
    { key: "supplier_id", label: "Supplier", type: "selectx", apiUrl: "/suppliers/pagination", required: true, col: "col-md-6" },
    { key: "supplier_sku", label: "Supplier SKU", type: "text", col: "col-md-6" },
    { key: "default_lead_time_days", label: "Lead Time (days)", type: "number", col: "col-md-6" },
    { key: "offered_price", label: "Offered Price", type: "number", col: "col-md-6" },
    { key: "min_order_qty", label: "Min Order Qty", type: "number", col: "col-md-6" },
    { key: "is_primary", label: "Is Primary", type: "switch", col: "col-md-4" },
    { key: "is_consignment", label: "Is Consignment", type: "switch", col: "col-md-4" },
    { key: "is_returnable", label: "Is Returnable", type: "switch", col: "col-md-4" },
  ],
};

const entitySearchUrl: Record<string, string> = {
  PRODUCT: "/products/pagination",
  SUPPLIER: "/suppliers/pagination",
  CHART_OF_ACCOUNT: "/accounts/pagination",
  TAX: "/taxes/pagination",
  PRODUCT_PRICE: "/product-prices/pagination",
  PRODUCT_UOM_CONVERSION: "/product-uom-conversions/pagination",
  PRODUCT_SUPPLIER: "/product-suppliers/pagination",
};

const proposalType = ref("CREATE");
const reason = ref("");
const items = ref<Record<string, any>[]>([{}]);

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
      let text = `${sku} - ${name}`;
      if (obj.base_uom?.name) {
        text += ` (Base UOM: ${obj.base_uom.name})`;
      }
      return text;
    }
  }
  return obj.name || obj.code || obj.account_code || obj.id || "";
};

const parsePayload = (payload: any) => {
  if (!payload) return {};
  if (typeof payload === "object") return payload;
  try {
    return JSON.parse(payload);
  } catch {
    return {};
  }
};

// Resolve display name untuk field selectx yang hanya punya ID tanpa text
const resolveRelationText = async (item: Record<string, any>, field: FieldDef) => {
  if (!field.apiUrl || !item[field.key]) return;
  const detailUrl = field.apiUrl.replace('/pagination', '') + '/' + item[field.key];
  try {
    const { data } = await useApi<any>(detailUrl);
    if (data?.data) {
      item[field.key + '_text'] = formatEntityText(field.key, data.data);
    }
  } catch {
    // silently fail, user can still open dropdown to select
  }
};

// Resolve display name untuk main entity yang hanya punya ID tanpa snapshot
const resolveEntityText = async (item: Record<string, any>) => {
  const apiUrl = entitySearchUrl[props.entityType];
  if (!apiUrl || !item.entity_id) return;
  const detailUrl = apiUrl.replace('/pagination', '') + '/' + item.entity_id;
  try {
    const { data } = await useApi<any>(detailUrl);
    if (data?.data) {
      item.entity_text = formatEntityText(props.entityType, data.data);
      item._selected_obj = data.data;
    }
  } catch {
    // silently fail
  }
};

// Resolve base UOM name untuk product yang dipilih (khusus PRODUCT_UOM_CONVERSION)
const resolveProductBaseUOM = async (item: Record<string, any>) => {
  if (!item.product_id) {
    item._product_base_uom_name = null;
    return;
  }
  try {
    const { data } = await useApi<any>('/products/' + item.product_id);
    if (data?.data?.base_uom?.name) {
      item._product_base_uom_name = data.data.base_uom.name;
    } else {
      item._product_base_uom_name = null;
    }
  } catch {
    item._product_base_uom_name = null;
  }
};

watch(
  () => items.value,
  (newItems) => {
    newItems.forEach((item: any) => {
      // Jika ada _selected_obj tapi belum di-load (atau berubah)
      if (item._selected_obj && item._selected_obj.id !== item._last_selected_id) {
        item.entity_id = item._selected_obj.id;
        item.entity_text = formatEntityText(props.entityType, item._selected_obj);
        item._last_selected_id = item._selected_obj.id;
        
        // Auto-fill all fields dari data terpilih
        for (const field of currentFields.value) {
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
              // Jika ID ada tapi text tidak tersedia, fetch dari API
              resolveRelationText(item, field);
            }
          }

          // Resolve base UOM saat product_id berubah di PRODUCT_UOM_CONVERSION
          if (field.key === 'product_id' && props.entityType === 'PRODUCT_UOM_CONVERSION') {
            resolveProductBaseUOM(item);
          }
        }
      } else if (!item._selected_obj && !item.entity_id && item._last_selected_id) {
        // Jika select-search di-clear
        item.entity_id = null;
        item.entity_text = "";
        item._last_selected_id = null;
        for (const field of currentFields.value) {
          item[field.key] = null;
          if (field.type === 'selectx') {
            item[field.key + '_text'] = "";
          }
        }
      }
    });
  },
  { deep: true }
);

// Watch khusus untuk product_id change di mode CREATE (PRODUCT_UOM_CONVERSION)
if (props.entityType === 'PRODUCT_UOM_CONVERSION') {
  watch(
    () => items.value.map((item: any) => item.product_id),
    (newIds, oldIds) => {
      newIds.forEach((id: any, idx: number) => {
        const item = items.value[idx];
        if (!item) return;
        if (id && id !== oldIds?.[idx]) {
          resolveProductBaseUOM(item);
        } else if (!id) {
          item._product_base_uom_name = null;
        }
      });
    }
  );
}

const currentFields = computed(() => entityFields[props.entityType] || []);

if (props.proposal) {
  fillForm(props.proposal);
}

function fillForm(proposal: any) {
  proposalType.value = proposal.action_type;
  reason.value = proposal.reason || "";
  
  items.value = proposal.items.map((item: any) => {
    const base: Record<string, any> = {
      _item_id: item.id,
      entity_id: item.entity_id || null,
    };
    
    const parsedPayload = parsePayload(item.payload_json);
    
    if (proposal.action_type === "CREATE" || proposal.action_type === "UPDATE") {
      const snapshot = parsePayload(item.snapshot_json);
      const displayVal = snapshot && Object.keys(snapshot).length ? formatEntityText(props.entityType, snapshot) : (item.entity_id || "");
      
      const merged = { 
        ...base, 
        ...parsedPayload,
        entity_text: displayVal,
        _selected_obj: snapshot && Object.keys(snapshot).length ? snapshot : null,
        _last_selected_id: item.entity_id
      };

      // Auto-fill _text fields dari snapshot jika data utama ada tapi teks-nya kosong
      for (const field of currentFields.value) {
        if (field.type === 'selectx') {
          const textKey = field.key + '_text';
          if (merged[field.key] && !merged[textKey] && snapshot && Object.keys(snapshot).length) {
            // Coba ambil dari snapshot relasi
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

      return merged;
    }
    
    if (proposal.action_type === "DELETE") {
      const snapshot = parsePayload(item.snapshot_json);
      const displayVal = snapshot && Object.keys(snapshot).length ? formatEntityText(props.entityType, snapshot) : (item.entity_id || "");
      const merged = {
        ...base,
        entity_text: displayVal,
        _selected_obj: snapshot && Object.keys(snapshot).length ? snapshot : null,
        _last_selected_id: item.entity_id
      };
      return merged;
    }
    
    return base;
  });

  // Jalankan resolusi API setelah items.value di-set ke reactive proxy agar reaktif
  items.value.forEach((item: any) => {
    if (proposal.action_type === "CREATE" || proposal.action_type === "UPDATE") {
      if (item.entity_id && !item._selected_obj) {
        resolveEntityText(item);
      }
      for (const field of currentFields.value) {
        if (field.type === 'selectx') {
          const textKey = field.key + '_text';
          if (item[field.key] && !item[textKey]) {
            resolveRelationText(item, field);
          }
        }
      }
    } else if (proposal.action_type === "DELETE") {
      if (item.entity_id && !item._selected_obj) {
        resolveEntityText(item);
      }
    }
  });
}

const addItem = () => {
  items.value.push({});
};

const removeItem = (idx: number) => {
  items.value.splice(idx, 1);
};

const form = ref<HTMLFormElement>();
const { loading, success, errors, formatError, submitForm } = useForm2();

const onSubmit = async () => {
  const dataPayload: Record<string, any> = {
    entity_type: props.entityType,
    action_type: proposalType.value,
    reason: reason.value || undefined,
    items: items.value.map((item: any) => {
      let payload: any;
      if (proposalType.value === "CREATE" || proposalType.value === "UPDATE") {
        const fields = currentFields.value.map((f) => f.key);
        payload = {};
        for (const key of fields) {
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
    await submitForm(`/master-data/${props.id}`, {
      method: "PUT",
      body: dataPayload,
    });
  } else {
    await submitForm("/master-data", {
      method: "POST",
      body: dataPayload,
    });
  }
  if (success.value) navigateTo(props.basePath);
};
</script>

<template>
  <div>
    <PageHeader :title="title" :icon="icon">
      <ui-button-back :to="basePath" />
      <ui-button-save :loading="loading" :form="form" @save="form?.requestSubmit()" />
    </PageHeader>
    <PageBody>
      <form ref="form" autocomplete="off" novalidate @submit.prevent="onSubmit">
        <div class="row justify-content-center">
          <div class="col-xl-8 col-md-8 col-sm-12">
            <div class="mb-3">
              <label class="form-label">Action <span class="text-danger">*</span></label>
              <select v-model="proposalType" class="form-select rounded-1" :disabled="isEdit">
                <option v-for="at in actionTypes" :key="at.value" :value="at.value">
                  {{ at.label }}
                </option>
              </select>
            </div>

            <ui-textarea
              v-model="reason"
              label="Reason"
              placeholder="Optional reason for this proposal"
              :error="formatError('Reason', 'reason')"
            />

            <hr class="my-3" />
            <label class="fw-semibold mb-3">Items</label>

            <div
              v-for="(item, idx) in items"
              :key="idx"
              class="border rounded-1 p-3 mb-3 position-relative"
            >
              <!-- Item Header (Numbering & Delete Button) -->
              <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                <span class="fw-semibold text-muted small text-uppercase">Item #{{ idx + 1 }}</span>
                <button
                  v-if="items.length > 1"
                  type="button"
                  class="btn btn-sm btn-link text-danger p-0 border-0 text-decoration-none d-flex align-items-center"
                  @click="removeItem(idx)"
                >
                  <Icon name="i-tabler:trash" class="icon me-1" style="font-size: 1.1rem;" />
                  Hapus
                </button>
              </div>

              <!-- UPDATE Mode Search -->
              <div v-if="proposalType === 'UPDATE'" class="mb-3">
                <label class="form-label">Cari Data yang Ingin Diubah <span class="text-danger">*</span></label>
                <UiSelectSearch5
                  v-model="item.entity_id"
                  v-model:display-value="item.entity_text"
                  v-model:selected-data="item._selected_obj"
                  value-key="id"
                  :api-url="entitySearchUrl[entityType] || ''"
                  :xname="entityType.toLowerCase() + '_id'"
                  placeholder="Ketik untuk mencari data..."
                  :clearable="true"
                  :selected-format="(e) => formatEntityText(entityType, e)"
                  :select-format="(e) => formatEntityText(entityType, e)"
                />
              </div>

              <!-- DELETE Mode Search -->
              <div v-if="proposalType === 'DELETE'" class="mb-3">
                <label class="form-label">Pilih Data yang Ingin Dihapus <span class="text-danger">*</span></label>
                <UiSelectSearch5
                  v-model="item.entity_id"
                  v-model:display-value="item.entity_text"
                  v-model:selected-data="item._selected_obj"
                  value-key="id"
                  :api-url="entitySearchUrl[entityType] || ''"
                  :xname="entityType.toLowerCase() + '_id'"
                  placeholder="Ketik untuk mencari data..."
                  :clearable="true"
                  :selected-format="(e) => formatEntityText(entityType, e)"
                  :select-format="(e) => formatEntityText(entityType, e)"
                />
                
                <div v-if="item._selected_obj" class="mt-3 p-3 bg-light rounded-1 border text-dark">
                  <div class="fw-semibold mb-2 small text-uppercase text-muted">Ringkasan Data yang Akan Dihapus:</div>
                  <div class="row g-2 small">
                    <template v-for="field in currentFields.filter(f => f.type !== 'switch' && f.type !== 'textarea').slice(0, 4)" :key="field.key">
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
                  <template v-for="field in currentFields" :key="field.key">
                    <div v-if="field.type === 'switch'" class="col-12">
                      <div class="form-check form-switch">
                        <input
                          :id="`field-${idx}-${field.key}`"
                          v-model="item[field.key]"
                          class="form-check-input"
                          type="checkbox"
                          :true-value="true"
                          :false-value="false"
                        />
                        <label class="form-check-label" :for="`field-${idx}-${field.key}`">
                          {{ field.label }}
                        </label>
                      </div>
                    </div>
                    <div v-else :class="field.col || 'col-md-12'">
                      <template v-if="field.type === 'select' && field.options">
                        <label class="form-label">{{ field.label }} <span v-if="field.required" class="text-danger">*</span></label>
                        <select v-model="item[field.key]" class="form-select rounded-1">
                          <option value="" disabled>Select {{ field.label }}</option>
                          <option v-for="opt in field.options" :key="opt.value" :value="opt.value">
                            {{ opt.label }}
                          </option>
                        </select>
                      </template>
                      <template v-else-if="field.type === 'selectx'">
                        <label class="form-label">{{ field.label }} <span v-if="field.required" class="text-danger">*</span></label>
                        <UiSelectSearch5
                          v-model="item[field.key]"
                          v-model:display-value="item[field.key+'_text']"
                          v-model:selected-data="item[field.key+'_obj']"
                          value-key="id"
                          :api-url="field.apiUrl as string"
                          :xname="`${field.key}_id`"
                          :placeholder="'Select ' + field.label"
                          :clearable="true"
                          :selected-format="(e) => formatEntityText(field.key, e)"
                          :select-format="(e) => formatEntityText(field.key, e)"
                        />
                        <small
                          v-if="field.key === 'product_id' && entityType === 'PRODUCT_UOM_CONVERSION' && item._product_base_uom_name"
                          class="text-muted mt-1 d-block"
                        >
                          <Icon name="i-tabler:info-circle" class="me-1" style="font-size: 0.9rem; vertical-align: text-bottom;" />
                          Base UOM: <strong>{{ item._product_base_uom_name }}</strong>
                        </small>
                      </template>
                      <template v-else-if="field.type === 'textarea'">
                        <ui-textarea
                          v-model="item[field.key]"
                          :label="field.label"
                          :placeholder="'Input ' + field.label"
                          rows="2"
                        />
                      </template>
                      <template v-else>
                        <ui-input2
                          v-model="item[field.key]"
                          :label="field.label + (field.required ? ' *' : '')"
                          :type="field.type"
                          :placeholder="'Input ' + field.label"
                        />
                      </template>
                    </div>
                  </template>
                </div>
              </template>
            </div>

            <button
              v-if="proposalType === 'CREATE' || proposalType === 'UPDATE'"
              type="button"
              class="btn btn-outline-secondary w-100 py-2 d-flex align-items-center justify-content-center rounded-1 mt-2 text-muted"
              style="border-style: dashed; border-width: 1px; background-color: rgba(0,0,0,0.02);"
              @click="addItem"
            >
              <Icon name="i-tabler:plus" class="me-1" style="font-size: 1.15rem;" />
              Tambah Item Baru
            </button>
          </div>
        </div>
      </form>
    </PageBody>
  </div>
</template>
