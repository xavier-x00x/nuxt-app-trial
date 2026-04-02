/* eslint-disable @typescript-eslint/no-explicit-any */
export function useForm() {
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
      successMessage = "Berhasil!",
      onSuccess,
      onError,
    } = options;

    loading.value = true;
    errors.value = {};

    try {
      const response = await useApi(url, {
        method,
        body: options.body,
      });

      // Check if request was successful
      if (response.status >= 200 && response.status < 300 && !response.error) {
        // Handle success
        success.value = true;
        setFlash(response.message || successMessage, "success");
        onSuccess?.(response);
        return response;
      } else {
        // Handle API errors (non-2xx status or error field present)
        // console.log(response);
        if (response.errors) {
          errors.value = response.errors;
        } else {
          const errorMsg =
            response.message ||
            response.error?.data?.message ||
            "Terjadi kesalahan";
          setFlash(errorMsg, "error");
        }
        success.value = false;
        onError?.(response.error || response);
        return response; // Return instead of throw
      }
    } catch (err: any) {
      // This catch should rarely trigger now since useApi handles errors
      console.warn("Unexpected form error:", err);
      success.value = false;
      setFlash("Terjadi kesalahan tak terduga", "error");
      onError?.(err);
      return { data: null, status: 500, error: err };
    } finally {
      loading.value = false;
    }
  };

  const resetForm = () => {
    errors.value = {};
    loading.value = false;
    success.value = false;
  };

  return {
    loading: readonly(loading),
    success: readonly(success),
    errors: readonly(errors),
    submitForm,
    resetForm,
  };
}
