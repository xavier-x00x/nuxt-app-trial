export function useConfirmDelete() {
  // const itemId = ref<number | null>(null);
  const itemId = useState<number | null>("delete_id", () => null);
  const callback = useState<((id: number) => void) | null>(
    "confirmDeleteCallback",
    () => null
  );

  const openConfirmDelete = (id: number, cb: (id: number) => void) => {
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
