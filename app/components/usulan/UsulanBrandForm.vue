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
  title: "Usulan Brand Baru",
  icon: "i-tabler:tags",
  basePath: "/usulan/brand",
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
    label: "Brand Name",
    type: "text",
    required: true,
    col: "col-md-6",
  },
  {
    key: "logo_url",
    label: "Logo URL",
    type: "text",
    required: false,
    col: "col-md-6",
  },
  {
    key: "description",
    label: "Description",
    type: "textarea",
    required: false,
    col: "col-md-12",
  },
  {
    key: "is_active",
    label: "Active",
    type: "checkbox",
    required: false,
    col: "col-md-12",
  },
];
const fieldsKeys = ["name", "logo_url", "description", "is_active"];

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
  return obj.name || obj.id || "";
};

const resolveEntityText = async (item: Record<string, any>) => {
  if (!item.entity_id) return;
  try {
    const { data } = await useApi<any>(`/catalog/brands/${item.entity_id}`);
    if (data?.data) {
      item.entity_text = formatEntityText("BRAND", data.data);
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
        item.entity_text = formatEntityText("BRAND", item._selected_obj);
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
        useApi<any>(`/catalog/brands/${item.entity_id}`).then(({ data }) => {
          if (data?.data) {
            item._selected_obj = data.data;
            item.entity_text = formatEntityText("BRAND", data.data);
          }
        });
      }
    } else if (proposal.action_type === "DELETE") {
      if (item.entity_id && !item._selected_obj) resolveEntityText(item);
    }
  });
}

const addItem = () => {
  items.value.push({ is_active: true });
};

const removeItem = (idx: number) => {
  items.value.splice(idx, 1);
};

const form = ref<HTMLFormElement>();
const { loading, success, errors, formatError, submitForm } = useForm2();

const onSubmit = async () => {
  const dataPayload: Record<string, any> = {
    entity_type: "BRAND",
    action_type: proposalType.value,
    reason: reason.value || undefined,
    items: items.value.map((item: any) => {
      let payload: any;
      if (proposalType.value === "CREATE" || proposalType.value === "UPDATE") {
        payload = {
          name: item.name?.trim() || "",
          description: item.description?.trim() || null,
          logo_url: item.logo_url?.trim() || null,
          is_active: item.is_active ?? true,
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
              <h4 class="mb-0">Daftar Usulan Brand ({{ items.length }})</h4>
              <button
                type="button"
                class="btn btn-outline-primary btn-sm rounded-1"
                @click="addItem"
              >
                <Icon name="i-tabler:plus" class="icon me-1" />
                Tambah Brand
              </button>
            </div>

            <div
              v-for="(item, idx) in items"
              :key="idx"
              class="card mb-3"
            >
              <div class="card-header d-flex justify-content-between align-items-center py-2">
                <span class="card-title mb-0 fs-5 fw-bold">
                  Brand #{{ idx + 1 }}
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
                      api-url="/catalog/brands/pagination"
                      value-key="id"
                      label="Pilih Brand yang Akan Diubah/Dihapus"
                      :error="formatError(`Brand #${idx + 1}`, `items.${idx}.entity_id`)"
                      placeholder="Ketik untuk mencari brand..."
                    />
                  </div>
                </div>

                <!-- Form Fields for CREATE / UPDATE -->
                <div v-if="proposalType !== 'DELETE'" class="row g-3">
                  <div
                    v-for="field in entityFields"
                    :key="field.key"
                    :class="field.col"
                  >
                    <template v-if="field.type === 'textarea'">
                      <ui-textarea
                        v-model="item[field.key]"
                        :label="field.label"
                        :placeholder="`Input ${field.label.toLowerCase()}`"
                        :error="formatError(field.label, `items.${idx}.payload_json.${field.key}`)"
                      />
                    </template>
                    <template v-else-if="field.type === 'checkbox'">
                      <label class="form-check form-switch mt-2">
                        <input
                          v-model="item[field.key]"
                          class="form-check-input"
                          type="checkbox"
                        />
                        <span class="form-check-label">{{ item[field.key] ? 'Active' : 'Inactive' }}</span>
                      </label>
                    </template>
                    <template v-else>
                      <ui-input2
                        v-model="item[field.key]"
                        :label="field.label"
                        :type="field.type"
                        :placeholder="`Input ${field.label.toLowerCase()}`"
                        :error="formatError(field.label, `items.${idx}.payload_json.${field.key}`)"
                      />
                    </template>
                  </div>
                </div>

                <!-- Delete Preview Info -->
                <div v-else-if="item._selected_obj" class="alert alert-danger mb-0">
                  <Icon name="i-tabler:alert-triangle" class="icon me-2" />
                  Brand <strong>{{ item._selected_obj.name }}</strong> akan dinonaktifkan / dihapus dari sistem.
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </PageBody>
  </div>
</template>
