<script setup lang="ts">
const route = useRoute();
const { setFlash } = useFlash();

const id = computed(() => String(route.params.id));
const title = "Proposal Detail";
useHead({ title });

interface ProposalItem {
  id: string;
  seq_no: number;
  entity_id: string | null;
  payload_json: string;
  snapshot_json?: string | null;
}

interface Proposal {
  id: string;
  reference_number: string;
  entity_type: string;
  action_type: string;
  total_items: number;
  status: string;
  proposed_by_id: string;
  proposed_by_name?: string;
  reason: string | null;
  created_at: string;
  updated_at: string;
  items: ProposalItem[];
}

interface ProposalResponse {
  data: Proposal;
  message: string;
}

const { data: resp, error } = await useApiFetch<ProposalResponse>(`/master-data/${id.value}`);
if (error.value || !resp.value) {
  setFlash("Proposal tidak ditemukan", "error");
  navigateTo("/");
}

const proposal = ref<Proposal>(resp.value!.data);

const statusColor: Record<string, string> = {
  PENDING: "bg-warning-lt",
  APPROVED: "bg-success-lt",
  REJECTED: "bg-danger-lt",
  EXECUTED: "bg-secondary-lt",
};

const entityColor: Record<string, string> = {
  PRODUCT: "bg-blue text-white",
  SUPPLIER: "bg-teal text-white",
  CHART_OF_ACCOUNT: "bg-orange text-white",
  TAX: "bg-pink text-white",
  PRODUCT_PRICE: "bg-green text-white",
  PRODUCT_UOM_CONVERSION: "bg-indigo text-white",
  PRODUCT_SUPPLIER: "bg-purple text-white",
};

const actionColor: Record<string, string> = {
  CREATE: "bg-success text-white",
  UPDATE: "bg-primary text-white",
  DELETE: "bg-danger text-white",
};

const editPath = computed(() => {
  const map: Record<string, string> = {
    PRODUCT: `/usulan/product/edit/${id.value}`,
    SUPPLIER: `/usulan/supplier/edit/${id.value}`,
    CHART_OF_ACCOUNT: `/usulan/coa/edit/${id.value}`,
    TAX: `/usulan/tax/edit/${id.value}`,
    PRODUCT_PRICE: `/usulan/product-price/edit/${id.value}`,
    PRODUCT_UOM_CONVERSION: `/usulan/product-uom/edit/${id.value}`,
    PRODUCT_SUPPLIER: `/usulan/product-supplier/edit/${id.value}`,
  };
  return map[proposal.value.entity_type] || null;
});

const backPath = computed(() => {
  const map: Record<string, string> = {
    PRODUCT: "/usulan/product",
    SUPPLIER: "/usulan/supplier",
    CHART_OF_ACCOUNT: "/usulan/coa",
    TAX: "/usulan/tax",
    PRODUCT_PRICE: "/usulan/product-price",
    PRODUCT_UOM_CONVERSION: "/usulan/product-uom",
    PRODUCT_SUPPLIER: "/usulan/product-supplier",
  };
  return map[proposal.value.entity_type] || "/";
});

const parsedPayloads = computed(() => {
  return proposal.value.items.map((item) => {
    if (!item.payload_json) return null;
    if (typeof item.payload_json === 'object') return item.payload_json;
    try {
      return JSON.parse(item.payload_json);
    } catch {
      return item.payload_json;
    }
  });
});

const parsedSnapshots = computed(() => {
  return proposal.value.items.map((item) => {
    if (!item.snapshot_json) return null;
    if (typeof item.snapshot_json === 'object') return item.snapshot_json;
    try {
      return JSON.parse(item.snapshot_json);
    } catch {
      return item.snapshot_json;
    }
  });
});

interface FieldDef {
  key: string;
  label: string;
}

