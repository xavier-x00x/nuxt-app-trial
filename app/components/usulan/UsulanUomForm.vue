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
  title: "Usulan Satuan (UOM) Baru",
  icon: "i-tabler:scale",
  basePath: "/usulan/uom",
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
    key: "code",
    label: "Code",
    type: "text",
    required: true,
    col: "col-md-4",
  },
  {
    key: "name",
    label: "Name",
    type: "text",
    required: true,
    col: "col-md-4",
  },
  {
    key: "symbol",
    label: "Symbol (Opsional)",
    type: "text",
    required: false,
    col: "col-md-4",
  },
];
const fieldsKeys = ["code", "name", "symbol"];

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
  return `${obj.code || ''} - ${obj.name || obj.id || ''}`;
};

const resolveEntityText = async (item: Record<string, any>) => {
  if (!item.entity_id) return;
  try {
    const { data } = await useApi<any>(`/catalog/uoms/${item.entity_id}`);
    if (data?.data) {
      item.entity_text = formatEntityText("UOM", data.data);
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
        item.entity_text = formatEntityText("UOM", item._selected_obj);
        item._last_selected_id = item._selected_obj.id;

        if (proposalType.value === "UPDATE" || proposalType.value === "DELETE") {
          const src = item._selected_obj;
          fieldsKeys.forEach((k) => {
            if (item[k] === undefined || item[k] === "") {
              item[k] = src[k] !== undefined ? src[k] : "";
            }
          });
        }
      }
    });
  },
  { deep: true }
);

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

  items.value.forEach((item: any) => {
    if (proposal.action_type === "UPDATE") {
      if (item.entity_id && !item._selected_obj) {
        useApi<any>(`/catalog/uoms/${item.entity_id}`).then(({ data }) => {
          if (data?.data) {
            item._selected_obj = data.data;
            item.entity_text = formatEntityText("UOM", data.data);
          }
        });
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

const form = ref<HTMLFormElement>();
const { loading, success, errors, formatError, submitForm } = useForm2();

const onSubmit = async () => {
  const dataPayload: Record<string, any> = {
    entity_type: "UOM",
    action_type: proposalType.value,
    reason: reason.value || undefined,
    items: items.value.map((item: any) => {
      let payload: any;
      if (proposalType.value === "CREATE" || proposalType.value === "UPDATE") {
        payload = {
          code: item.code?.trim() || "",
          name: item.name?.trim() || "",
          symbol: item.symbol?.trim() || null,
        };
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
      <ui-button-save :loading="loading" :form="form" @save="form?.requestSubmit()" />
    </PageHeader>
    <PageBody>
      <form ref="form" autocomplete="off" novalidate @submit.prevent="onSubmit">
        <div class="row justify-content-center">
          <div class="col-xl-10 col-md-11 col-sm-12">
            <!-- Header Card -->
            <div class="card mb-3">
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label required">Tipe Aksi Usulan</label>
                    <select
                      v-model="proposalType"
                      class="form-select"
                      :disabled="isEdit"
                    >
                      <option
                        v-for="opt in actionTypes"
                        :key="opt.value"
                        :value="opt.value"
                      >
                        {{ opt.label }}
                      </option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <ui-input2
                      v-model="reason"
                      label="Alasan Pengajuan"
                      type="text"
                      placeholder="Masukkan alasan pengajuan proposal ini"
                      :error="formatError('Alasan', 'reason')"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Items Section -->
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h4 class="mb-0">Daftar Usulan Satuan / UOM ({{ items.length }})</h4>
              <button
                type="button"
                class="btn btn-outline-primary btn-sm rounded-1"
                @click="addItem"
              >
                <Icon name="i-tabler:plus" class="icon me-1" />
                Tambah UOM
              </button>
            </div>

            <div
              v-for="(item, idx) in items"
              :key="idx"
              class="card mb-3"
            >
              <div class="card-header d-flex justify-content-between align-items-center py-2">
                <span class="card-title mb-0 fs-5 fw-bold">
                  UOM #{{ idx + 1 }}
                </span>
                <button
                  v-if="items.length > 1"
                  type="button"
                  class="btn btn-outline-danger btn-sm py-1 px-2 rounded-1"
                  @click="removeItem(idx)"
                >
                  <Icon name="i-tabler:trash" class="icon" />
                </button>
              </div>
              <div class="card-body">
                <!-- Select Existing for UPDATE / DELETE -->
                <div
                  v-if="proposalType === 'UPDATE' || proposalType === 'DELETE'"
                  class="row mb-3"
                >
                  <div class="col-12">
                    <ui-SelectSearch4
                      v-model="item.entity_id"
                      v-model:selected-data="item._selected_obj"
                      :xname="`items.${idx}.entity_id`"
                      api-url="/catalog/uoms/pagination"
                      value-key="id"
                      label="Pilih Satuan (UOM) yang Akan Diubah/Dihapus"
                      :error="formatError(`UOM #${idx + 1}`, `items.${idx}.entity_id`)"
                      placeholder="Ketik untuk mencari UOM..."
                    />
                  </div>
                </div>

                <!-- Form Fields for CREATE / UPDATE -->
                <div v-if="proposalType !== 'DELETE'" class="row g-3">
                  <div class="col-md-4">
                    <ui-input2
                      v-model="item.code"
                      label="Code *"
                      type="text"
                      placeholder="Contoh: PCS, DUS, KG"
                      :error="formatError('Code', `items.${idx}.payload_json.code`)"
                    />
                  </div>
                  <div class="col-md-4">
                    <ui-input2
                      v-model="item.name"
                      label="Name *"
                      type="text"
                      placeholder="Contoh: Pieces, Karton, Kilogram"
                      :error="formatError('Name', `items.${idx}.payload_json.name`)"
                    />
                  </div>
                  <div class="col-md-4">
                    <ui-input2
                      v-model="item.symbol"
                      label="Symbol"
                      type="text"
                      placeholder="Contoh: pcs, kg, ltr"
                      :error="formatError('Symbol', `items.${idx}.payload_json.symbol`)"
                    />
                  </div>
                </div>

                <!-- Delete Preview Info -->
                <div v-else-if="item._selected_obj" class="alert alert-danger mb-0">
                  <Icon name="i-tabler:alert-triangle" class="icon me-2" />
                  Satuan <strong>{{ item._selected_obj.name }}</strong> ({{ item._selected_obj.code }}) akan dihapus dari sistem.
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </PageBody>
  </div>
</template>
