export function useResource(basePath: string, id: Ref<string | number>) {
  const isNew = computed(() => String(id.value) === "new");
  const url = computed(() => isNew.value ? `/${basePath}` : `/${basePath}/${id.value}`);
  const method = computed<"POST" | "PUT">(() => isNew.value ? "POST" : "PUT");
  
  return { url, method, isNew };
}
