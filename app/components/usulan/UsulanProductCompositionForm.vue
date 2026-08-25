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
  title: "Usulan Komposisi Produk Baru",
  icon: "i-tabler:binary-tree",
  basePath: "/usulan/product-composition",
  id: undefined,
  proposal: undefined,
});

const isEdit = computed(() => !!props.id);

const proposalType = ref("CREATE");
const reason = ref("");
const isLoadingCompositions = ref(false);

const headerData = ref({
  parent_product_id: "",
  parent_product_id_text: "",
  work_center_id: "",
  work_center_id_text: "",
});

const items = ref<Record<string, any>[]>([{ quantity: 0, scrap_percentage: 0 }]);

const entityFields = [
  {
    key: "component_product_id",
    label: "Komponen Bahan (Component)",
    type: "selectx",
    apiUrl: "/catalog/products/pagination",
  },
  {
    key: "uom_id",
    label: "Satuan (UOM)",
    type: "selectx",
    apiUrl: "/catalog/uoms/pagination",
  },
];

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
  if (keyOrType === "parent_product_id" || keyOrType === "component_product_id" || (obj && typeof obj === "object" && "sku" in obj)) {
    const sku = obj.sku;
    const name = obj.name;
    if (sku && name) return `${sku} - ${name}`;
  }
  if (keyOrType === "uom_id" || (obj && typeof obj === "object" && "symbol" in obj)) {
    return obj.name || obj.code || obj.id || "";
  }
  return obj.name || obj.code || obj.id || "";
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

// Automatic detection: if parent product already has compositions, load them & set to UPDATE
watch(() => headerData.value.parent_product_id, async (newParentId) => {
  if (!newParentId) {
    if (!props.proposal) {
      items.value = [{ quantity: 0, scrap_percentage: 0 }];
      proposalType.value = "CREATE";
    }
    return;
  }

  // If editing an existing proposal from props, do not overwrite with DB state
  if (props.proposal) return;

  try {
    isLoadingCompositions.value = true;
    const { data } = await useApi<any>(`/catalog/product-compositions/parent/${newParentId}`);
    const existingList = data?.data || [];
    if (existingList.length > 0) {
      proposalType.value = "UPDATE";
      items.value = existingList.map((comp: any) => ({
        entity_id: comp.id,
        component_product_id: comp.component_product_id,
        component_product_id_text: formatEntityText('component_product_id', comp.component_product),
        quantity: Number(comp.quantity) || 0,
        uom_id: comp.uom_id,
        uom_id_text: formatEntityText('uom_id', comp.uom),
        scrap_percentage: Number(comp.scrap_percentage) || 0,
        work_center_id: comp.work_center_id || "",
        _selected_obj: comp,
        _existing: true,
      }));
      if (existingList[0]?.work_center_id && !headerData.value.work_center_id) {
        headerData.value.work_center_id = existingList[0].work_center_id;
        resolveRelationText(headerData.value as any, 'work_center_id', '/inventory/work-centers/pagination');
      }
    } else {
      proposalType.value = "CREATE";
      items.value = [{ quantity: 0, scrap_percentage: 0 }];
    }
  } catch (err) {
    console.error("Failed to fetch existing compositions:", err);
    proposalType.value = "CREATE";
  } finally {
    isLoadingCompositions.value = false;
  }
});

if (props.proposal) {
  const proposal = props.proposal;
  proposalType.value = proposal.action_type || "CREATE";
  reason.value = proposal.reason || "";

  items.value = (proposal.items || []).map((item: any) => {
    const parsed = parsePayload(item.payload_json);
    const row: Record<string, any> = {
      _item_id: item.id,
      entity_id: item.entity_id,
      _selected_obj: null,
      ...parsed,
    };
    return row;
  });

  // Extract header data from the first item
  if (items.value.length > 0) {
    const first = items.value[0];
    if (first) {
      headerData.value.parent_product_id = first.parent_product_id || "";
      headerData.value.parent_product_id_text = first.parent_product_id_text || "";
      headerData.value.work_center_id = first.work_center_id || "";
      headerData.value.work_center_id_text = first.work_center_id_text || "";
    }

    if (headerData.value.parent_product_id && !headerData.value.parent_product_id_text) {
      resolveRelationText(headerData.value as any, 'parent_product_id', '/catalog/products/pagination');
    }
    if (headerData.value.work_center_id && !headerData.value.work_center_id_text) {
      resolveRelationText(headerData.value as any, 'work_center_id', '/inventory/work-centers/pagination');
    }
  }

  items.value.forEach((item: any) => {
    entityFields.forEach((field) => {
      if (field.type === 'selectx' && item[field.key] && !item[field.key + '_text']) {
        resolveRelationText(item, field.key, field.apiUrl!);
      }
    });
  });
}