const entityFields: Record<string, FieldDef[]> = {
  PRODUCT: [
    { key: "sku", label: "SKU" },
    { key: "barcode", label: "Barcode" },
    { key: "name", label: "Name" },
    { key: "category_id_text", label: "Kategori" },
    { key: "base_uom_id_text", label: "Satuan Dasar" },
    { key: "length", label: "Panjang" },
    { key: "width", label: "Lebar" },
    { key: "height", label: "Tinggi" },
    { key: "weight", label: "Berat" },
    { key: "is_stackable", label: "Dapat Ditumpuk" },
    { key: "is_stockable", label: "Dapat Disimpan" },
    { key: "max_stack_layer", label: "Max Tumpukan" },
  ],
  SUPPLIER: [
    { key: "code", label: "Code" },
    { key: "name", label: "Name" },
    { key: "contact_person", label: "Contact Person" },
    { key: "contact_phone", label: "Contact Phone" },
    { key: "phone_number", label: "Phone Number" },
    { key: "email", label: "Email" },
    { key: "preferred_notification_method", label: "Notification Method" },
    { key: "tax_reg_number", label: "Tax Reg Number" },
    { key: "supplier_category_id_text", label: "Supplier Category" },
    { key: "ap_account_id_text", label: "AP Account" },
    { key: "payment_term_days", label: "Payment Term (days)" },
    { key: "payment_mode", label: "Payment Mode" },
    { key: "min_order_amount", label: "Min Order Amount" },
    { key: "bank_name", label: "Bank Name" },
    { key: "bank_account", label: "Bank Account" },
    { key: "bank_account_name", label: "Bank Account Name" },
    { key: "is_pkp", label: "Is PKP" },
    { key: "address", label: "Address" },
  ],
  CHART_OF_ACCOUNT: [
    { key: "account_code", label: "Account Code" },
    { key: "name", label: "Name" },
    { key: "account_type", label: "Account Type" },
    { key: "normal_balance", label: "Normal Balance" },
    { key: "parent_id", label: "Parent Account" },
  ],
  TAX: [
    { key: "name", label: "Name" },
    { key: "rate_percentage", label: "Rate (%)" },
    { key: "tax_account_id", label: "Tax Account" },
  ],
  PRODUCT_PRICE: [
    { key: "price_list_id", label: "Price List" },
    { key: "sell_price", label: "Sell Price" },
    { key: "discount_pct", label: "Discount %" },
  ],
  PRODUCT_UOM_CONVERSION: [
    { key: "product_id_text", label: "Product" },
    { key: "conversion_rate", label: "Conversion Rate" },
    { key: "barcode", label: "Barcode" },
    { key: "length", label: "Length" },
    { key: "width", label: "Width" },
    { key: "height", label: "Height" },
    { key: "weight", label: "Weight" },
    { key: "is_stackable", label: "Is Stackable" },
    { key: "max_stack_layer", label: "Max Stack Layer" },
  ],
  PRODUCT_SUPPLIER: [
    { key: "supplier_sku", label: "Supplier SKU" },
    { key: "default_lead_time_days", label: "Lead Time (days)" },
    { key: "offered_price", label: "Offered Price" },
    { key: "min_order_qty", label: "Min Order Qty" },
    { key: "is_primary", label: "Is Primary" },
    { key: "is_consignment", label: "Is Consignment" },
    { key: "is_returnable", label: "Is Returnable" },
  ],
};

const shouldDisplayField = (key: string) => {
  const systemFields = ["id", "created_at", "updated_at", "deleted_at"];
  if (systemFields.includes(key)) return false;
  if (key.endsWith("_id")) return false;
  return true;
};

