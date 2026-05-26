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
  navigateTo("/master-data");
}

const proposal = ref<Proposal>(resp.value!.data);

const statusColor: Record<string, string> = {
  PENDING: "bg-warning text-dark",
  APPROVED: "bg-success text-white",
  REJECTED: "bg-danger text-white",
  EXECUTED: "bg-secondary text-white",
};

const entityColor: Record<string, string> = {
  PRODUCT: "bg-blue text-white",
  SUPPLIER: "bg-teal text-white",
  CHART_OF_ACCOUNT: "bg-orange text-white",
  TAX: "bg-pink text-white",
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
  return map[proposal.entity_type] || null;
});

const parsedPayloads = computed(() => {
  return proposal.value.items.map((item) => {
    try {
      return JSON.parse(item.payload_json);
    } catch {
      return item.payload_json;
    }
  });
});

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
  const body: Record<string, any> = { status: reviewAction.value };
  if (reviewAction.value === "REJECTED") body.notes = reviewNotes.value;

  await reviewForm(`/master-data/${id.value}/review`, {
    method: "POST",
    body,
  });
  reviewLoading.value = false;

  if (reviewSuccess.value) {
    reviewModal.value?.hide();
    proposal.value.status = reviewAction.value;
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
      <ui-button-back to="/master-data" />
    </PageHeader>
    <PageBody>
      <div class="row justify-content-center">
        <div class="col-xl-8 col-md-8 col-sm-12">
          <!-- Header Info Card -->
          <div class="card rounded-1 mb-3">
            <div class="card-body">
              <div class="row g-3">
                <div class="col-md-6">
                  <table class="table table-borderless table-sm mb-0">
                    <tbody>
                      <tr>
                        <td class="fw-bold text-muted" style="width: 140px;">Reference No</td>
                        <td>{{ proposal.reference_number }}</td>
                      </tr>
                      <tr>
                        <td class="fw-bold text-muted">Entity Type</td>
                        <td>
                          <span :class="['badge', entityColor[proposal.entity_type] || 'bg-secondary']">
                            {{ proposal.entity_type }}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td class="fw-bold text-muted">Action</td>
                        <td>
                          <span :class="['badge', actionColor[proposal.action_type] || 'bg-secondary']">
                            {{ proposal.action_type }}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td class="fw-bold text-muted">Total Items</td>
                        <td>{{ proposal.total_items }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div class="col-md-6">
                  <table class="table table-borderless table-sm mb-0">
                    <tbody>
                      <tr>
                        <td class="fw-bold text-muted" style="width: 140px;">Status</td>
                        <td>
                          <span :class="['badge', statusColor[proposal.status] || 'bg-secondary']">
                            {{ proposal.status }}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td class="fw-bold text-muted">Proposed By</td>
                        <td>{{ proposal.proposed_by_id }}</td>
                      </tr>
                      <tr>
                        <td class="fw-bold text-muted">Reason</td>
                        <td>{{ proposal.reason || '-' }}</td>
                      </tr>
                      <tr>
                        <td class="fw-bold text-muted">Created At</td>
                        <td>{{ formatDate(proposal.created_at) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <!-- Items -->
          <div class="card rounded-1 mb-3">
            <div class="card-header">
              <h6 class="card-title mb-0">Items</h6>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-vcenter table-nowrap mb-0">
                  <thead>
                    <tr>
                      <th class="text-center" style="width: 60px;">#</th>
                      <th>Entity ID</th>
                      <th>Payload</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, idx) in proposal.items" :key="item.id">
                      <td class="text-center">{{ item.seq_no }}</td>
                      <td>
                        <code class="small">{{ item.entity_id || '-' }}</code>
                      </td>
                      <td>
                        <div class="small">
                          <template v-if="typeof parsedPayloads[idx] === 'object'">
                            <div
                              v-for="(val, key) in parsedPayloads[idx] as Record<string, any>"
                              :key="String(key)"
                              class="mb-1"
                            >
                              <span class="fw-medium text-muted">{{ key }}:</span>
                              <span class="ms-1">{{ String(val) }}</span>
                            </div>
                          </template>
                          <code v-else class="small">{{ item.payload_json }}</code>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div v-if="proposal.status === 'PENDING'" class="d-flex gap-2">
            <NuxtLink
              v-if="editPath"
              :to="editPath"
              class="btn btn-warning rounded-1 text-dark"
            >
              <Icon name="i-tabler:pencil" class="icon icon-2 me-1" />
              Edit
            </NuxtLink>
            <button
              type="button"
              class="btn btn-success rounded-1"
              @click="openReview('APPROVED')"
            >
              <Icon name="i-tabler:check" class="icon icon-2 me-1" />
              Approve
            </button>
            <button
              type="button"
              class="btn btn-danger rounded-1"
              @click="openReview('REJECTED')"
            >
              <Icon name="i-tabler:x" class="icon icon-2 me-1" />
              Reject
            </button>
          </div>

          <div v-if="proposal.status === 'APPROVED'" class="d-flex gap-2">
            <button
              type="button"
              class="btn btn-primary rounded-1"
              :disabled="execLoading"
              @click="executeProposal"
            >
              <span v-if="execLoading" class="spinner-border spinner-border-sm me-1" role="status"></span>
              <Icon v-else name="i-tabler:player-play" class="icon icon-2 me-1" />
              Execute
            </button>
          </div>
        </div>
      </div>
    </PageBody>

    <!-- Review Modal -->
    <div ref="reviewModalEl" class="modal fade" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content rounded-1">
          <div class="modal-header">
            <h5 class="modal-title d-flex align-items-center">
              <Icon
                :name="reviewAction === 'APPROVED' ? 'i-tabler:check' : 'i-tabler:x'"
                :class="['icon me-2 icon-2', reviewAction === 'APPROVED' ? 'text-success' : 'text-danger']"
              />
              {{ reviewAction === 'APPROVED' ? 'Approve Proposal' : 'Reject Proposal' }}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div v-if="reviewAction === 'REJECTED'" class="mb-3">
              <label class="form-label">Reason for rejection <span class="text-danger">*</span></label>
              <textarea
                v-model="reviewNotes"
                class="form-control rounded-1"
                rows="3"
                placeholder="Explain why this proposal is rejected"
              ></textarea>
            </div>
            <p v-else class="mb-0 text-muted small">
              Are you sure you want to approve this proposal?
            </p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary rounded-1" data-bs-dismiss="modal">
              Cancel
            </button>
            <button
              type="button"
              :class="['btn rounded-1', reviewAction === 'APPROVED' ? 'btn-success' : 'btn-danger']"
              :disabled="reviewLoading || (reviewAction === 'REJECTED' && !reviewNotes.trim())"
              @click="submitReview"
            >
              <span v-if="reviewLoading" class="spinner-border spinner-border-sm me-1" role="status"></span>
              {{ reviewAction === 'APPROVED' ? 'Approve' : 'Reject' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
