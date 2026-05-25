<script setup lang="ts">
const { setFlash } = useFlash();

interface Props {
  entityType: string;
  title: string;
  icon: string;
  basePath: string;
}

const props = withDefaults(defineProps<Props>(), {
  entityType: "PRODUCT",
  title: "New Proposal",
  icon: "i-tabler:file-check",
  basePath: "/usulan",
});

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
    { key: "name", label: "Name", type: "text", required: true },
    { key: "category_id", label: "Category", type: "selectx", apiUrl: "/categories/pagination", col: "col-md-6" },
    { key: "base_uom_id", label: "Base UOM", type: "selectx", apiUrl: "/uoms/pagination", col: "col-md-6" },
    { key: "length", label: "Length", type: "number", col: "col-md-3" },
    { key: "width", label: "Width", type: "number", col: "col-md-3" },
    { key: "height", label: "Height", type: "number", col: "col-md-3" },
    { key: "weight", label: "Weight", type: "number", col: "col-md-3" },
    { key: "is_stockable", label: "Is Stockable", type: "switch" },
    { key: "is_stackable", label: "Is Stackable", type: "switch" },
    { key: "max_stack_layer", label: "Max Stack Layer", type: "number", col: "col-md-6" },
  ],
  SUPPLIER: [
    { key: "code", label: "Code", type: "text", required: true, col: "col-md-6" },
    { key: "name", label: "Name", type: "text", required: true },
    { key: "contact_person", label: "Contact Person", type: "text", col: "col-md-6" },
    { key: "contact_phone", label: "Contact Phone", type: "text", col: "col-md-6" },
    { key: "phone_number", label: "Phone Number", type: "text", col: "col-md-6" },
    { key: "email", label: "Email", type: "email", col: "col-md-6" },
    { key: "preferred_notification_method", label: "Notification Method", type: "text" },
    { key: "address", label: "Address", type: "textarea" },
    { key: "tax_reg_number", label: "Tax Reg Number", type: "text" },
    { key: "supplier_category_id", label: "Supplier Category ID", type: "text" },
    { key: "is_pkp", label: "Is PKP", type: "switch" },
    { key: "payment_term_days", label: "Payment Term (days)", type: "number" },
    { key: "payment_mode", label: "Payment Mode", type: "text" },
    { key: "min_order_amount", label: "Min Order Amount", type: "number" },
    { key: "bank_name", label: "Bank Name", type: "text" },
    { key: "bank_account", label: "Bank Account", type: "text" },
    { key: "bank_account_name", label: "Bank Account Name", type: "text" },
    { key: "ap_account_id", label: "AP Account ID", type: "text" },
  ],
  CHART_OF_ACCOUNT: [
    { key: "account_code", label: "Account Code", type: "text", required: true },
    { key: "name", label: "Name", type: "text", required: true },
    {
      key: "account_type", label: "Account Type", type: "select", required: true,
      options: [
        { value: "ASSET", label: "Asset" },
        { value: "LIABILITY", label: "Liability" },
        { value: "EQUITY", label: "Equity" },
        { value: "REVENUE", label: "Revenue" },
        { value: "EXPENSE", label: "Expense" },
      ],
    },
    {
      key: "normal_balance", label: "Normal Balance", type: "select", required: true,
      options: [
        { value: "DEBIT", label: "Debit" },
        { value: "CREDIT", label: "Credit" },
      ],
    },
  ],
  TAX: [
    { key: "name", label: "Name", type: "text", required: true },
    { key: "rate_percentage", label: "Rate (%)", type: "number", required: true },
    { key: "tax_account_id", label: "Tax Account ID", type: "text" },
  ],
  PRODUCT_PRICE: [
    { key: "price_list_id", label: "Price List ID", type: "text", required: true },
    { key: "product_id", label: "Product ID", type: "text", required: true },
    { key: "uom_id", label: "UOM ID", type: "text" },
    { key: "markup_pct", label: "Markup %", type: "number" },
    { key: "sell_price", label: "Sell Price", type: "number", required: true },
    { key: "discount_pct", label: "Discount %", type: "number" },
  ],
  PRODUCT_UOM_CONVERSION: [
    { key: "product_id", label: "Product ID", type: "text", required: true },
    { key: "uom_id", label: "UOM ID", type: "text", required: true },
    { key: "conversion_rate", label: "Conversion Rate", type: "number", required: true },
    { key: "barcode", label: "Barcode", type: "text" },
    { key: "length", label: "Length", type: "number" },
    { key: "width", label: "Width", type: "number" },
    { key: "height", label: "Height", type: "number" },
    { key: "weight", label: "Weight", type: "number" },
    { key: "is_stackable", label: "Is Stackable", type: "switch" },
    { key: "max_stack_layer", label: "Max Stack Layer", type: "number" },
  ],
  PRODUCT_SUPPLIER: [
    { key: "product_id", label: "Product ID", type: "text", required: true },
    { key: "supplier_id", label: "Supplier ID", type: "text", required: true },
    { key: "supplier_sku", label: "Supplier SKU", type: "text" },
    { key: "is_primary", label: "Is Primary", type: "switch" },
    { key: "is_consignment", label: "Is Consignment", type: "switch" },
    { key: "is_returnable", label: "Is Returnable", type: "switch" },
    { key: "default_lead_time_days", label: "Lead Time (days)", type: "number" },
    { key: "offered_price", label: "Offered Price", type: "number" },
    { key: "min_order_qty", label: "Min Order Qty", type: "number" },
  ],
};

