import CropperCanvas from "@cropper/element-canvas";
import CropperImage from "@cropper/element-image";
import CropperSelection from "@cropper/element-selection";
import CropperHandle from "@cropper/element-handle";
import CropperGrid from "@cropper/element-grid";
import CropperShade from "@cropper/element-shade";
import CropperCrosshair from "@cropper/element-crosshair";
import CropperViewer from "@cropper/element-viewer";

export default defineNuxtPlugin(() => {
  // Daftarkan custom elements yang dibutuhkan
  CropperCanvas.$define();
  CropperImage.$define();
  CropperSelection.$define();
  CropperHandle.$define();
  CropperGrid.$define();
  CropperShade.$define();
  CropperCrosshair.$define();
  CropperViewer.$define();
});
