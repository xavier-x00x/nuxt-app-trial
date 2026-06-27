<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';

const { setFlash } = useFlash();

interface Props {
  title?: string;
  icon?: string;
  basePath?: string;
  id?: string;
  proposal?: any;
}

const props = withDefaults(defineProps<Props>(), {
  title: "Usulan Harga Jual Baru",
  icon: "i-tabler:currency-dollar",
  basePath: "/usulan/product-price",
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
    price_list_id: null,
    price_list_id_text: "",
    price_list_id_obj: null,
    uom_id: null,
    uom_id_text: "",
    uom_id_obj: null,
    markup_pct: 0,
    sell_price: 0,
    _action: 'CREATE',
    _old_price: null,
    _suggested_price: 0,
    _hpp: null,
    _loading: false,
    _context_loaded: false,
    _price_manually_edited: false,
    _existing_id: null,
    _is_initial: false,
    _last_product_id: null,
    _last_price_list_id: null,
    _last_uom_id: null,
    _last_markup_pct: null,
    _product_detail: null,
    _valid_uoms: [],
  }
]);

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

const globalPriceListId = computed({
  get: () => items.value.length > 0 ? items.value[0]?.price_list_id : undefined,
  set: (val) => {
    items.value.forEach((item: any) => {
      item.price_list_id = val;
    });
  }
});

const globalPriceListIdText = computed({
  get: () => items.value.length > 0 ? items.value[0]?.price_list_id_text : undefined,
  set: (val) => {
    items.value.forEach((item: any) => {
      item.price_list_id_text = val;
    });
  }
});

const globalPriceListIdObj = computed({
  get: () => items.value.length > 0 ? items.value[0]?.price_list_id_obj : undefined,
  set: (val) => {
    items.value.forEach((item: any) => {
      item.price_list_id_obj = val;
    });
  }
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
      const plid = item.price_list_id;
      const uid = item.uom_id;

      if (pid) {
        if (
          pid !== item._last_product_id ||
          plid !== item._last_price_list_id ||
          uid !== item._last_uom_id
        ) {
          item._last_product_id = pid;
          item._last_price_list_id = plid;
          item._last_uom_id = uid;

          item._loading = true;
          item._context_loaded = false;

          try {
            const [productRes, suppliersRes, priceRes, uomConvRes] = await Promise.all([
              useApi<any>(`/products/${pid}`),
              useApi<any>(`/products/${pid}/suppliers`),
              useApi<any>(`/product-prices/product/${pid}`),
              useApi<any>(`/product-uoms/product/${pid}`)
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

            let currentUid = uid;
            
            const isUidValid = currentUid && validUoms.find((u: any) => u.id === currentUid);
            if (!isUidValid && productData?.base_uom_id) {
              currentUid = productData.base_uom_id;
              item.uom_id = productData.base_uom_id;
              item.uom_id_text = productData.uom_name || "Base UOM";
              item.uom_id_obj = { id: productData.base_uom_id, name: productData.uom_name || "Base UOM" };
              item._last_uom_id = currentUid;
            }

            if (!currentUid) {
               item._loading = false;
               return;
            }

            const category = productData?.category;
            const default_markup_pct = category?.default_markup_pct || 0;

            const suppliers = suppliersRes.data?.data || [];
            const primarySupplier = suppliers.find((s: any) => s.is_primary === true);
            let hpp = Number(primarySupplier?.offered_price) || 0;

            if (currentUid !== productData?.base_uom_id && uomConversions.length > 0) {
               const conv = uomConversions.find((c: any) => c.uom_id === currentUid);
               if (conv && conv.conversion_rate) {
                  hpp = hpp * Number(conv.conversion_rate);
               }
            }

            const prices = priceRes.data?.data || [];
            const existing = prices.find((p: any) => p.price_list_id === plid && p.uom_id === currentUid);

            const markup = (existing && existing.markup_pct > 0) ? existing.markup_pct : default_markup_pct;
            const raw_suggested = hpp > 0 ? hpp + (hpp * markup / 100) : 0;
            const suggested_price = applyPriceRounding(raw_suggested);

            item._action = existing ? 'UPDATE' : 'CREATE';
            item._old_price = existing ? (existing.sell_price || null) : null;
            item._existing_id = existing ? (existing.id || null) : null;
            item._hpp = hpp;

            if (item._is_initial) {
              const loadedMarkup = item.markup_pct !== undefined ? item.markup_pct : markup;
              const raw_initial_suggested = hpp > 0 ? hpp + (hpp * loadedMarkup / 100) : 0;
              item._suggested_price = applyPriceRounding(raw_initial_suggested);
              item._last_markup_pct = loadedMarkup;
              item._is_initial = false;
            } else {
              item._price_manually_edited = false;
              item.markup_pct = markup;
              item._last_markup_pct = markup;
              item._suggested_price = suggested_price;
              item.sell_price = suggested_price;
            }

            item._context_loaded = true;
          } catch (err) {
            console.error("Error fetching context details for item:", err);
          } finally {
            item._loading = false;
            
            // Auto focus to "Harga Jual" input after loading completes
            const itemIndex = items.value.indexOf(item);
            if (itemIndex >= 0) {
              nextTick(() => {
                const hargaInputs = document.querySelectorAll('.input-harga-jual');
                if (hargaInputs[itemIndex]) {
                  (hargaInputs[itemIndex] as HTMLElement).focus();
                  (hargaInputs[itemIndex] as HTMLInputElement).select();
                }
              });
            }
          }
          return;
        }
      } else {
        if (!pid || !plid) {
          item._last_product_id = pid;
          item._last_price_list_id = plid;
          item._last_uom_id = uid;
          item._context_loaded = false;
          item._action = 'CREATE';
          item._existing_id = null;
        }
      }

      if (item._context_loaded && !item._loading) {
        const currentMarkup = Number(item.markup_pct) || 0;
        if (currentMarkup !== item._last_markup_pct) {
          item._last_markup_pct = currentMarkup;

          const hpp = item._hpp || 0;
          const raw_suggested = hpp > 0 ? hpp + (hpp * currentMarkup / 100) : 0;
          const suggested_price = applyPriceRounding(raw_suggested);
          console.log(raw_suggested, suggested_price);
          
          item._suggested_price = suggested_price;

          if (!item._price_manually_edited) {
            item.sell_price = suggested_price;
          }
        }
      }
    });
  },
  { deep: true }
);