const proposalType = ref("CREATE");
const reason = ref("");
const items = ref<Record<string, any>>([{}]);

const addItem = () => {
  items.value.push({});
};

const removeItem = (idx: number) => {
  items.value.splice(idx, 1);
};

const currentFields = computed(() => entityFields[props.entityType] || []);

const form = ref<HTMLFormElement>();
const { loading, success, errors, formatError, submitForm } = useForm2();

const onSubmit = async () => {
  const dataPayload: Record<string, any> = {
    entity_type: props.entityType,
    action_type: proposalType.value,
    reason: reason.value || undefined,
    items: items.value.map((item) => ({
      entity_id: item.entity_id || null,
      payload_json: JSON.stringify(item.payload || item),
    })),
  };

  await submitForm("/master-data", {
    method: "POST",
    body: dataPayload,
  });
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
              <select v-model="proposalType" class="form-select rounded-1">
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
              <button
                v-if="items.length > 1"
                type="button"
                class="btn btn-sm btn-outline-danger position-absolute top-0 end-0 mt-2 me-2 rounded-1"
                @click="removeItem(idx)"
              >
                <Icon name="i-tabler:x" class="icon icon-2" />
              </button>

              <div v-if="proposalType !== 'CREATE'" class="mb-3">
                <ui-input2
                  v-model="item.entity_id"
                  label="Entity ID"
                  type="text"
                  placeholder="UUID of existing entity"
                />
                <div v-if="proposalType === 'UPDATE'" class="mt-3">
                  <ui-textarea
                    v-model="item.payload"
                    label="Payload (JSON)"
                    placeholder="{&quot;field&quot;: &quot;value&quot;}"
                    rows="4"
                  />
                </div>
              </div>

              <template v-if="proposalType === 'CREATE'">
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
                        <UiSelectSearch4
                          v-model="item[field.key]"
                          value-key="id"
                          :api-url="field.apiUrl as string"
                          :xname="`${field.key}_id`"
                          :placeholder="'Select ' + field.label"
                          :clearable="true"
                        />
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
              v-if="proposalType === 'CREATE'"
              type="button"
              class="btn btn-outline-secondary btn-sm rounded-1"
              @click="addItem"
            >
              <Icon name="i-tabler:plus" class="icon icon-2" />
              Add Item
            </button>
          </div>
        </div>
      </form>
    </PageBody>
  </div>
</template>
