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
  title: "Usulan Produk Baru",
  icon: "i-tabler:box",
  basePath: "/usulan/product",
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
  if (keyOrType === "category_id" || keyOrType === "tax_id" || keyOrType === "base_uom_id") {
    return obj.name || obj.code || obj.id || "";
  }
  if (keyOrType === "PRODUCT" || (obj && typeof obj === "object" && "sku" in obj)) {
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
  return obj.name || obj.code || obj.id || "";
};

const resolveEntityText = async (item: Record<string, any>) => {
  if (!item.entity_id) return;
  try {
    const { data } = await useApi<any>(`/products/${item.entity_id}`);
    if (data?.data) {
      item.entity_text = formatEntityText("PRODUCT", data.data);
      item._selected_obj = data.data;
    }
  } catch {}
};

const resolveRelationText = async (item: Record<string, any>, key: string, url: string) => {
  if (!item[key]) return;
  try {
    const { data } = await useApi<any>(`${url}/${item[key]}`);
    if (data?.data) {
      item[key + '_text'] = formatEntityText(key, data.data);
    }
  } catch {}
};

watch(
  () => items.value,
  (newItems) => {
    newItems.forEach((item: any) => {
      if (item._selected_obj && item._selected_obj.id !== item._last_selected_id) {
        item.entity_id = item._selected_obj.id;
        item.entity_text = formatEntityText("PRODUCT", item._selected_obj);
        item._last_selected_id = item._selected_obj.id;
        
        const fields = ["sku", "barcode", "name", "variant", "category_id", "base_uom_id", "length", "width", "height", "weight", "is_stackable", "is_stockable", "is_taxable", "tax_id", "max_stack_layer"];
        for (const field of fields) {
          item[field] = item._selected_obj[field] !== undefined ? item._selected_obj[field] : null;
        }

        if (item._selected_obj.category) item.category_id_text = item._selected_obj.category.name;
        else if (item._selected_obj.category_name) item.category_id_text = item._selected_obj.category_name;

        if (item._selected_obj.base_uom) item.base_uom_id_text = item._selected_obj.base_uom.name;
        else if (item._selected_obj.uom_name) item.base_uom_id_text = item._selected_obj.uom_name;

        if (item._selected_obj.tax) item.tax_id_text = item._selected_obj.tax.name;
        else if (item._selected_obj.tax_name) item.tax_id_text = item._selected_obj.tax_name;
      } else if (!item._selected_obj && !item.entity_id && item._last_selected_id) {
        item.entity_id = null;
        item.entity_text = "";
        item._last_selected_id = null;
        const fields = ["sku", "barcode", "name", "variant", "category_id", "base_uom_id", "length", "width", "height", "weight", "is_stackable", "is_stockable", "is_taxable", "tax_id", "max_stack_layer"];
        for (const field of fields) item[field] = null;
        item.category_id_text = "";
        item.base_uom_id_text = "";
        item.tax_id_text = "";
      }
    });
  },
  { deep: true }
);

watch(
  () => items.value.map(item => item.category_id),
  (newIds, oldIds) => {
    newIds.forEach(async (id, idx) => {
      const item = items.value[idx];
      if (!item) return;
      if (id && id !== oldIds?.[idx]) {
        try {
          const { data } = await useApi<any>(`/categories/${id}/next-sku`);
          if (data?.data?.sku ) {
            // && !item.sku
            item.sku = data.data.sku;
          }
        } catch {}
      }
    });
  }
);

