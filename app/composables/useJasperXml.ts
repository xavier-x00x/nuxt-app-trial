export interface JrxmlReport {
  name: string;
  pageWidth: number;
  pageHeight: number;
  leftMargin: number;
  rightMargin: number;
  topMargin: number;
  bottomMargin: number;
  title: JrxmlBand | null;
  pageHeader: JrxmlBand | null;
  columnHeader: JrxmlBand | null;
  detail: JrxmlBand | null;
  columnFooter: JrxmlBand | null;
  pageFooter: JrxmlBand | null;
  summary: JrxmlBand | null;
}

export interface JrxmlBand {
  height: number;
  elements: JrxmlElement[];
}

export interface JrxmlElement {
  type: "textField" | "staticText" | "line" | "rect" | "ellipse" | "barcode";
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  pattern: string;
  fontName: string;
  fontSize: number;
  fontStyle: string;
  align: "Left" | "Center" | "Right";
  vAlign: "Top" | "Middle" | "Bottom";
  border: string;
  borderWidth: number;
  backColor: string;
  mode: string;
  barcodeType?: string;
  barcodeExpression?: string;
}

export function parseJrxml(xmlText: string): JrxmlReport {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "text/xml");
  const root = xmlDoc.getElementsByTagName("jasperReport")[0];
  if (!root) {
    throw new Error("Invalid JRXML format: missing <jasperReport> root element");
  }

  const getIntAttr = (el: Element, name: string, fallback = 0): number => {
    const val = el.getAttribute(name);
    return val ? parseInt(val, 10) : fallback;
  };

  const getFloatAttr = (el: Element, name: string, fallback = 0): number => {
    const val = el.getAttribute(name);
    return val ? parseFloat(val) : fallback;
  };

  const parseBand = (bandParentTagName: string): JrxmlBand | null => {
    const parentEl = xmlDoc.getElementsByTagName(bandParentTagName)[0];
    if (!parentEl) return null;
    const bandEl = parentEl.getElementsByTagName("band")[0];
    if (!bandEl) return null;

    const elements: JrxmlElement[] = [];
    const children = bandEl.children;

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (!child) continue;
      const tagName = child.tagName;

      const reportElement = child.getElementsByTagName("reportElement")[0];
      if (!reportElement) continue;

      const x = getIntAttr(reportElement, "x");
      const y = getIntAttr(reportElement, "y");
      const width = getIntAttr(reportElement, "width");
      const height = getIntAttr(reportElement, "height");
      const backColor = reportElement.getAttribute("backcolor") || "";
      const mode = reportElement.getAttribute("mode") || "Transparent";

      let type: JrxmlElement["type"] = "staticText";
      let text = "";
      let pattern = "";
      let barcodeType = "";
      let barcodeExpression = "";

      const textElement = child.getElementsByTagName("textElement")[0];
      let align: JrxmlElement["align"] = "Left";
      let vAlign: JrxmlElement["vAlign"] = "Top";
      if (textElement) {
        const hAlignAttr = textElement.getAttribute("textAlignment");
        if (hAlignAttr === "Center") align = "Center";
        else if (hAlignAttr === "Right") align = "Right";

        const vAlignAttr = textElement.getAttribute("verticalAlignment") || textElement.getAttribute("vAlign");
        if (vAlignAttr === "Middle") vAlign = "Middle";
        else if (vAlignAttr === "Bottom") vAlign = "Bottom";
      }

      const fontEl = child.getElementsByTagName("font")[0];
      let fontName = "Helvetica";
      let fontSize = 10;
      let fontStyle = "";
      if (fontEl) {
        fontName = fontEl.getAttribute("fontName") || "Helvetica";
        fontSize = getIntAttr(fontEl, "size", 10);
        if (fontEl.getAttribute("isBold") === "true") fontStyle += "B";
        if (fontEl.getAttribute("isItalic") === "true") fontStyle += "I";
      }

      let border = "";
      let borderWidth = 0;
      const penEl = child.getElementsByTagName("pen")[0];
      if (penEl) {
        const lw = getFloatAttr(penEl, "lineWidth");
        if (lw > 0) {
          border = "1";
          borderWidth = lw;
        }
      }

      if (tagName === "textField") {
        type = "textField";
        pattern = child.getAttribute("pattern") || "";
        const exprEl = child.getElementsByTagName("textFieldExpression")[0];
        if (exprEl) {
          text = exprEl.textContent || "";
        }
      } else if (tagName === "staticText") {
        type = "staticText";
        const textEl = child.getElementsByTagName("text")[0];
        if (textEl) {
          text = textEl.textContent || "";
        }
      } else if (tagName === "line") {
        type = "line";
      } else if (tagName === "rectangle") {
        type = "rect";
      } else if (tagName === "ellipse") {
        type = "ellipse";
      } else if (tagName === "componentElement") {
        type = "barcode";
        const jrComponents = ["Code128", "Code39", "QRCode", "DataMatrix", "EAN13", "EAN8"];
        for (const comp of jrComponents) {
          const compEl = child.getElementsByTagName(comp)[0];
          if (compEl) {
            barcodeType = comp;
            break;
          }
        }
        const exprEl = child.getElementsByTagName("codeExpression")[0];
        if (exprEl) {
          barcodeExpression = exprEl.textContent || "";
        }
      }

      elements.push({
        type,
        x,
        y,
        width,
        height,
        text,
        pattern,
        fontName,
        fontSize,
        fontStyle,
        align,
        vAlign,
        border,
        borderWidth,
        backColor,
        mode,
        barcodeType,
        barcodeExpression
      });
    }

    return {
      height: getIntAttr(bandEl, "height"),
      elements
    };
  };

  return {
    name: root.getAttribute("name") || "report",
    pageWidth: getIntAttr(root, "pageWidth", 595),
    pageHeight: getIntAttr(root, "pageHeight", 842),
    leftMargin: getIntAttr(root, "leftMargin", 20),
    rightMargin: getIntAttr(root, "rightMargin", 20),
    topMargin: getIntAttr(root, "topMargin", 20),
    bottomMargin: getIntAttr(root, "bottomMargin", 20),
    title: parseBand("title"),
    pageHeader: parseBand("pageHeader"),
    columnHeader: parseBand("columnHeader"),
    detail: parseBand("detail"),
    columnFooter: parseBand("columnFooter"),
    pageFooter: parseBand("pageFooter"),
    summary: parseBand("summary")
  };
}

