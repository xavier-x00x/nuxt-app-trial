export function usePrompt() {
  const message = useState<string | null>("toast_message", () => null);
  const title = useState<string | null>("toast_title", () => "success");
  const promptEl = ref<HTMLElement | null>(null);
  let promptx: any = null;

  onMounted(async () => {
    const bootstrap = window.bootstrap;
    if (promptEl.value) {
      promptx = new bootstrap.Modal(promptEl.value);
    }
  });

  const show = (titlex: string = "Success", messagex: string) => {
    if (promptEl.value) {
      title.value = titlex ?? "Success";
      message.value = messagex ?? "";
      console.log(message.value);
    }
    promptx?.show();
  };

  return {
    promptEl,
    show,
    message,
    title,
  };
}
