interface Response {
  data: any | null;
  status: number;
  message?: string;
  error?: any;
  errors?: any;
}

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
      // const response = await useApi(url, {
      //   method,
      //   body: options.body,
      // });

      const response = await $fetch<Response>(url, {
        method,
        body: options.body,
        headers: {
          Authorization: `Bearer ${useAuthStore().accessToken}`,
        }
      });

      console.log(response);

      // Handle success
      success.value = true;
      setFlash(response.message || successMessage, "success");
      onSuccess?.(response);
      return response;

      // Check if request was successful
      // if (response.status >= 200 && response.status < 300 && !response.error) {
      //   // Handle success
      //   success.value = true;
      //   setFlash(response.message || successMessage, "success");
      //   onSuccess?.(response);
      //   return response;
      // } else {
      //   // Handle API errors (non-2xx status or error field present)
      //   if (response.errors) {
          
      //     errors.value = convertErrors(response.errors);
      //   } else {
      //     const errorMsg =
      //       response.message ||
      //       response.error?.data?.message ||
      //       "Terjadi kesalahan";
      //     setFlash(errorMsg, "error");
      //   }
      //   success.value = false;
      //   onError?.(response.error || response);
      //   return response; // Return instead of throw
      // }
    } catch (err: any) {
      console.log(err.response);
      // Handle API errors (non-2xx status or error field present)
      if (err.response?._data?.errors) {
        errors.value = convertErrors(err.response?._data?.errors);
      } else {
        const errorMsg =
          err.response?._data?.message ||
          err.response?._data?.error?.data?.message ||
          "Terjadi kesalahan";
        setFlash(errorMsg, "error");
      }
      success.value = false;
      onError?.(err.response?._data?.error || err.response?._data || err);
      return err.response; // Return instead of throw
      // This catch should rarely trigger now since useApi handles errors
      // console.warn("Unexpected form error:", err);
      // success.value = false;
      // setFlash("Terjadi kesalahan tak terduga", "error");
      // onError?.(err);
      // return { data: null, status: 500, error: err };
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
    for (const index in apiErrors) {
      const key = apiErrors[index].field;
      fieldErrors[key] = apiErrors[index].message || "Error pada field ini";
    }
    return fieldErrors;
  };

  const formatError = (label: string, key: string) => {
    const msg = errors.value[key] || "";
    // replace key placeholder with label
    return msg.replace(key, label);
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