function applyPriceRounding(price: number): number {
  let x = Math.round(price / 10) * 10;
  let s = x.toString();
  
  if (x >= 1000 && x < 10000) {
    if (s.substring(1, 3) === '00') {
      let right1 = parseInt(s.substring(s.length - 1)) || 0;
      return Math.round(x - right1 - 10);
    }
  } else if (x >= 10000 && x < 100000) {
    if (s.substring(2, 3) === '0') {
      let right2 = parseInt(s.substring(s.length - 2)) || 0;
      return Math.round(x - right2 - 20);
    }
  } else if (x >= 100000 && x < 1000000) {
    if (s.substring(2, 3) === '0') {
      let right3 = parseInt(s.substring(s.length - 3)) || 0;
      return Math.round(x - right3 - 150);
    }
  } else if (x >= 1000000 && x < 10000000) {
    if (s.substring(2, 3) === '0') {
      let right4 = parseInt(s.substring(s.length - 4)) || 0;
      return Math.round(x - right4 - 1500);
    }
  }
  return x;
}

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

      price_list_id: parsedPayload.price_list_id || null,
      price_list_id_text: parsedPayload.price_list_id_text || "",

      uom_id: parsedPayload.uom_id || null,
      uom_id_text: parsedPayload.uom_id_text || "",

      markup_pct: parsedPayload.markup_pct !== undefined ? parsedPayload.markup_pct : 0,
      sell_price: parsedPayload.sell_price !== undefined ? parsedPayload.sell_price : 0,

      _price_manually_edited: true,
      _is_initial: true,
      _context_loaded: false,
      _loading: false,
      _last_product_id: null,
      _last_price_list_id: null,
      _last_uom_id: null,
      _last_markup_pct: null,
      _product_detail: null,
      _valid_uoms: [],
    };
  });

  items.value.forEach((item: any) => {
    if (item.product_id && !item.product_id_text) {
      resolveRelationText(item, 'product_id', '/products/pagination');
    }
    if (item.uom_id && !item.uom_id_text) {
      resolveRelationText(item, 'uom_id', '/uoms/pagination');
    }
    if (item.price_list_id && !item.price_list_id_text) {
      resolveRelationText(item, 'price_list_id', '/price-lists/pagination');
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
    price_list_id: globalPriceListId.value || null,
    price_list_id_text: globalPriceListIdText.value || "",
    price_list_id_obj: globalPriceListIdObj.value || null,
    uom_id: null,
    uom_id_text: "",
    uom_id_obj: null,
    markup_pct: 0,
    sell_price: 0,
    _action: 'CREATE',
    _old_price: null,
    _suggested_price: 0,
    _hpp: null,
    _loading: false,
    _context_loaded: false,
    _price_manually_edited: false,
    _existing_id: null,
    _is_initial: false,
    _last_product_id: null,
    _last_price_list_id: null,
    _last_uom_id: null,
    _last_markup_pct: null,
    _product_detail: null,
    _valid_uoms: [],
  });
  
  nextTick(() => {
    const searchInputs = document.querySelectorAll('.input-search-toggle');
    if (searchInputs.length > 0) {
      (searchInputs[searchInputs.length - 1] as HTMLElement).focus();
    }
  });
};

