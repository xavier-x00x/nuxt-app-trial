type FlashType = "success" | "error" | "info" | "warning";

const flashMessage = ref<unknown>(null);
const flashType = ref<FlashType>("info");
const flashVisible = ref(false);

export function useFlash() {
  const setFlash = (message: unknown, type: FlashType = "info") => {
    flashVisible.value = true;
    flashMessage.value = message;
    flashType.value = type;

    console.log(message);

    let timeout = 5000; // 5 detik
    if (type === "error" || type === "warning") timeout = 60000; // 1 menit untuk error dan warning
    // auto clear
    setTimeout(() => {
      flashVisible.value = false;
    }, timeout);
  };

  return {
    flashMessage,
    flashType,
    flashVisible,
    setFlash,
  };
}
