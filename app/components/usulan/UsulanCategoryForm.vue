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
  title: "Usulan Kategori Baru",
  icon: "i-tabler:category",
  basePath: "/usulan/category",
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
    key: "name",
    label: "Category Name",
    type: "text",
    required: true,
    col: "col-md-6",
  },
  {
    key: "code",
    label: "Code (3 huruf)",
    type: "text",
    required: true,
    col: "col-md-6",
  },
  {
    key: "slug",
    label: "Slug",
    type: "text",
    required: false,
    col: "col-md-6",
  },
  {
    key: "sequence",
    label: "Sequence",
    type: "number",
    required: false,
    col: "col-md-6",
  },
  {
    key: "parent_id",
    label: "Parent Category",
    type: "selectx",
    apiUrl: "/catalog/categories/pagination",
    required: false,
    col: "col-md-6",
  },
  {
    key: "default_markup_pct",
    label: "Default Markup %",
    type: "number",
    required: false,
    col: "col-md-6",
  },
];
const fieldsKeys = ["name", "code", "slug", "sequence", "parent_id", "default_markup_pct"];

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

const resolveEntityText = async (item: Record<string, any>) => {
  if (!item.entity_id) return;
  try {
    const { data } = await useApi<any>(`/catalog/categories/${item.entity_id}`);
    if (data?.data) {
      item.entity_text = formatEntityText("CATEGORY", data.data);
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
        item.entity_text = formatEntityText("CATEGORY", item._selected_obj);
        item._last_selected_id = item._selected_obj.id;

        if (proposalType.value === "UPDATE" || proposalType.value === "DELETE") {
          const src = item._selected_obj;
          fieldsKeys.forEach((k) => {
            if (item[k] === undefined || item[k] === "") {
              item[k] = src[k] !== undefined ? src[k] : "";
            }
          });
          if (src.parent) item.parent_id_text = src.parent.name;
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
    if (item.parent_id && !item.parent_id_text) {
      resolveRelationText(item, 'parent_id', '/catalog/categories/pagination');
    }

    if (proposal.action_type === "UPDATE") {
      if (item.entity_id && !item._selected_obj) {
        useApi<any>(`/catalog/categories/${item.entity_id}`).then(({ data }) => {
          if (data?.data) {
            item._selected_obj = data.data;
            item.entity_text = formatEntityText("CATEGORY", data.data);
          }
        });
      }
    } else if (proposal.action_type === "DELETE") {
      if (item.entity_id && !item._selected_obj) resolveEntityText(item);
    }
  });
}

const addItem = () => {
  items.value.push({ sequence: 0, default_markup_pct: 0 });
};

const removeItem = (idx: number) => {
  items.value.splice(idx, 1);
};

const form = ref<HTMLFormElement>();
const { loading, success, errors, formatError, submitForm } = useForm2();

const onSubmit = async () => {
  const dataPayload: Record<string, any> = {
    entity_type: "CATEGORY",
    action_type: proposalType.value,
    reason: reason.value || undefined,
    items: items.value.map((item: any) => {
      let payload: any;
      if (proposalType.value === "CREATE" || proposalType.value === "UPDATE") {
        const slug = item.slug ? item.slug.toLowerCase().trim() : (item.name ? item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : "");
        payload = {
          name: item.name?.trim() || "",
          code: (item.code || "").toUpperCase().trim(),
          slug: slug,
          sequence: Number(item.sequence) || 0,
          parent_id: item.parent_id || null,
          default_markup_pct: Number(item.default_markup_pct) || 0,
        };
        if (item.parent_id_text) payload.parent_id_text = item.parent_id_text;
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
              <h4 class="mb-0">Daftar Usulan Kategori ({{ items.length }})</h4>
              <button
                type="button"
                class="btn btn-outline-primary btn-sm rounded-1"
                @click="addItem"
              >
                <Icon name="i-tabler:plus" class="icon me-1" />
                Tambah Kategori
              </button>
            </div>

            <div
              v-for="(item, idx) in items"
              :key="idx"
              class="card mb-3"
            >
              <div class="card-header d-flex justify-content-between align-items-center py-2">
                <span class="card-title mb-0 fs-5 fw-bold">
                  Kategori #{{ idx + 1 }}
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
                      api-url="/catalog/categories/pagination"
                      value-key="id"
                      label="Pilih Kategori yang Akan Diubah/Dihapus"
                      :error="formatError(`Kategori #${idx + 1}`, `items.${idx}.entity_id`)"
                      placeholder="Ketik untuk mencari kategori..."
                    />
                  </div>
                </div>

                <!-- Form Fields for CREATE / UPDATE -->
                <div v-if="proposalType !== 'DELETE'" class="row g-3">
                  <div class="col-md-6">
                    <ui-input2
                      v-model="item.name"
                      label="Category Name *"
                      type="text"
                      placeholder="Input nama kategori"
                      :error="formatError('Nama Kategori', `items.${idx}.payload_json.name`)"
                    />
                  </div>
                  <div class="col-md-6">
                    <ui-input2
                      v-model="item.code"
                      label="Code *"
                      type="text"
                      placeholder="Input 3-letter code"
                      :error="formatError('Code', `items.${idx}.payload_json.code`)"
                    />
                  </div>
                  <div class="col-md-6">
                    <ui-input2
                      v-model="item.slug"
                      label="Slug"
                      type="text"
                      placeholder="Input slug"
                      :error="formatError('Slug', `items.${idx}.payload_json.slug`)"
                    />
                  </div>
                  <div class="col-md-6">
                    <ui-input2
                      v-model="item.sequence"
                      label="Sequence"
                      type="number"
                      placeholder="0"
                      :error="formatError('Sequence', `items.${idx}.payload_json.sequence`)"
                    />
                  </div>
                  <div class="col-md-6">
                    <ui-SelectSearch4
                      v-model="item.parent_id"
                      :xname="`items.${idx}.parent_id`"
                      api-url="/catalog/categories/pagination"
                      value-key="id"
                      label="Parent Category"
                      :initial-text="item.parent_id_text"
                      :error="formatError('Parent', `items.${idx}.payload_json.parent_id`)"
                      placeholder="Pilih parent category (opsional)..."
                    />
                  </div>
                  <div class="col-md-6">
                    <ui-input2
                      v-model="item.default_markup_pct"
                      label="Default Markup %"
                      type="number"
                      placeholder="0.00"
                      :error="formatError('Default Markup', `items.${idx}.payload_json.default_markup_pct`)"
                      :decimal="2"
                    />
                  </div>
                </div>

                <!-- Delete Preview Info -->
                <div v-else-if="item._selected_obj" class="alert alert-danger mb-0">
                  <Icon name="i-tabler:alert-triangle" class="icon me-2" />
                  Kategori <strong>{{ item._selected_obj.name }}</strong> akan dihapus dari sistem.
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </PageBody>
  </div>
</template>
