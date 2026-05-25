<script setup lang="ts">
const route = useRoute();
const { setFlash } = useFlash();

const id = computed(() => String(route.params.id));
const title = "Product Detail";
useHead({ title });

interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category_id: string;
  category: { name: string } | null;
  base_uom_id: string;
  base_uom: { name: string } | null;
  is_stockable: boolean;
  length: number;
  width: number;
  height: number;
  weight: number;
  is_stackable: boolean;
  max_stack_layer: number;
  created_at: string;
  updated_at: string;
}

interface ProductResponse {
  data: Product;
  message: string;
}

const product = ref<Product | null>(null);
const loading = ref(true);

const { data: resp, error } = await useApiFetch<ProductResponse>(`/products/${id.value}`);
if (error.value || !resp.value) {
  setFlash("Data product tidak ditemukan", "error");
  navigateTo("/product");
} else {
  product.value = resp.value.data;
}
loading.value = false;

// Custom features for PDF report view
const tableData = computed(() => {
  if (!product.value) return [];
  return [
    { label: "Product Name", group: "General", unit: "-", value: product.value.name },
    { label: "SKU Number", group: "General", unit: "-", value: product.value.sku },
    { label: "Barcode", group: "General", unit: "-", value: product.value.barcode || '-' },
    { label: "Category", group: "General", unit: "-", value: product.value.category?.name || '-' },
    { label: "Base Unit of Measure (UOM)", group: "General", unit: "-", value: product.value.base_uom?.name || '-' },
    { label: "Stockable Item", group: "Inventory", unit: "Boolean", value: product.value.is_stockable ? 'Yes' : 'No' },
    { label: "Physical Length", group: "Physical", unit: "cm", value: String(product.value.length) },
    { label: "Physical Width", group: "Physical", unit: "cm", value: String(product.value.width) },
    { label: "Physical Height", group: "Physical", unit: "cm", value: String(product.value.height) },
    { label: "Product Weight", group: "Physical", unit: "kg", value: String(product.value.weight) },
    { label: "Stackable Item", group: "Storage", unit: "Boolean", value: product.value.is_stackable ? 'Yes' : 'No' },
    { label: "Max Stack Layer Allowed", group: "Storage", unit: "Layers", value: String(product.value.max_stack_layer) },
  ];
});

// Data transformed for JRXML template field names
const reportData = computed(() => {
  if (!product.value) return [];
  const p = product.value;
  const base = {
    productId: p.id.slice(0, 5),
    createdAt: formatDate(p.created_at),
    productName: p.name,
    productSku: p.sku,
    categoryName: p.category?.name || '-',
  };
  return tableData.value.map((item) => ({ ...base, ...item }));
});

const onReportLoaded = () => {};

const onReportError = (msg: string) => {
  setFlash(msg, "error");
};

const printReport = () => {
  if (import.meta.client) {
    window.print();
  }
};

