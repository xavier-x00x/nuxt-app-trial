<script setup lang="ts">
import type { PurchaseOrderPlanning } from '~/types/purchase-order'

defineProps<{
  p: PurchaseOrderPlanning
}>()

const emit = defineEmits<{
  (e: 'update', p: PurchaseOrderPlanning): void
  (e: 'open-supplier', p: PurchaseOrderPlanning): void
}>()
</script>

<template>
  <!-- eslint-disable vue/no-mutating-props -->
  <tr>
    <td class="text-center">
      <input
        v-model="p.is_selected"
        type="checkbox"
        class="form-check-input"
        @change="emit('update', p)"
      />
    </td>
    <td>
      <div class="fw-bold">{{ p.product_name }}</div>
      <div class="text-muted small">SKU: {{ p.product_sku }}</div>
    </td>
    <td>
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <div :class="{'text-primary fw-bold': p.is_manual_supplier}">
            {{ p.supplier_name || '-' }}
          </div>
          <div class="text-muted small">
            {{ p.supplier_code }}
            <span v-if="p.is_manual_supplier" class="badge bg-primary-lt ms-1">Manual</span>
          </div>
        </div>
        <button 
          type="button" 
          class="btn btn-sm btn-icon btn-outline-secondary border-0 ms-2" 
          title="Ganti Supplier"
          @click="emit('open-supplier', p)"
        >
          <Icon name="i-tabler:edit" class="icon" />
        </button>
      </div>
    </td>
    <td class="text-end fw-semibold" :class="{ 'text-danger': p.current_stock <= p.reorder_point }">
      {{ p.current_stock }}
    </td>
    <td class="text-end text-muted">{{ p.safety_stock }}</td>
    <td class="text-end text-warning fw-semibold">{{ p.reorder_point }}</td>
    <td class="text-end text-success fs-5">
      {{ p.recommended_order_qty }}
    </td>
    <td class="text-center">
      <ui-input2
        v-model="p.order_qty"
        type="number"
        placeholder="0"
        :decimal="0"
        iclass="fw-bold"
        @change="emit('update', p)"
      />
    </td>
    <td class="text-center">
      <span
        :class="['badge', p.status === 'APPROVED' ? 'bg-success text-white' : 'bg-warning text-dark']"
      >
        {{ p.status }}
      </span>
    </td>
  </tr>
</template>
