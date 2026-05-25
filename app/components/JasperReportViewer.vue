<script setup lang="ts">
import { useJasperXml, evaluateExpression, type JrxmlReport, type JrxmlElement, type JrxmlBand } from "~/composables/useJasperXml";

const props = withDefaults(
  defineProps<{
    jrxmlUrl?: string;
    jrxmlSrc?: string;
    data: any[];
    scale?: number; // Zoom level, e.g. 1
  }>(),
  {
    jrxmlUrl: "",
    jrxmlSrc: "",
    scale: 1.25 // Standard high-def display scale
  }
);

const emit = defineEmits<{
  (e: "loaded", report: JrxmlReport): void;
  (e: "error", msg: string): void;
}>();

const { parsedReport, error, loading, loadReport } = useJasperXml();

// Load the report if URL or source XML is provided
onMounted(async () => {
  if (props.jrxmlUrl) {
    await loadReport(props.jrxmlUrl);
  } else if (props.jrxmlSrc) {
    try {
      const { parseJrxml } = useJasperXml();
      parsedReport.value = parseJrxml(props.jrxmlSrc);
    } catch (e: any) {
      error.value = e.message || "Failed to parse local JRXML source";
    }
  }

  if (error.value) {
    emit("error", error.value);
  } else if (parsedReport.value) {
    emit("loaded", parsedReport.value);
  }
});

// Watch for prop changes
watch(() => props.jrxmlUrl, async (newUrl) => {
  if (newUrl) {
    await loadReport(newUrl);
    if (error.value) emit("error", error.value);
    else if (parsedReport.value) emit("loaded", parsedReport.value);
  }
});

// Resolve styling for an element
const getElementStyle = (elem: JrxmlElement) => {
  const s = props.scale;
  const style: Record<string, string> = {
    position: "absolute",
    left: `${elem.x * s}px`,
    top: `${elem.y * s}px`,
    width: `${elem.width * s}px`,
    height: `${elem.height * s}px`,
    fontSize: `${elem.fontSize * s}px`,
    fontFamily: elem.fontName === "Helvetica" ? "sans-serif" : "serif",
    lineHeight: "1.2",
    display: "flex",
    flexDirection: "column",
    padding: `${1 * s}px ${2 * s}px`
  };

  // Horizontal Alignment
  if (elem.align === "Center") style.alignItems = "center";
  else if (elem.align === "Right") style.alignItems = "flex-end";
  else style.alignItems = "flex-start";

  // Vertical Alignment
  if (elem.vAlign === "Middle") style.justifyContent = "center";
  else if (elem.vAlign === "Bottom") style.justifyContent = "flex-end";
  else style.justifyContent = "flex-start";

  // Text Alignment
  style.textAlign = elem.align.toLowerCase();

  // Background and opacity
  if (elem.mode === "Opaque" && elem.backColor) {
    style.backgroundColor = elem.backColor.startsWith("#") ? elem.backColor : `#${elem.backColor}`;
  }

  // Border configuration
  if (elem.border) {
    const borderThickness = elem.borderWidth ? `${elem.borderWidth * s}px` : "1px";
    style.border = `${borderThickness} solid #0f172a`;
  }

  // Typography styles
  if (elem.fontStyle.includes("B")) style.fontWeight = "bold";
  if (elem.fontStyle.includes("I")) style.fontStyle = "italic";

  return style;
};

// Evaluate the text in expression
const resolveText = (elem: JrxmlElement, rowData: any, index: number) => {
  if (elem.type === "staticText") return elem.text;
  if (elem.type === "textField" && elem.text) {
    return evaluateExpression(elem.text, rowData, index);
  }
  return "";
};
</script>

