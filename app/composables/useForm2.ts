export function useForm2() {
  const loading = ref(false);
  const success = ref(false);
  const errors = ref<Record<string, string>>({});
  const { setFlash } = useFlash();

  const submitForm = async (
    url: string,
    options: {
      method?: "POST" | "PUT" | "PATCH" | "DELETE";
      body?: any;
      successMessage?: string;
      onSuccess?: (response: any) => void;
      onError?: (error: any) => void;
    } = {}
  ) => {
    const {
      method = "POST",
      body,
      successMessage = "Berhasil!",
      onSuccess,
      onError,
    } = options;

    loading.value = true;
    errors.value = {};

    try {
      const response = await useApi(url, {
        method,
        body,
      });

      if (response.status >= 200 && response.status < 300 && !response.error) {
        success.value = true;
        setFlash(response.message || successMessage, "success");
        onSuccess?.(response.data ?? response);
        return response;
      }

      if (response.errors) {
        errors.value = convertErrors(response.errors);
      } else {
        const errMsg = response.message || response.error?.data?.message || "Terjadi kesalahan";
        setFlash(errMsg, "error");
      }
      success.value = false;
      onError?.(response.error || response);
      return response;
    } catch (err: any) {
      const data = err.response?._data;
      if (data?.errors) {
        errors.value = convertErrors(data.errors);
      } else {
        setFlash(data?.message || "Terjadi kesalahan", "error");
      }
      success.value = false;
      onError?.(data?.error || data || err);
      return data ?? { data: null, status: 500, error: err };
    } finally {
      loading.value = false;
    }
  };

  const resetForm = () => {
    errors.value = {};
    loading.value = false;
    success.value = false;
  };

  const convertErrors = (apiErrors: any): Record<string, string> => {
    const fieldErrors: Record<string, string> = {};

    if (Array.isArray(apiErrors)) {
      for (const item of apiErrors) {
        const key = item.field;
        if (key) {
          fieldErrors[key] = item.message || "Error pada field ini";
        }
      }
    } else if (apiErrors && typeof apiErrors === "object") {
      for (const [key, val] of Object.entries(apiErrors)) {
        fieldErrors[key] = Array.isArray(val) ? val[0] : String(val);
      }
    }

    return fieldErrors;
  };

  const formatError = (label: string, key: string) => {
    const msg = errors.value[key];
    if (!msg) return "";
    return msg.replace(new RegExp(key, "i"), label);
  };

  return {
    loading: readonly(loading),
    success: readonly(success),
    errors: readonly(errors),
    formatError,
    submitForm,
    resetForm,
  };
}