const addItem = () => {
  items.value.push({ quantity: 0, scrap_percentage: 0 });
};

const removeItem = (idx: number) => {
  items.value.splice(idx, 1);
};

const form = ref<HTMLFormElement>();
const { loading, success, errors, formatError, submitForm } = useForm2();

const onSubmit = async () => {
  if (!headerData.value.parent_product_id) {
    setFlash("Silakan pilih Produk Induk (Parent) terlebih dahulu", "error");
    return;
  }

  const validItems = items.value.filter((it: any) => it.component_product_id);
  if (validItems.length === 0) {
    setFlash("Minimal harus ada satu bahan baku dalam daftar komposisi", "error");
    return;
  }

  const dataPayload: Record<string, any> = {
    entity_type: "PRODUCT_COMPOSITION",
    action_type: proposalType.value,
    reason: reason.value || undefined,
    items: validItems.map((item: any) => {
      const payload: any = {
        parent_product_id: headerData.value.parent_product_id,
        component_product_id: item.component_product_id,
        quantity: Number(item.quantity) || 0,
        uom_id: item.uom_id,
        scrap_percentage: Number(item.scrap_percentage) || 0,
        work_center_id: headerData.value.work_center_id || null,
      };
      if (headerData.value.parent_product_id_text) payload.parent_product_id_text = headerData.value.parent_product_id_text;
      if (headerData.value.work_center_id_text) payload.work_center_id_text = headerData.value.work_center_id_text;
      if (item.component_product_id_text) payload.component_product_id_text = item.component_product_id_text;
      if (item.uom_id_text) payload.uom_id_text = item.uom_id_text;

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
      <ui-button-save :loading="loading" :form="form" @save="form?.requestSubmit()" />
    </PageHeader>
    <PageBody>
      <form ref="form" autocomplete="off" novalidate @submit.prevent="onSubmit">
        <div class="row justify-content-center">
          <div class="col-xl-12 col-md-12 col-sm-12">
            <!-- Header Section -->
            <div class="row align-items-stretch mb-4">
              <div class="col-md-6">
                <div class="p-3 border rounded-1 bg-body-secondary h-100">
                  <label class="form-label fw-bold mb-2">Produk Induk (Parent) <span class="text-danger">*</span></label>
                  <UiSelectSearch5
                    v-model="headerData.parent_product_id"
                    v-model:display-value="headerData.parent_product_id_text"
                    api-url="/catalog/products/pagination"
                    value-key="id"
                    xname="parent_product_id"
                    :error="formatError('Produk Induk', 'parent_product_id')"
                    placeholder="Pilih Produk Jadi..."
                    :clearable="true"
                    :selected-format="(e) => formatEntityText('parent_product_id', e)"
                    :select-format="(e) => formatEntityText('parent_product_id', e)"
                  />

                  <label class="form-label fw-bold mb-2 mt-3">Kd Bagian (Work Center)</label>
                  <UiSelectSearch5
                    v-model="headerData.work_center_id"
                    v-model:display-value="headerData.work_center_id_text"
                    api-url="/inventory/work-centers/pagination"
                    value-key="id"
                    xname="work_center_id"
                    placeholder="Pilih Bagian (Opsional)..."
                    :clearable="true"
                    :selected-format="(e) => e.name || e.code || e.id"
                    :select-format="(e) => e.name || e.code || e.id"
                  />

                  <div class="form-text mt-3 mb-0">
                    <Icon name="i-tabler:info-circle" /> Memilih Produk Induk akan otomatis mengecek resep yang sudah ada dan menerapkannya ke tabel bahan.
                  </div>
                </div>
              </div>

              <div class="col-md-6 d-flex flex-column">
                <ui-textarea
                  v-model="reason"
                  class="flex-grow-1"
                  label="Alasan Pengajuan (Reason)"
                  placeholder="Opsional: masukkan alasan pengajuan proposal ini"
                  :error="formatError('Alasan', 'reason')"
                />
                
                <!-- Status Mode Info -->
                <div class="mt-2 p-2 border rounded-1 bg-body small d-flex align-items-center">
                  <span v-if="isLoadingCompositions" class="text-muted">
                    <span class="spinner-border spinner-border-sm me-1"></span> Memeriksa resep produk...
                  </span>
                  <span v-else-if="proposalType === 'UPDATE'" class="text-warning-emphasis d-flex align-items-center">
                    <span class="badge bg-warning text-dark me-2">UPDATE</span>
                    Resep sudah ada. Usulan akan memperbarui komposisi yang ada.
                  </span>
                  <span v-else class="text-success-emphasis d-flex align-items-center">
                    <span class="badge bg-success me-2">CREATE</span>
                    Resep baru untuk produk ini.
                  </span>
                </div>
              </div>
            </div>

            <!-- Items Section (Table Grid) -->
            <label class="fw-semibold mb-3">Daftar Bahan / Komposisi ({{ items.length }})</label>

            <div class="table-responsive border rounded-1 mb-3 bg-body shadow-sm" style="max-height: 340px; min-height: 250px; overflow-y: auto;">
              <table class="table table-hover align-middle mb-0 table-compact">
                <thead class="sticky-top">
                  <tr>
                    <th style="width: 40px" class="text-center">#</th>
                    <th style="min-width: 280px">Kd. Barang / Bahan Baku <span class="text-danger">*</span></th>
                    <th style="width: 130px">Qty <span class="text-danger">*</span></th>
                    <th style="min-width: 180px">Satuan (UOM) <span class="text-danger">*</span></th>
                    <th style="width: 130px">Susut (Scrap %)</th>
                    <th style="width: 50px" class="text-center">
                      <Icon name="i-tabler:settings" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="items.length === 0">
                    <td colspan="6" class="text-center py-4 text-muted">
                      Belum ada bahan. Klik <strong>Tambah Bahan Lainnya</strong> di bawah untuk menambahkan.
                    </td>
                  </tr>
                  <tr v-for="(item, idx) in items" :key="idx">
                    <td class="text-center text-muted fw-bold small align-middle">{{ idx + 1 }}</td>
                    <td>
                      <UiSelectSearch5
                        v-model="item.component_product_id"
                        v-model:display-value="item.component_product_id_text"
                        api-url="/catalog/products/pagination"
                        value-key="id"
                        :xname="`items.${idx}.component_product_id`"
                        :max-height="180"
                        :error="formatError('Komponen', `items[${idx}].payload_json.component_product_id`)"
                        placeholder="Pilih Bahan..."
                        :clearable="true"
                        :selected-format="(e) => formatEntityText('component_product_id', e)"
                        :select-format="(e) => formatEntityText('component_product_id', e)"
                      />
                    </td>
                    <td>
                      <ui-input2
                        v-model="item.quantity"
                        type="number"
                        placeholder="0.000"
                        :hide-label="true"
                        :decimal="3"
                        :error="formatError('Qty', `items[${idx}].payload_json.quantity`)"
                      />
                    </td>
                    <td>
                      <UiSelectSearch5
                        v-model="item.uom_id"
                        v-model:display-value="item.uom_id_text"
                        api-url="/catalog/uoms/pagination"
                        value-key="id"
                        :xname="`items.${idx}.uom_id`"
                        :max-height="180"
                        :error="formatError('Satuan', `items[${idx}].payload_json.uom_id`)"
                        placeholder="Pilih Satuan..."
                        :clearable="true"
                        :selected-format="(e) => formatEntityText('uom_id', e)"
                        :select-format="(e) => formatEntityText('uom_id', e)"
                      />
                    </td>
                    <td>
                      <ui-input2
                        v-model="item.scrap_percentage"
                        type="number"
                        placeholder="0.00"
                        :hide-label="true"
                        :decimal="2"
                        :error="formatError('Susut', `items[${idx}].payload_json.scrap_percentage`)"
                      />
                    </td>
                    <td class="text-center align-middle">
                      <button
                        v-if="items.length > 1"
                        type="button"
                        class="btn btn-sm btn-link text-danger p-1"
                        title="Hapus baris"
                        @click="removeItem(idx)"
                      >
                        <Icon name="i-tabler:trash" style="font-size: 1.25rem;" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <button
              type="button"
              class="btn btn-outline-primary w-100 py-2 d-flex align-items-center justify-content-center rounded-1 mt-2 mb-4"
              style="border-style: dashed; border-width: 2px;"
              @click="addItem"
            >
              <Icon name="i-tabler:plus" class="me-1" style="font-size: 1.15rem;" /> Tambah Bahan Lainnya
            </button>
          </div>
        </div>
      </form>
    </PageBody>
  </div>
</template>

<style scoped>
.table-compact > :not(caption) > * > * {
  padding: 0.25rem 0.5rem !important;
}
.table-responsive thead.sticky-top th {
  background-color: var(--tblr-bg-surface, #182433) !important;
  z-index: 2;
}
</style>