<template>
  <div class="jasper-report-viewer-component d-flex flex-column align-items-center">
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <div class="mt-2 text-muted">Parsing JRXML Template...</div>
    </div>
    <div v-else-if="error" class="alert alert-danger shadow-sm border-0 d-flex align-items-center gap-2">
      <Icon name="i-tabler:alert-triangle" class="icon" />
      <span>{{ error }}</span>
    </div>
    <div v-else-if="parsedReport" class="jasper-sheet-container position-relative">
      <!-- Realistic Paper Container (using dimensions parsed from JRXML) -->
      <div 
        class="jasper-paper-sheet shadow-lg"
        :style="{
          width: `${parsedReport.pageWidth * scale}px`,
          minHeight: `${parsedReport.pageHeight * scale}px`,
          paddingTop: `${parsedReport.topMargin * scale}px`,
          paddingBottom: `${parsedReport.bottomMargin * scale}px`,
          paddingLeft: `${parsedReport.leftMargin * scale}px`,
          paddingRight: `${parsedReport.rightMargin * scale}px`
        }"
      >
        
        <!-- 1. Title Band -->
        <div 
          v-if="parsedReport.title" 
          class="jasper-band position-relative"
          :style="{ height: `${parsedReport.title.height * scale}px` }"
        >
          <div 
            v-for="(elem, index) in parsedReport.title.elements" 
            :key="index"
            :style="getElementStyle(elem)"
            :class="['jasper-element', `elem-${elem.type}`]"
          >
            <template v-if="elem.type === 'staticText' || elem.type === 'textField'">
              {{ resolveText(elem, data[0] || {}, 1) }}
            </template>
            <template v-else-if="elem.type === 'line'">
              <div class="jr-line-horizontal w-100 border-top border-dark"></div>
            </template>
            <template v-else-if="elem.type === 'rect'">
              <div class="jr-rect w-100 h-100 border border-dark"></div>
            </template>
            <template v-else-if="elem.type === 'ellipse'">
              <div class="jr-ellipse w-100 h-100 border border-dark rounded-circle"></div>
            </template>
          </div>
        </div>

        <!-- 2. Page Header Band -->
        <div 
          v-if="parsedReport.pageHeader" 
          class="jasper-band position-relative"
          :style="{ height: `${parsedReport.pageHeader.height * scale}px` }"
        >
          <div 
            v-for="(elem, index) in parsedReport.pageHeader.elements" 
            :key="index"
            :style="getElementStyle(elem)"
            :class="['jasper-element', `elem-${elem.type}`]"
          >
            <template v-if="elem.type === 'staticText' || elem.type === 'textField'">
              {{ resolveText(elem, data[0] || {}, 1) }}
            </template>
            <template v-else-if="elem.type === 'line'">
              <div class="jr-line-horizontal w-100 border-top border-dark"></div>
            </template>
          </div>
        </div>

        <!-- 3. Column Header Band -->
        <div 
          v-if="parsedReport.columnHeader" 
          class="jasper-band position-relative"
          :style="{ height: `${parsedReport.columnHeader.height * scale}px` }"
        >
          <div 
            v-for="(elem, index) in parsedReport.columnHeader.elements" 
            :key="index"
            :style="getElementStyle(elem)"
            :class="['jasper-element', `elem-${elem.type}`]"
          >
            <template v-if="elem.type === 'staticText' || elem.type === 'textField'">
              {{ resolveText(elem, data[0] || {}, 1) }}
            </template>
            <template v-else-if="elem.type === 'line'">
              <div class="jr-line-horizontal w-100 border-top border-dark"></div>
            </template>
          </div>
        </div>

        <!-- 4. Detail Band (Repeats for each row in the dataset) -->
        <div 
          v-if="parsedReport.detail" 
          class="jasper-detail-section"
        >
          <div 
            v-for="(row, rowIdx) in data" 
            :key="rowIdx"
            class="jasper-band position-relative"
            :style="{ height: `${parsedReport.detail.height * scale}px` }"
          >
            <div 
              v-for="(elem, index) in parsedReport.detail.elements" 
              :key="index"
              :style="getElementStyle(elem)"
              :class="['jasper-element', `elem-${elem.type}`]"
            >
              <template v-if="elem.type === 'staticText' || elem.type === 'textField'">
                {{ resolveText(elem, row, rowIdx + 1) }}
              </template>
              <template v-else-if="elem.type === 'line'">
                <div class="jr-line-horizontal w-100 border-top border-dark"></div>
              </template>
              <template v-else-if="elem.type === 'rect'">
                <div class="jr-rect w-100 h-100 border border-dark"></div>
              </template>
              <template v-else-if="elem.type === 'barcode'">
                <!-- Beautiful CSS/SVG Mock Barcode rendering barcodeExpression -->
                <div class="jr-barcode d-flex flex-column align-items-center justify-content-center border border-dashed border-secondary bg-light w-100 h-100 p-1">
                  <div class="d-flex align-items-end gap-1 w-100 justify-content-center" style="height: 60%;">
                    <div v-for="n in 18" :key="n" :style="{ width: n % 3 === 0 ? '4px' : '2px', height: '100%', backgroundColor: '#0f172a' }"></div>
                  </div>
                  <span style="font-size: 8px; color: #475569;" class="mt-1 font-monospace">
                    {{ evaluateExpression(elem.barcodeExpression || '', row, rowIdx + 1) }}
                  </span>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- 5. Column Footer Band -->
        <div 
          v-if="parsedReport.columnFooter" 
          class="jasper-band position-relative"
          :style="{ height: `${parsedReport.columnFooter.height * scale}px` }"
        >
          <div 
            v-for="(elem, index) in parsedReport.columnFooter.elements" 
            :key="index"
            :style="getElementStyle(elem)"
            :class="['jasper-element', `elem-${elem.type}`]"
          >
            <template v-if="elem.type === 'staticText' || elem.type === 'textField'">
              {{ resolveText(elem, data[0] || {}, 1) }}
            </template>
            <template v-else-if="elem.type === 'line'">
              <div class="jr-line-horizontal w-100 border-top border-dark"></div>
            </template>
          </div>
        </div>

        <!-- 6. Summary Band -->
        <div 
          v-if="parsedReport.summary" 
          class="jasper-band position-relative"
          :style="{ height: `${parsedReport.summary.height * scale}px` }"
        >
          <div 
            v-for="(elem, index) in parsedReport.summary.elements" 
            :key="index"
            :style="getElementStyle(elem)"
            :class="['jasper-element', `elem-${elem.type}`]"
          >
            <template v-if="elem.type === 'staticText' || elem.type === 'textField'">
              {{ resolveText(elem, data[0] || {}, 1) }}
            </template>
            <template v-else-if="elem.type === 'line'">
              <div class="jr-line-horizontal w-100 border-top border-dark"></div>
            </template>
            <template v-else-if="elem.type === 'rect'">
              <div class="jr-rect w-100 h-100 border border-dark"></div>
            </template>
          </div>
        </div>

        <!-- 7. Page Footer Band (Absolutely anchored at the bottom of the page container) -->
        <div 
          v-if="parsedReport.pageFooter" 
          class="jasper-band position-absolute"
          :style="{ 
            height: `${parsedReport.pageFooter.height * scale}px`,
            left: `${parsedReport.leftMargin * scale}px`,
            right: `${parsedReport.rightMargin * scale}px`,
            bottom: `${parsedReport.bottomMargin * scale}px`
          }"
        >
          <div 
            v-for="(elem, index) in parsedReport.pageFooter.elements" 
            :key="index"
            :style="getElementStyle(elem)"
            :class="['jasper-element', `elem-${elem.type}`]"
          >
            <template v-if="elem.type === 'staticText' || elem.type === 'textField'">
              {{ resolveText(elem, data[0] || {}, 1) }}
            </template>
            <template v-else-if="elem.type === 'line'">
              <div class="jr-line-horizontal w-100 border-top border-dark"></div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.jasper-paper-sheet {
  background-color: white;
  border-radius: 4px;
  position: relative;
  box-sizing: border-box;
  overflow: hidden;
}

.jasper-band {
  width: 100%;
  box-sizing: border-box;
}

.jasper-element {
  box-sizing: border-box;
  overflow: hidden;
  white-space: pre-wrap;
  word-break: break-all;
}

.elem-line {
  padding: 0 !important;
}

.jr-line-horizontal {
  height: 0;
  width: 100%;
}

@media print {
  .jasper-paper-sheet {
    box-shadow: none !important;
    border: none !important;
    border-radius: 0 !important;
  }
}
</style>
