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

    if (type === "error" || type === "warning") return;
    // auto clear setelah 3 detik
    setTimeout(() => {
      flashVisible.value = false;
    }, 3000);
  };

  return {
    flashMessage,
    flashType,
    flashVisible,
    setFlash,
  };
}
