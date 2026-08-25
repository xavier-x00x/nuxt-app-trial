
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
  title: "Usulan Supplier Baru",
  icon: "i-tabler:truck",
  basePath: "/usulan/supplier",
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
    "key": "code",
    "label": "Code",
    "type": "text",
    "required": true,
    "col": "col-md-6"
  },
  {
    "key": "name",
    "label": "Name",
    "type": "text",
    "required": true,
    "col": "col-md-6"
  },
  {
    "key": "contact_person",
    "label": "Contact Person",
    "type": "text",
    "col": "col-md-6"
  },
  {
    "key": "contact_phone",
    "label": "Contact Phone",
    "type": "text",
    "col": "col-md-6"
  },
  {
    "key": "phone_number",
    "label": "Phone Number",
    "type": "text",
    "col": "col-md-6"
  },
  {
    "key": "email",
    "label": "Email",
    "type": "email",
    "col": "col-md-6"
  },
  {
    "key": "preferred_notification_method",
    "label": "Notification Method",
    "type": "select",
    "col": "col-md-6",
    "options": [
      {
        "value": "EMAIL",
        "label": "Email"
      },
      {
        "value": "WHATSAPP",
        "label": "Whatsapp"
      },
      {
        "value": "",
        "label": "None"
      }
    ]
  },
  {
    "key": "tax_reg_number",
    "label": "Tax Reg Number",
    "type": "text",
    "col": "col-md-6"
  },
  {
    "key": "supplier_category_id",
    "label": "Supplier Category",
    "type": "selectx",
    "apiUrl": "/supplier-categories/pagination",
    "col": "col-md-6"
  },
  {
    "key": "ap_account_id",
    "label": "AP Account",
    "type": "selectx",
    "apiUrl": "/accounts/query",
    "col": "col-md-6"
  },
  {
    "key": "payment_term_days",
    "label": "Payment Term (days)",
    "type": "number",
    "col": "col-md-6"
  },
  {
    "key": "payment_mode",
    "label": "Payment Mode",
    "type": "text",
    "col": "col-md-6"
  },
  {
    "key": "min_order_amount",
    "label": "Min Order Amount",
    "type": "number",
    "col": "col-md-6"
  },
  {
    "key": "promo_marketing_discount_percentage",
    "label": "Promo Marketing Discount (%)",
    "type": "number",
    "col": "col-md-6"
  },
  {
    "key": "bank_name",
    "label": "Bank Name",
    "type": "text",
    "col": "col-md-6"
  },
  {
    "key": "bank_account",
    "label": "Bank Account",
    "type": "text",
    "col": "col-md-6"
  },
  {
    "key": "bank_account_name",
    "label": "Bank Account Name",
    "type": "text",
    "col": "col-md-6"
  },
  {
    "key": "is_pkp",
    "label": "Is PKP",
    "type": "switch",
    "col": "col-md-12"
  },
  {
    "key": "address",
    "label": "Address",
    "type": "textarea",
    "col": "col-md-12"
  }
];
const fieldsKeys = ["code", "name", "contact_person", "contact_phone", "phone_number", "email", "preferred_notification_method", "tax_reg_number", "supplier_category_id", "ap_account_id", "payment_term_days", "payment_mode", "min_order_amount", "promo_marketing_discount_percentage", "bank_name", "bank_account", "bank_account_name", "is_pkp", "address"];

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
      let text = `${sku} - ${name}`;
      if (obj.base_uom?.name) {
        text += ` (Base UOM: ${obj.base_uom.name})`;
      }
      return text;
    }
  }
  return obj.name || obj.code || obj.account_code || obj.id || "";
};

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
  const apiUrl = "/suppliers/pagination";
  if (!apiUrl || !item.entity_id) return;
  const detailUrl = apiUrl.replace('/pagination', '') + '/' + item.entity_id;
  try {
    const { data } = await useApi<any>(detailUrl);
    if (data?.data) {
      item.entity_text = formatEntityText("SUPPLIER", data.data);
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
        item.entity_text = formatEntityText("SUPPLIER", item._selected_obj);
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
    });
  },
  { deep: true }
);



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
      const displayVal = snapshot && Object.keys(snapshot).length ? formatEntityText("SUPPLIER", snapshot) : (item.entity_id || "");
      const merged = { 
        ...base, ...parsedPayload, entity_text: displayVal,
        _selected_obj: snapshot && Object.keys(snapshot).length ? snapshot : null,
        _last_selected_id: item.entity_id
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
    entity_type: "SUPPLIER",
    action_type: proposalType.value,
    reason: reason.value || undefined,
    items: items.value.map((item: any) => {
      let payload: any;
      if (proposalType.value === "CREATE" || proposalType.value === "UPDATE") {
        payload = {};
        for (const key of fieldsKeys) {
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
          <div class="col-xl-8 col-md-8 col-sm-12">
            <div class="mb-3">
              <label class="form-label">Action <span class="text-danger">*</span></label>
              <select v-model="proposalType" class="form-select rounded-1" :disabled="isEdit">
                <option v-for="at in actionTypes" :key="at.value" :value="at.value">{{ at.label }}</option>
              </select>
            </div>

            <ui-textarea v-model="reason" label="Reason" placeholder="Optional reason for this proposal" :error="formatError('Reason', 'reason')" />

            <hr class="my-3" />
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
                  api-url="/purchasing/suppliers/pagination"
                  xname="entity_id"
                  placeholder="Ketik untuk mencari..."
                  :clearable="true"
                  :selected-format="(e) => formatEntityText('SUPPLIER', e)"
                  :select-format="(e) => formatEntityText('SUPPLIER', e)"
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
                <!-- Tabs Navigation -->
                <ul :id="`supplier-tab-${idx}`" class="nav nav-tabs" role="tablist">
                  <li class="nav-item" role="presentation">
                    <button :id="`info-tab-${idx}`" class="nav-link active" data-bs-toggle="tab" :data-bs-target="`#info-${idx}`" type="button" role="tab" :aria-controls="`info-${idx}`" aria-selected="true">Info Utama</button>
                  </li>
                  <li class="nav-item" role="presentation">
                    <button :id="`kontak-tab-${idx}`" class="nav-link" data-bs-toggle="tab" :data-bs-target="`#kontak-${idx}`" type="button" role="tab" :aria-controls="`kontak-${idx}`" aria-selected="false">Kontak & Alamat</button>
                  </li>
                  <li class="nav-item" role="presentation">
                    <button :id="`pembayaran-tab-${idx}`" class="nav-link" data-bs-toggle="tab" :data-bs-target="`#pembayaran-${idx}`" type="button" role="tab" :aria-controls="`pembayaran-${idx}`" aria-selected="false">Pembayaran</button>
                  </li>
                  <li class="nav-item" role="presentation">
                    <button :id="`bank-tab-${idx}`" class="nav-link" data-bs-toggle="tab" :data-bs-target="`#bank-${idx}`" type="button" role="tab" :aria-controls="`bank-${idx}`" aria-selected="false">Rekening Bank</button>
                  </li>
                </ul>

                <!-- Tabs Content -->
                <div :id="`supplier-tab-content-${idx}`" class="tab-content pt-3">
                  <!-- Tab: Info Utama -->
                  <div :id="`info-${idx}`" class="tab-pane fade show active" role="tabpanel" :aria-labelledby="`info-tab-${idx}`">
                    <div class="row g-3">
                      <div class="col-md-6">
                        <ui-input2 v-model="item.code" label="Code *" type="text" placeholder="Input Code" />
                      </div>
                      <div class="col-md-6">
                        <ui-input2 v-model="item.name" label="Name *" type="text" placeholder="Input Name" />
                      </div>
                      <div class="col-md-6">
                        <label class="form-label">Supplier Category </label>
                        <UiSelectSearch5
                          v-model="item.supplier_category_id"
                          v-model:display-value="item.supplier_category_id_text"
                          v-model:selected-data="item.supplier_category_id_obj"
                          value-key="id"
                          api-url="/purchasing/supplier-categories/pagination"
                          xname="supplier_category_id"
                          placeholder="Select Supplier Category"
                          :clearable="true"
                          :selected-format="(e) => formatEntityText('supplier_category_id', e)"
                          :select-format="(e) => formatEntityText('supplier_category_id', e)"
                        />
                      </div>
                      <div class="col-md-6">
                        <ui-input2 v-model="item.tax_reg_number" label="Tax Reg Number (NPWP)" type="text" placeholder="Input Tax Reg Number" />
                      </div>
                      <div class="col-12 mt-2">
                        <div class="form-check form-switch">
                          <input :id="`field-${idx}-is_pkp`" v-model="item.is_pkp" class="form-check-input" type="checkbox" :true-value="true" :false-value="false" />
                          <label class="form-check-label" :for="`field-${idx}-is_pkp`">Is PKP (Pengusaha Kena Pajak)</label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Tab: Kontak & Alamat -->
                  <div :id="`kontak-${idx}`" class="tab-pane fade" role="tabpanel" :aria-labelledby="`kontak-tab-${idx}`">
                    <div class="row g-3">
                      <div class="col-md-6">
                        <ui-input2 v-model="item.contact_person" label="Contact Person" type="text" placeholder="Input Contact Person" />
                      </div>
                      <div class="col-md-6">
                        <ui-input2 v-model="item.contact_phone" label="Contact Phone" type="text" placeholder="Input Contact Phone" />
                      </div>
                      <div class="col-md-6">
                        <ui-input2 v-model="item.phone_number" label="Company Phone Number" type="text" placeholder="Input Phone Number" />
                      </div>
                      <div class="col-md-6">
                        <ui-input2 v-model="item.email" label="Email" type="email" placeholder="Input Email" />
                      </div>
                      <div class="col-md-6">
                        <label class="form-label">Notification Method </label>
                        <select v-model="item.preferred_notification_method" class="form-select rounded-1">
                          <option value="" disabled>Select Notification Method</option>
                          <option value="EMAIL">Email</option>
                          <option value="WHATSAPP">Whatsapp</option>
                          <option value="">None</option>
                        </select>
                      </div>
                      <div class="col-md-12 mt-3">
                        <ui-textarea v-model="item.address" label="Address" placeholder="Input Full Address" rows="3" />
                      </div>
                    </div>
                  </div>

                  <!-- Tab: Pembayaran -->
                  <div :id="`pembayaran-${idx}`" class="tab-pane fade" role="tabpanel" :aria-labelledby="`pembayaran-tab-${idx}`">
                    <div class="row g-3">
                      <div class="col-md-6">
                        <label class="form-label">AP Account </label>
                        <UiSelectSearch5
                          v-model="item.ap_account_id"
                          v-model:display-value="item.ap_account_id_text"
                          v-model:selected-data="item.ap_account_id_obj"
                          value-key="id"
                          api-url="/finance/accounts/query"
                          xname="ap_account_id"
                          placeholder="Select AP Account"
                          :clearable="true"
                          :selected-format="(e) => formatEntityText('ap_account_id', e)"
                          :select-format="(e) => formatEntityText('ap_account_id', e)"
                        />
                      </div>
                      <div class="col-md-6">
                        <ui-input2 v-model="item.payment_mode" label="Payment Mode" type="text" placeholder="e.g. Transfer, Cash, Giro" />
                      </div>
                      <div class="col-md-6">
                        <ui-input2 v-model="item.payment_term_days" label="Payment Term (days)" type="number" placeholder="Input Payment Term (days)" />
                      </div>
                      <div class="col-md-6">
                        <ui-input2 v-model="item.min_order_amount" label="Min Order Amount" type="number" placeholder="Input Min Order Amount" />
                      </div>
                      <div class="col-md-6">
                        <ui-input2 v-model="item.promo_marketing_discount_percentage" label="Promo Marketing Discount (%)" type="number" placeholder="Contoh: 10.5" />
                      </div>
                    </div>
                  </div>

                  <!-- Tab: Rekening Bank -->
                  <div :id="`bank-${idx}`" class="tab-pane fade" role="tabpanel" :aria-labelledby="`bank-tab-${idx}`">
                    <div class="row g-3">
                      <div class="col-md-12">
                        <ui-input2 v-model="item.bank_name" label="Bank Name" type="text" placeholder="e.g. BCA, Mandiri, BNI" />
                      </div>
                      <div class="col-md-6">
                        <ui-input2 v-model="item.bank_account" label="Bank Account Number" type="text" placeholder="Input Bank Account" />
                      </div>
                      <div class="col-md-6">
                        <ui-input2 v-model="item.bank_account_name" label="Bank Account Name" type="text" placeholder="Input Bank Account Name" />
                      </div>
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