const generateBarcode = (item: any) => {
  const random12 = Math.floor(100000000000 + Math.random() * 900000000000).toString();
  const random13 = random12 + Math.floor(Math.random() * 10).toString();
  item.barcode = random13;
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
      const displayVal = snapshot && Object.keys(snapshot).length ? formatEntityText("PRODUCT", snapshot) : (item.entity_id || "");
      const merged = { 
        ...base, ...parsedPayload, entity_text: displayVal,
        _selected_obj: snapshot && Object.keys(snapshot).length ? snapshot : null,
        _last_selected_id: item.entity_id
      };
      if (snapshot?.category?.name) merged.category_id_text = snapshot.category.name;
      else if (snapshot?.category_id_text) merged.category_id_text = snapshot.category_id_text;

      if (snapshot?.base_uom?.name) merged.base_uom_id_text = snapshot.base_uom.name;
      else if (snapshot?.base_uom_id_text) merged.base_uom_id_text = snapshot.base_uom_id_text;

      if (snapshot?.tax?.name) merged.tax_id_text = snapshot.tax.name;
      else if (snapshot?.tax_id_text) merged.tax_id_text = snapshot.tax_id_text;
      
      return merged;
    }
    return base;
  });

  items.value.forEach((item: any) => {
    if (proposal.action_type === "CREATE" || proposal.action_type === "UPDATE") {
      if (item.entity_id && !item._selected_obj) resolveEntityText(item);
      if (item.category_id && !item.category_id_text) resolveRelationText(item, "category_id", "/categories");
      if (item.base_uom_id && !item.base_uom_id_text) resolveRelationText(item, "base_uom_id", "/uoms");
      if (item.tax_id && !item.tax_id_text) resolveRelationText(item, "tax_id", "/taxes");
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

const form = ref<HTMLFormElement>();
const { loading, success, errors, formatError, submitForm } = useForm2();

const onSubmit = async () => {
  const dataPayload: Record<string, any> = {
    entity_type: "PRODUCT",
    action_type: proposalType.value,
    reason: reason.value || undefined,
    items: items.value.map((item: any) => {
      let payload: any;
      if (proposalType.value === "CREATE" || proposalType.value === "UPDATE") {
        const fields = ["sku", "barcode", "name", "variant", "category_id", "base_uom_id", "length", "width", "height", "weight", "is_stackable", "is_stockable", "is_taxable", "tax_id", "max_stack_layer"];
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
      <ui-button-save :loading="loading" :form="form" @save="form?.requestSubmit()" />
    </PageHeader>
    <PageBody>
      <form ref="form" autocomplete="off" novalidate @submit.prevent="onSubmit">
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
            <label class="fw-semibold mb-3">Items Produk</label>

            <div v-for="(item, idx) in items" :key="idx" class="border rounded-1 p-3 mb-3 position-relative bg-body shadow-sm">
              <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                <span class="fw-bold text-primary small text-uppercase">Produk #{{ idx + 1 }}</span>
                <button v-if="items.length > 1" type="button" class="btn btn-sm btn-link text-danger p-0 border-0 text-decoration-none d-flex align-items-center" @click="removeItem(idx)">
                  <Icon name="i-tabler:trash" class="icon me-1" style="font-size: 1.1rem;" /> Hapus
                </button>
              </div>

              <!-- UPDATE/DELETE Mode Search -->
              <div v-if="proposalType === 'UPDATE' || proposalType === 'DELETE'" class="mb-4">
                <label class="form-label">Cari Produk <span class="text-danger">*</span></label>
                <UiSelectSearch5
                  v-model="item.entity_id"
                  v-model:display-value="item.entity_text"
                  v-model:selected-data="item._selected_obj"
                  value-key="id"
                  api-url="/products/pagination"
                  xname="product_id"
                  placeholder="Ketik nama atau SKU produk..."
                  :clearable="true"
                  :selected-format="(e) => formatEntityText('PRODUCT', e)"
                  :select-format="(e) => formatEntityText('PRODUCT', e)"
                />
              </div>

              <div v-if="proposalType === 'DELETE' && item._selected_obj" class="mt-3 p-3 bg-body-secondary rounded-1 border">
                <div class="fw-semibold mb-2 small text-uppercase text-muted">Ringkasan Produk yang Akan Dihapus:</div>
                <div class="row g-2 small">
                  <div class="col-6"><strong>SKU:</strong> {{ item._selected_obj.sku }}</div>
                  <div class="col-6"><strong>Nama:</strong> {{ item._selected_obj.name }}</div>
                </div>
              </div>

              <!-- CREATE & UPDATE Dynamic Fields -->
              <template v-if="proposalType === 'CREATE' || (proposalType === 'UPDATE' && item.entity_id)">
                <div class="row g-3">
                  <!-- Identitas Produk -->
                  <div class="col-12"><h5 class="mb-0 mt-2 fw-semibold text-muted border-bottom pb-2">Informasi Utama</h5></div>
                  
                  <div class="col-md-6">
                    <label class="form-label mb-1">Kategori <span class="text-danger">*</span></label>
                    <UiSelectSearch5 v-model="item.category_id" v-model:display-value="item.category_id_text" value-key="id" api-url="/categories/pagination" xname="category_id" placeholder="Pilih Kategori" :clearable="true" :error="formatError('Kategori', `items[${idx}].category_id`)" />
                  </div>
                  <div class="col-md-6">
                    <ui-input2 v-model="item.sku" label="SKU *" type="text" placeholder="Masukkan SKU" :error="formatError('SKU', `items[${idx}].sku`)" />
                  </div>
                  
                  <div class="col-md-12">
                    <ui-input2 v-model="item.name" label="Nama Produk *" type="text" placeholder="Masukkan Nama Produk" :error="formatError('Nama Produk', `items[${idx}].name`)" />
                  </div>
                  <div class="col-md-6 mb-3">
                    <ui-input2 v-model="item.variant" label="Varian" type="text" placeholder="Masukkan Varian Produk (Misal: Merah, XL)" :error="formatError('Varian', `items[${idx}].variant`)" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label mb-1">Satuan Dasar (Base UOM) <span class="text-danger">*</span></label>
                    <UiSelectSearch5 v-model="item.base_uom_id" v-model:display-value="item.base_uom_id_text" value-key="id" api-url="/uoms/pagination" xname="base_uom_id" placeholder="Pilih Satuan" :clearable="true" :error="formatError('Satuan Dasar', `items[${idx}].base_uomid`)" />
                  </div>
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label class="form-label mb-1">Barcode</label>
                      <div class="input-group">
                        <input v-model="item.barcode" type="text" class="form-control rounded-start-1" placeholder="Masukkan Barcode" autocomplete="off" />
                        <button type="button" class="btn btn-outline-primary d-flex align-items-center rounded-end-1" @click="generateBarcode(item)" title="Generate Barcode">
                          <Icon name="i-tabler:barcode" class="me-1" />
                          Generate
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Dimensi & Fisik -->
                  <div class="col-12"><h5 class="mb-0 mt-3 fw-semibold text-muted border-bottom pb-2">Dimensi Fisik</h5></div>
                  
                  <div class="col-md-3">
                    <ui-input2 v-model="item.length" label="Panjang (cm)" type="number" placeholder="0" :error="formatError('Panjang', `items[${idx}].length`)" />
                  </div>
                  <div class="col-md-3">
                    <ui-input2 v-model="item.width" label="Lebar (cm)" type="number" placeholder="0" :error="formatError('Lebar', `items[${idx}].width`)" />
                  </div>
                  <div class="col-md-3">
                    <ui-input2 v-model="item.height" label="Tinggi (cm)" type="number" placeholder="0" :error="formatError('Tinggi', `items[${idx}].height`)" />
                  </div>
                  <div class="col-md-3">
                    <ui-input2 v-model="item.weight" label="Berat (kg)" type="number" placeholder="0" :error="formatError('Berat', `items[${idx}].weight`)" />
                  </div>

                  <!-- Aturan Penyimpanan & Pajak -->
                  <div class="col-12"><h5 class="mb-0 mt-3 fw-semibold text-muted border-bottom pb-2">Pengaturan & Pajak</h5></div>

                  <div class="col-md-6 d-flex flex-column gap-3">
                    <div class="form-check form-switch">
                      <input :id="`field-${idx}-stockable`" v-model="item.is_stockable" class="form-check-input" type="checkbox" :true-value="true" :false-value="false" />
                      <label class="form-check-label" :for="`field-${idx}-stockable`">Dapat Disimpan di Gudang</label>
                    </div>
                    <div class="form-check form-switch">
                      <input :id="`field-${idx}-stackable`" v-model="item.is_stackable" class="form-check-input" type="checkbox" :true-value="true" :false-value="false" />
                      <label class="form-check-label" :for="`field-${idx}-stackable`">Boleh Ditumpuk</label>
                    </div>
                    <div v-if="item.is_stackable">
                      <ui-input2 v-model="item.max_stack_layer" label="Maksimum Tumpukan" type="number" placeholder="0" :error="formatError('Maksimum Tumpukan', `items[${idx}].max_stack_layer`)" />
                    </div>
                  </div>

                  <div class="col-md-6 d-flex flex-column gap-3 border-start ps-4">
                    <div class="form-check form-switch">
                      <input :id="`field-${idx}-taxable`" v-model="item.is_taxable" class="form-check-input" type="checkbox" :true-value="true" :false-value="false" />
                      <label class="form-check-label" :for="`field-${idx}-taxable`">Dikenakan Pajak PPN</label>
                    </div>
                    <div v-if="item.is_taxable">
                      <label class="form-label">Pilih Jenis Pajak <span class="text-danger">*</span></label>
                      <UiSelectSearch5 v-model="item.tax_id" v-model:display-value="item.tax_id_text" value-key="id" api-url="/taxes/pagination" xname="tax_id" placeholder="Pilih Pajak" :clearable="true" :error="formatError('Jenis Pajak', `items[${idx}].tax_id`)" />
                    </div>
                  </div>

                </div>
              </template>
            </div>

            <button v-if="proposalType === 'CREATE' || proposalType === 'UPDATE'" type="button" class="btn btn-outline-primary w-100 py-2 d-flex align-items-center justify-content-center rounded-1 mt-2 mb-5" style="border-style: dashed; border-width: 2px;" @click="addItem">
              <Icon name="i-tabler:plus" class="me-1" style="font-size: 1.15rem;" /> Tambah Item Produk Lainnya
            </button>
          </div>
        </div>
      </form>
    </PageBody>
  </div>
</template>
