export function useToast() {
  const message = useState<string | null>("toast_message", () => null);
  const title = useState<string | null>("toast_title", () => "success");
  const toastEl = ref<HTMLElement | null>(null);
  let toast: any = null;

  onMounted(async () => {
    const bootstrap = window.bootstrap;
    if (toastEl.value) {
      toast = new bootstrap.Toast(toastEl.value);
    }
  });

  const show = (titlex: string = "Success", messagex: string) => {
    if (toastEl.value) {
      title.value = titlex ?? "Success";
      message.value = messagex ?? "";
      console.log(message.value);
    }
    toast?.show();
  };

  return {
    toastEl,
    show,
    message,
    title,
  };
}