const downloadCSV = () => {
  if (!product.value) return;
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "No,Specification / Attribute,Group,Unit,Value\n";
  tableData.value.forEach((item, idx) => {
    csvContent += `"${idx + 1}","${item.label}","${item.group}","${item.unit}","${item.value}"\n`;
  });
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Product_Specification_Report_${product.value.sku}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:package">
      <ui-button-back to="/product" />
    </PageHeader>
    <PageBody>
      <div v-if="loading" class="text-center py-4">
        <div class="spinner-border text-primary" role="status"></div>
        <div class="mt-2">Loading Product Report...</div>
      </div>
      <div v-else-if="product" class="report-viewer-container shadow">
        <!-- PDF / Report Viewer Top Toolbar -->
        <div class="report-toolbar d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-1 flex-wrap">
            <button class="btn btn-toolbar" @click="printReport">
              <Icon name="i-tabler:printer" class="icon" />
              <span>Print</span>
            </button>
            <div class="btn-group">
              <button class="btn btn-toolbar dropdown-toggle" data-bs-toggle="dropdown">
                <Icon name="i-tabler:device-floppy" class="icon" />
                <span>Save</span>
              </button>
              <ul class="dropdown-menu">
                <li><a class="dropdown-item" href="#" @click.prevent="printReport">Save as PDF</a></li>
                <li><a class="dropdown-item" href="#" @click.prevent="downloadCSV">Export SKU Metadata (CSV)</a></li>
              </ul>
            </div>
            <div class="btn-group">
              <button class="btn btn-toolbar dropdown-toggle" data-bs-toggle="dropdown">
                <span>Continuous</span>
              </button>
              <ul class="dropdown-menu">
                <li><a class="dropdown-item" href="#">Single Page</a></li>
                <li><a class="dropdown-item" href="#">Continuous</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div class="report-workspace">
          <JasperReportViewer
            jrxml-url="/templates/product_report.jrxml"
            :data="reportData"
            :scale="1.25"
            @loaded="onReportLoaded"
            @error="onReportError"
          />
        </div>
        <!-- PDF / Report Viewer Bottom Toolbar -->
        <div class="report-bottom-bar d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-1">
            <button class="btn btn-bottom-icon" title="First Page">
              <Icon name="i-tabler:chevrons-left" class="icon" />
            </button>
            <button class="btn btn-bottom-icon" title="Previous Page">
              <Icon name="i-tabler:chevron-left" class="icon" />
            </button>
            <div class="bottom-page-indicator">
              Page <span class="page-num">1</span> of 1
            </div>
            <button class="btn btn-bottom-icon" title="Next Page">
              <Icon name="i-tabler:chevron-right" class="icon" />
            </button>
            <button class="btn btn-bottom-icon" title="Last Page">
              <Icon name="i-tabler:chevrons-right" class="icon" />
            </button>
          </div>
          <div class="d-flex align-items-center gap-2">
            <button class="btn btn-bottom-icon" title="View mode">
              <Icon name="i-tabler:layout-grid" class="icon" />
            </button>
            <button class="btn btn-bottom-icon" title="Fit to width">
              <Icon name="i-tabler:arrows-maximize" class="icon" />
            </button>
            <div class="btn-group">
              <button class="btn btn-bottom dropdown-toggle" data-bs-toggle="dropdown">
                <span>100%</span>
              </button>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><a class="dropdown-item text-center" href="#">50%</a></li>
                <li><a class="dropdown-item text-center" href="#">75%</a></li>
                <li><a class="dropdown-item text-center" href="#">100%</a></li>
                <li><a class="dropdown-item text-center" href="#">150%</a></li>
                <li><a class="dropdown-item text-center" href="#">200%</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </PageBody>
  </div>
</template>

<style scoped>
/* Main Container */
.report-viewer-container {
  display: flex;
  flex-direction: column;
  background-color: #f1f5f9;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);
}

/* Top Toolbar */
.report-toolbar {
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.btn-toolbar {
  background: transparent;
  border: 1px solid transparent;
  color: #475569;
  font-size: 0.825rem;
  font-weight: 500;
  padding: 0.35rem 0.65rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  transition: all 0.15s ease;
}
.btn-toolbar:hover {
  background-color: #f1f5f9;
  border-color: #cbd5e1;
  color: #0f172a;
}
.btn-toolbar.active {
  background-color: #e2e8f0;
  border-color: #cbd5e1;
  color: #0f172a;
}
.btn-toolbar-icon {
  background: transparent;
  border: 1px solid transparent;
  color: #475569;
  padding: 0.35rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}
.btn-toolbar-icon:hover {
  background-color: #f1f5f9;
  border-color: #cbd5e1;
  color: #0f172a;
}
.toolbar-divider {
  width: 1px;
  height: 20px;
  background-color: #cbd5e1;
  margin: 0 0.25rem;
}
.btn-designer {
  background-color: transparent;
  border: 1px solid #cbd5e1;
  color: #475569;
  font-size: 0.825rem;
  font-weight: 500;
  padding: 0.35rem 0.65rem;
  border-radius: 4px;
  transition: all 0.15s ease;
}
.btn-designer:hover {
  background-color: #f1f5f9;
  color: #0f172a;
  border-color: #94a3b8;
}
.btn-lang {
  background: transparent;
  border: 1px solid #cbd5e1;
  color: #475569;
  font-size: 0.825rem;
  font-weight: 500;
  padding: 0.35rem 0.65rem;
  border-radius: 4px;
}
.btn-lang:hover {
  background-color: #f1f5f9;
}
.btn-signup {
  background-color: #ea580c;
  border: 1px solid #ea580c;
  color: white;
  font-size: 0.825rem;
  font-weight: 600;
  padding: 0.35rem 0.9rem;
  border-radius: 4px;
  transition: all 0.15s ease;
  text-decoration: none;
}
.btn-signup:hover {
  background-color: #c2410c;
  color: white;
  box-shadow: 0 2px 4px rgba(234, 88, 12, 0.2);
}

/* Workspace */
.report-workspace {
  padding: 2.5rem 1.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #cbd5e1;
  overflow-x: auto;
  min-height: 600px;
}

/* Bottom Bar */
.report-bottom-bar {
  background-color: #0f172a;
  border-top: 1px solid #1e293b;
  padding: 0.6rem 1.2rem;
  color: #94a3b8;
}
.btn-bottom {
  background: transparent;
  border: 1px solid #334155;
  color: #cbd5e1;
  font-size: 0.8rem;
  padding: 0.35rem 0.65rem;
  border-radius: 4px;
  transition: all 0.15s ease;
}
.btn-bottom:hover {
  background-color: #1e293b;
  color: white;
}
.btn-bottom-icon {
  background: transparent;
  border: 1px solid transparent;
  color: #94a3b8;
  padding: 0.35rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}
.btn-bottom-icon:hover {
  background-color: #1e293b;
  color: white;
}
.bottom-page-indicator {
  font-size: 0.8rem;
  font-weight: 500;
  margin: 0 0.5rem;
}
.page-num {
  background-color: #1e293b;
  color: white;
  padding: 0.15rem 0.45rem;
  border-radius: 3px;
  border: 1px solid #334155;
  font-weight: bold;
}

/* Print Styling */
@media print {
  /* Hide the rest of the application layout! */
  header, footer, nav, aside, .page-header, .report-toolbar, .report-bottom-bar {
    display: none !important;
  }
  body, html {
    background-color: white !important;
  }
  .report-viewer-container {
    box-shadow: none !important;
    background: transparent !important;
  }
  .report-workspace {
    padding: 0 !important;
    background: transparent !important;
  }

  /* Force printer colors */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
</style>