const formatFieldLabel = (key: string) => {
  let cleanKey = key;
  if (key.endsWith("_id_text")) {
    cleanKey = key.slice(0, -8);
  } else if (key.endsWith("_text")) {
    cleanKey = key.slice(0, -5);
  }
  return cleanKey
    .split("_")
    .map((word) => {
      if (word.toLowerCase() === "uom") return "UOM";
      if (word.toLowerCase() === "ap") return "AP";
      if (word.toLowerCase() === "coa") return "COA";
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
};

const getChangedFields = (payload: any, snapshot: any, entityType: string) => {
  if (!payload || typeof payload !== "object") return [];

  const defs = entityFields[entityType];

  if (defs && defs.length > 0) {
    return defs.map((def) => {
      const oldValue = snapshot && typeof snapshot === "object" ? snapshot[def.key] : null;
      const newValue = payload[def.key];
      const hasSnapshot = snapshot && typeof snapshot === "object";
      
      let changed = false;
      if (hasSnapshot) {
        // Compare values smartly (e.g. "0.00" vs 0)
        if (oldValue !== newValue) {
          if (oldValue == newValue) {
            // Loose equality matches (e.g. "0" == 0), so it's not actually changed
            changed = false;
          } else if (!isNaN(Number(oldValue)) && !isNaN(Number(newValue)) && Number(oldValue) === Number(newValue)) {
            // Both are numbers and have the same value (e.g. "0.00" == 0)
            changed = false;
          } else {
            changed = JSON.stringify(oldValue) !== JSON.stringify(newValue);
          }
        }
      } else {
        changed = true;
      }

      return {
        key: def.key,
        label: def.label,
        oldValue,
        newValue,
        changed,
      };
    });
  }

  if (!snapshot || typeof snapshot !== "object") {
    // Jika tidak ada snapshot, maka semua field di payload adalah data baru
    return Object.entries(payload)
      .filter(([key]) => shouldDisplayField(key))
      .map(([key, val]) => ({
        key,
        label: formatFieldLabel(key),
        oldValue: null,
        newValue: val,
        changed: true,
      }));
  }

  // Gabungkan semua key dari payload dan snapshot
  const allKeys = Array.from(new Set([...Object.keys(payload), ...Object.keys(snapshot)]))
    .filter(shouldDisplayField);

  return allKeys.map((key) => {
    const oldValue = snapshot[key];
    const newValue = payload[key];
    const changed = JSON.stringify(oldValue) !== JSON.stringify(newValue);

    return {
      key,
      label: formatFieldLabel(key),
      oldValue,
      newValue,
      changed,
    };
  });
};

const getPayloadFields = (payload: any, entityType: string) => {
  if (!payload || typeof payload !== "object") return [];

  const defs = entityFields[entityType];

  if (defs && defs.length > 0) {
    return defs.map((def) => {
      return {
        key: def.key,
        label: def.label,
        value: payload[def.key],
      };
    });
  }

  return Object.entries(payload)
    .filter(([key]) => shouldDisplayField(key))
    .map(([key, val]) => ({
      key,
      label: formatFieldLabel(key),
      value: val,
    }));
};

const showAllFields = ref(false);

// Review
const reviewModalEl = ref<HTMLElement | null>(null);
const reviewModal = ref<any>(null);
const reviewAction = ref<"APPROVED" | "REJECTED">("APPROVED");
const reviewNotes = ref("");
const reviewLoading = ref(false);

const openReview = (action: "APPROVED" | "REJECTED") => {
  reviewAction.value = action;
  reviewNotes.value = "";
  if (import.meta.client) {
    const bootstrap = (window as any).bootstrap;
    if (bootstrap && reviewModalEl.value && !reviewModal.value) {
      reviewModal.value = new bootstrap.Modal(reviewModalEl.value);
    }
  }
  reviewModal.value?.show();
};

const { success: reviewSuccess, submitForm: reviewForm } = useForm2();

const submitReview = async () => {
  reviewLoading.value = true;
  const body: Record<string, any> = {
    action: reviewAction.value === "APPROVED" ? "APPROVE" : "REJECT",
  };
  if (reviewAction.value === "REJECTED") body.review_notes = reviewNotes.value;

  const response = await reviewForm(`/master-data/${id.value}/review`, {
    method: "POST",
    body,
  });
  reviewLoading.value = false;

  if (reviewSuccess.value) {
    reviewModal.value?.hide();
    if (response?.data?.data) {
      proposal.value = response.data.data;
    } else if (response?.data) {
      proposal.value = response.data;
    } else {
      proposal.value.status = reviewAction.value;
    }
  }
};

// Execute
const { success: execSuccess, submitForm: execForm } = useForm2();
const execLoading = ref(false);

const executeProposal = async () => {
  execLoading.value = true;
  await execForm(`/master-data/${id.value}/execute`, {
    method: "POST",
    body: {},
  });
  execLoading.value = false;
  if (execSuccess.value) {
    proposal.value.status = "EXECUTED";
  }
};
</script>

<template>
  <div>
    <PageHeader :title="`Proposal: ${proposal.reference_number}`" icon="i-tabler:file-check">
      <ui-button-back :to="backPath" />
    </PageHeader>
    <PageBody>
      <div class="row justify-content-center">
        <div class="col-xl-8 col-md-8 col-sm-12">
          <!-- Header Info Card -->
          <div :class="['card rounded-1 mb-3 shadow-sm border-0 border-start border-4', 
            proposal.status === 'PENDING' ? 'border-warning' : 
            proposal.status === 'APPROVED' ? 'border-success' : 
            proposal.status === 'REJECTED' ? 'border-danger' : 'border-secondary']">
            <div class="card-body p-4">
              <div class="d-flex align-items-center justify-content-between mb-4">
                <div>
                  <span class="text-muted small uppercase fw-bold tracking-wider">Proposal Master Data</span>
                  <h2 class="mb-0 mt-1 fw-bold">{{ proposal.reference_number }}</h2>
                </div>
                <div class="d-flex gap-2">
                  <span :class="['badge px-3 py-2 fs-5 font-weight-medium rounded-pill shadow-sm', statusColor[proposal.status] || 'bg-secondary']">
                    {{ proposal.status }}
                  </span>
                </div>
              </div>
              
              <div class="row g-4">
                <!-- Row 1: Entity Type, Action, Total Items -->
                <div class="col-lg-4 col-md-6 col-sm-12">
                  <div class="d-flex align-items-center">
                    <div class="bg-blue-lt p-3 rounded-3 me-3 d-flex align-items-center justify-content-center">
                      <Icon name="i-tabler:database" class="text-blue fs-3" />
                    </div>
                    <div>
                      <div class="text-muted small">Entity Type</div>
                      <span :class="['badge font-weight-medium px-2 py-1 mt-1 text-wrap', entityColor[proposal.entity_type] || 'bg-secondary']">
                        {{ proposal.entity_type }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="col-lg-4 col-md-6 col-sm-12">
                  <div class="d-flex align-items-center">
                    <div class="bg-purple-lt p-3 rounded-3 me-3 d-flex align-items-center justify-content-center">
                      <Icon name="i-tabler:activity" class="text-purple fs-3" />
                    </div>
                    <div>
                      <div class="text-muted small">Action Type</div>
                      <span :class="['badge font-weight-medium px-2 py-1 mt-1', actionColor[proposal.action_type] || 'bg-secondary']">
                        {{ proposal.action_type }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="col-lg-4 col-md-6 col-sm-12">
                  <div class="d-flex align-items-center">
                    <div class="bg-teal-lt p-3 rounded-3 me-3 d-flex align-items-center justify-content-center">
                      <Icon name="i-tabler:list-details" class="text-teal fs-3" />
                    </div>
                    <div>
                      <div class="text-muted small">Total Items</div>
                      <div class="fs-4 fw-bold mt-1">{{ proposal.total_items }}</div>
                    </div>
                  </div>
                </div>

                <!-- Row 2: Proposed At, Proposed By, Reason -->
                <div class="col-lg-4 col-md-6 col-sm-12">
                  <div class="d-flex align-items-center">
                    <div class="bg-pink-lt p-3 rounded-3 me-3 d-flex align-items-center justify-content-center">
                      <Icon name="i-tabler:calendar" class="text-pink fs-3" />
                    </div>
                    <div>
                      <div class="text-muted small">Proposed At</div>
                      <div class="fw-medium mt-1" style="font-size: 0.9rem;">{{ formatDate(proposal.created_at) }}</div>
                    </div>
                  </div>
                </div>

                <div class="col-lg-4 col-md-6 col-sm-12">
                  <div class="d-flex align-items-center">
                    <div class="bg-indigo-lt p-3 rounded-3 me-3 d-flex align-items-center justify-content-center">
                      <Icon name="i-tabler:user" class="text-indigo fs-3" />
                    </div>
                    <div>
                      <div class="text-muted small">Proposed By</div>
                      <div class="fw-medium mt-1">{{ proposal.proposed_by_name || proposal.proposed_by_id }}</div>
                    </div>
                  </div>
                </div>

                <div class="col-lg-4 col-md-6 col-sm-12">
                  <div class="d-flex align-items-center">
                    <div class="bg-orange-lt p-3 rounded-3 me-3 d-flex align-items-center justify-content-center">
                      <Icon name="i-tabler:note" class="text-orange fs-3" />
                    </div>
                    <div>
                      <div class="text-muted small">Reason for Proposal</div>
                      <div class="fw-medium mt-1">{{ proposal.reason || '-' }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Items -->
          <div v-for="(item, idx) in proposal.items" :key="item.id" class="card rounded-1 mb-3 shadow-sm border-0">
            <div class="card-header d-flex justify-content-between align-items-center bg-transparent border-bottom">
              <h3 class="card-title text-muted mb-0">
                Item #{{ item.seq_no }} 
                <span v-if="item.entity_id" class="ms-2 badge bg-secondary-lt fs-5 font-monospace">
                  ID: {{ item.entity_id }}
                </span>
              </h3>
              <button 
                v-if="proposal.action_type === 'UPDATE'"
                type="button" 
                class="btn btn-sm btn-outline-secondary rounded-1"
                @click="showAllFields = !showAllFields"
              >
                <Icon :name="showAllFields ? 'i-tabler:eye-off' : 'i-tabler:eye'" class="me-1 icon icon-2" />
                {{ showAllFields ? 'Tampilkan Perubahan Saja' : 'Tampilkan Semua Field' }}
              </button>
            </div>
            
            <div class="card-body p-0">
              <!-- Diff Viewer untuk UPDATE -->
              <div v-if="proposal.action_type === 'UPDATE'" class="table-responsive">
                <table class="table table-vcenter card-table mb-0">
                  <thead>
                    <tr>
                      <th style="width: 25%">Field</th>
                      <th style="width: 37%">Original Value</th>
                      <th style="width: 38%">Proposed Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-for="field in getChangedFields(parsedPayloads[idx], parsedSnapshots[idx], proposal.entity_type)" :key="field.key">
                      <tr v-if="showAllFields || field.changed" :class="[field.changed ? 'bg-yellow-lt font-weight-medium' : 'text-muted']">
                        <td>
                          {{ field.label }}
                          <span v-if="field.changed" class="badge bg-warning-lt text-warning ms-2 font-weight-medium">Changed</span>
                        </td>
                        <td>
                          <span v-if="field.oldValue !== null && field.oldValue !== undefined">
                            <span class="text-decoration-line-through text-danger me-2">{{ String(field.oldValue) }}</span>
                          </span>
                          <span v-else class="text-muted small italic">-</span>
                        </td>
                        <td>
                          <span :class="[field.changed ? 'text-success fw-bold' : '']">
                            {{ field.newValue !== null && field.newValue !== undefined ? String(field.newValue) : '-' }}
                          </span>
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </div>

              <!-- Structured view untuk CREATE / DELETE / OTHER -->
              <div v-else class="table-responsive">
                <table class="table table-vcenter card-table mb-0">
                  <thead>
                    <tr>
                      <th style="width: 30%">Field</th>
                      <th style="width: 70%">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-if="typeof (proposal.action_type === 'DELETE' ? parsedSnapshots[idx] : parsedPayloads[idx]) === 'object'">
                      <tr v-for="field in getPayloadFields((proposal.action_type === 'DELETE' ? parsedSnapshots[idx] : parsedPayloads[idx]), proposal.entity_type)" :key="field.key">
                        <td class="text-muted">{{ field.label }}</td>
                        <td class="font-weight-medium">
                          <span :class="proposal.action_type === 'DELETE' ? 'text-decoration-line-through text-danger' : 'text-success'">
                            {{ field.value !== null && field.value !== undefined ? String(field.value) : '-' }}
                          </span>
                        </td>
                      </tr>
                    </template>
                    <tr v-else>
                      <td class="text-muted">Data Raw</td>
                      <td><code>{{ proposal.action_type === 'DELETE' ? item.snapshot_json : item.payload_json }}</code></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="d-flex gap-2 justify-content-end mt-4 mb-5">
            <div v-if="proposal.status === 'PENDING'" class="d-flex gap-2">
              <NuxtLink
                v-if="editPath"
                :to="editPath"
                class="btn btn-warning rounded-1 text-dark"
              >
                <Icon name="i-tabler:pencil" class="icon icon-2 me-1" />
                Edit Usulan
              </NuxtLink>
              <button
                type="button"
                class="btn btn-success rounded-1 px-3"
                @click="openReview('APPROVED')"
              >
                <Icon name="i-tabler:check" class="icon icon-2 me-1" />
                Approve
              </button>
              <button
                type="button"
                class="btn btn-danger rounded-1 px-3"
                @click="openReview('REJECTED')"
              >
                <Icon name="i-tabler:x" class="icon icon-2 me-1" />
                Reject
              </button>
            </div>

            <div v-if="proposal.status === 'APPROVED'" class="d-flex gap-2">
              <button
                type="button"
                class="btn btn-primary rounded-1 px-4"
                :disabled="execLoading"
                @click="executeProposal"
              >
                <span v-if="execLoading" class="spinner-border spinner-border-sm me-1" role="status"></span>
                <Icon v-else name="i-tabler:player-play" class="icon icon-2 me-1" />
                Eksekusi Proposal
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageBody>

    <!-- Review Modal -->
    <div ref="reviewModalEl" class="modal fade" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content rounded-1 border-0 shadow-lg">
          <div class="modal-header">
            <h5 class="modal-title d-flex align-items-center fw-bold">
              <Icon
                :name="reviewAction === 'APPROVED' ? 'i-tabler:check' : 'i-tabler:x'"
                :class="['icon me-2 icon-2', reviewAction === 'APPROVED' ? 'text-success' : 'text-danger']"
              />
              {{ reviewAction === 'APPROVED' ? 'Approve Proposal' : 'Reject Proposal' }}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body p-4">
            <div v-if="reviewAction === 'REJECTED'" class="mb-0">
              <label class="form-label fw-bold mb-2">Alasan Penolakan <span class="text-danger">*</span></label>
              <textarea
                v-model="reviewNotes"
                class="form-control rounded-1"
                rows="3"
                placeholder="Tuliskan secara singkat alasan penolakan usulan..."
              ></textarea>
            </div>
            <div v-else class="alert alert-success bg-success-lt border-0 mb-0 d-flex align-items-start">
              <Icon name="i-tabler:info-circle" class="text-success me-2 fs-3 mt-1" />
              <div>
                <div class="fw-bold text-success">Konfirmasi Persetujuan</div>
                <div class="text-muted small mt-1">Apakah Anda yakin ingin menyetujui proposal master data ini? Tindakan ini akan mengubah status proposal menjadi APPROVED dan siap dieksekusi.</div>
              </div>
            </div>
          </div>
          <div class="modal-footer bg-body-secondary border-0">
            <button type="button" class="btn btn-outline-secondary rounded-1" data-bs-dismiss="modal">
              Batal
            </button>
            <button
              type="button"
              :class="['btn rounded-1 px-3', reviewAction === 'APPROVED' ? 'btn-success' : 'btn-danger']"
              :disabled="reviewLoading || (reviewAction === 'REJECTED' && !reviewNotes.trim())"
              @click="submitReview"
            >
              <span v-if="reviewLoading" class="spinner-border spinner-border-sm me-1" role="status"></span>
              {{ reviewAction === 'APPROVED' ? 'Setujui' : 'Tolak' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