const removeItem = (idx: number) => {
  items.value.splice(idx, 1);
};

const formEl = ref<HTMLFormElement>();
const { loading, success, errors, formatError, submitForm } = useForm2();

const handleKeydown = (e: KeyboardEvent) => {
  if (e.ctrlKey && e.key === 'Enter') {
    e.preventDefault();
    if (formEl.value) formEl.value.requestSubmit();
  }
  if ((e.altKey && e.key.toLowerCase() === 'n') || (e.ctrlKey && e.shiftKey && e.key === 'Enter')) {
    e.preventDefault();
    addItem();
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

const onSubmit = async () => {
  const dataPayload: Record<string, any> = {
    entity_type: "PRODUCT_PRICE",
    action_type: items.value.every((i: any) => i._action === 'CREATE') ? 'CREATE' : 'UPDATE',
    reason: reason.value || undefined,
    items: items.value.map((item: any) => {
      const payload: Record<string, any> = {
        price_list_id: item.price_list_id,
        product_id: item.product_id,
        uom_id: item.uom_id || null,
        markup_pct: Number(item.markup_pct) || 0,
        sell_price: Number(item.sell_price) || 0,
      };

      if (item.price_list_id_text) payload.price_list_id_text = item.price_list_id_text;
      if (item.product_id_text) payload.product_id_text = item.product_id_text;
      if (item.uom_id_text) payload.uom_id_text = item.uom_id_text;

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
    await submitForm(`/master-data/${props.id}`, { method: "PUT", body: dataPayload });
  } else {
    await submitForm("/master-data", { method: "POST", body: dataPayload });
  }
  if (success.value) {
    navigateTo(props.basePath);
  }
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
                  <label class="form-label fw-bold mb-2">Price List Utama untuk Usulan Ini <span class="text-danger">*</span></label>
                  <UiSelectSearch5
                    v-model="globalPriceListId"
                    v-model:display-value="globalPriceListIdText"
                    v-model:selected-data="globalPriceListIdObj"
                    value-key="id"
                    api-url="/price-lists/pagination"
                    xname="global_price_list_id"
                    placeholder="Pilih Price List..."
                    :clearable="true"
                    :selected-format="(e) => formatEntityText('price_list_id', e)"
                    :select-format="(e) => formatEntityText('price_list_id', e)"
                    :error="formatError('Price List Utama', 'price_list_id')"
                  />
                  <div class="form-text mt-2 mb-0">
                    Memilih Price List di sini akan menerapkannya ke semua item di bawah secara otomatis.
                  </div>
                </div>
              </div>
              <div class="col-md-6 d-flex flex-column">
                <ui-textarea
                  class="flex-grow-1"
                  v-model="reason"
                  label="Reason"
                  placeholder="Optional reason for this proposal"
                  :error="formatError('Reason', 'reason')"
                />
              </div>
            </div>

            <label class="fw-semibold mb-3">Items</label>

            <div class="border rounded-1 mb-4 bg-body shadow-sm">
              <table class="table table-hover align-middle mb-0 table-compact">
                <thead class="table-light border-bottom">
                  <tr>
                    <th style="width: 50px;" class="text-center">#</th>
                    <th style="min-width: 250px;">Product <span class="text-danger">*</span></th>
                    <th style="min-width: 200px;">UOM <span class="text-danger">*</span></th>
                    <th style="min-width: 150px;">HPP / Harga Beli</th>
                    <th style="min-width: 150px;">Harga Lama</th>
                    <th style="min-width: 120px;">Markup %</th>
                    <th style="min-width: 150px;">Saran Harga</th>
                    <th style="min-width: 180px;">Harga Jual <span class="text-danger">*</span></th>
                    <th style="width: 60px;" class="text-center">
                      <Icon name="i-tabler:settings" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in items" :key="idx">
                    <td class="text-center">
                      <span class="fw-bold text-primary small d-block">{{ idx + 1 }}</span>
                      <template v-if="item._context_loaded">
                        <span v-if="item._action === 'CREATE'" class="badge bg-success px-1 mt-1" style="font-size: 0.65rem">NEW</span>
                        <span v-else-if="item._action === 'UPDATE'" class="badge bg-warning text-dark px-1 mt-1" style="font-size: 0.65rem">UPD</span>
                      </template>
                    </td>

                    <td>
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
                        :error="formatError(`Product ${idx + 1}`, `items[${idx}].product_id`)"
                      />
                    </td>
                    
                    <td>
                      <select v-if="item._valid_uoms && item._valid_uoms.length > 0" 
                        v-model="item.uom_id" 
                        class="form-select" 
                        :class="{ 'is-invalid': formatError(`UOM ${idx + 1}`, `items[${idx}].uom_id`) }" 
                        @change="() => { 
                           const u = item._valid_uoms.find((o: any) => o.id === item.uom_id); 
                           if (u) { 
                             item.uom_id_text = u.name; 
                             item.uom_id_obj = u; 
                           } 
                        }">
                        <option v-for="opt in item._valid_uoms" :key="opt.id" :value="opt.id">
                          {{ opt.name }}
                        </option>
                      </select>
                      <select v-else class="form-select" disabled>
                        <option>Pilih Product</option>
                      </select>
                      <div class="invalid-feedback d-block" v-if="formatError(`UOM ${idx + 1}`, `items[${idx}].uom_id`)">
                         {{ formatError(`UOM ${idx + 1}`, `items[${idx}].uom_id`) }}
                      </div>
                    </td>

                    <!-- Loading indicator -->
                    <template v-if="item._loading">
                      <td colspan="5" class="text-muted text-center py-4">
                        <span class="spinner-border spinner-border-sm text-primary me-2" role="status"></span>
                        <span class="small">Loading details...</span>
                      </td>
                    </template>

                    <template v-else>
                      <td>
                        <ui-input2
                          v-model="item._hpp"
                          type="number"
                          :readonly="true"
                          placeholder="-"
                        />
                      </td>

                      <td>
                        <ui-input2 v-if="item._action === 'UPDATE'"
                          v-model="item._old_price"
                          type="number"
                          :readonly="true"
                          placeholder="-"
                        />
                        <span v-else class="text-muted text-center d-block">-</span>
                      </td>

                      <td>
                        <ui-input2
                          v-model="item.markup_pct"
                          type="number"
                          placeholder="%"
                          :error="formatError(`Markup ${idx + 1}`, `items[${idx}].markup_pct`)"
                        />
                      </td>

                      <td>
                        <ui-input2
                          v-model="item._suggested_price"
                          type="number"
                          :readonly="true"
                          placeholder="0"
                        />
                      </td>

                      <td>
                        <ui-input2
                          v-model="item.sell_price"
                          type="number"
                          iclass="input-harga-jual"
                          placeholder="Input Harga"
                          :error="formatError(`Harga Jual ${idx + 1}`, `items[${idx}].sell_price`)"
                          @update:model-value="() => { item._price_manually_edited = true }"
                        />
                      </td>
                    </template>

                    <td class="text-center">
                      <button v-if="items.length > 1" type="button" class="btn btn-sm btn-link text-danger p-1" @click="removeItem(idx)" title="Hapus Item">
                        <Icon name="i-tabler:trash" style="font-size: 1.25rem;" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
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

<style scoped>
.table-compact > :not(caption) > * > * {
  padding: 0.15rem 0.25rem !important;
}
</style>
