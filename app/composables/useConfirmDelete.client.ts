export function useConfirmDelete() {
  // const itemId = ref<number | null>(null);
  const itemId = useState<string | number | null>("delete_id", () => null);
  const callback = useState<((id: any) => void) | null>(
    "confirmDeleteCallback",
    () => null
  );

  const openConfirmDelete = (id: string | number, cb: (id: any) => void) => {
    itemId.value = id;
    console.log("Data berhasil dihapus:", itemId.value);
    callback.value = cb;
    const bootstrap = window.bootstrap;
    const modal = new bootstrap.Modal(
      document.getElementById("deleteModal") as HTMLElement
    );
    modal.show();
  };

  const confirmDelete = () => {
    console.log("Data berhasil dihapus:", itemId.value);

    if (itemId.value && callback.value) {
      callback.value(itemId.value);
    }
    const bootstrap = window.bootstrap;
    const modalEl = document.getElementById("deleteModal") as HTMLElement;
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal?.hide();
  };

  return { itemId, openConfirmDelete, confirmDelete };
}
