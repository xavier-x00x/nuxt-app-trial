// composables/useApi.ts
// fungsi : untuk get/post/put/patch/delete data ke API dengan fitur auto refresh token pada 401
import { getAccessTokenCookie } from "~/stores/authStore";

const MAX_RETRY = 3;

export async function useApi<T>(
  url: string,
  options: any = {}
): Promise<{
  data: T | null;
  status: number;
  message?: string;
  error?: any;
  errors?: any;
}> {
  const nuxtApp = useNuxtApp();
  const auth = useAuthStore();
  const config = useRuntimeConfig();
  const baseURL = config.public.apiUrl;

  const execute = async (retryCount = 0): Promise<{
    data: T | null;
    status: number;
    message?: string;
    error?: any;
    errors?: any;
  }> => {
    const token = auth.accessToken || nuxtApp.runWithContext(() => {
      return getAccessTokenCookie(nuxtApp).value;
    });

    const headers = {
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const fetchOptions = {
      ...options,
      headers,
    };

    try {
      const response = await $fetch<any>(url, { ...fetchOptions, baseURL });
      return {
        data: response,
        status: 200,
        message: response?.message,
        errors: response?.errors,
      };
    } catch (err: any) {
      const errData = err?.response?._data ?? err?.data ?? {};
      const statusCode = err?.response?.status || err?.status || 500;

      if (statusCode === 401 && retryCount < MAX_RETRY) {
        try {
          const refreshed = await nuxtApp.runWithContext(() => auth.refreshAccessToken());
          if (refreshed && auth.accessToken) {
            return execute(retryCount + 1);
          }
        } catch (refreshErr) {
          await nuxtApp.runWithContext(() => auth.logout());
          return {
            data: null,
            status: statusCode,
            message: errData?.message || "Authentication failed",
            errors: errData?.errors,
            error: refreshErr,
          };
        }
      }

      return {
        data: null,
        status: statusCode,
        message: errData?.message || err?.message || "Request failed",
        errors: errData?.errors,
        error: err,
      };
    }
  };

  return execute();
}