export function evaluateExpression(expr: string, row: Record<string, any>, rowIndex: number): string {
  let clean = expr.trim();
  clean = clean.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "");
  clean = clean.replace(/\$V\{REPORT_COUNT\}/g, String(rowIndex));

  if (clean.includes('"') || clean.includes('+')) {
    let result = "";
    let inQuote = false;
    let currentToken = "";

    for (let i = 0; i < clean.length; i++) {
      const c = clean[i];
      if (c === '"') {
        if (inQuote) {
          inQuote = false;
          result += currentToken;
          currentToken = "";
        } else {
          if (currentToken.trim() && currentToken.trim() !== "+") {
            result += resolveFieldOrValue(currentToken, row);
          }
          currentToken = "";
          inQuote = true;
        }
      } else if (c === '+' && !inQuote) {
        if (currentToken.trim() && currentToken.trim() !== "+") {
          result += resolveFieldOrValue(currentToken, row);
        }
        currentToken = "";
      } else {
        currentToken += c;
      }
    }
    if (currentToken.trim() && currentToken.trim() !== "+") {
      result += resolveFieldOrValue(currentToken, row);
    }
    return result;
  } else {
    return resolveFieldOrValue(clean, row);
  }
}

function resolveFieldOrValue(token: string, row: Record<string, any>): string {
  const t = token.trim();
  if (t.startsWith("$F{") && t.endsWith("}")) {
    const fieldName = t.slice(3, -1);
    const val = row[fieldName];
    return val !== undefined && val !== null ? String(val) : "";
  }
  return t;
}

export function useJasperXml() {
  const parsedReport = ref<JrxmlReport | null>(null);
  const error = ref<string | null>(null);
  const loading = ref(false);

  const loadReport = async (jrxmlUrl: string) => {
    loading.value = true;
    error.value = null;
    try {
      const resp = await fetch(jrxmlUrl);
      if (!resp.ok) throw new Error(`Failed to fetch JRXML: ${resp.statusText}`);
      const xmlText = await resp.text();
      parsedReport.value = parseJrxml(xmlText);
    } catch (e: any) {
      error.value = e.message || "An unknown error occurred while parsing JRXML";
      parsedReport.value = null;
    } finally {
      loading.value = false;
    }
  };

  return {
    parsedReport,
    error,
    loading,
    loadReport,
    parseJrxml,
    evaluateExpression
  };
}
