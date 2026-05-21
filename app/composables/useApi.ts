// composables/useApi.ts
import { getAccessTokenCookie } from "~/stores/authStore";

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

  // Ambil token dari store, fallback read dari cookie bila SSR
  // Gunakan helper yang konsisten untuk akses cookie
  const token = auth.accessToken || nuxtApp.runWithContext(() => {
    return getAccessTokenCookie(nuxtApp).value;
  });

  // Setup headers dengan token
  const headers = {
    ...options.headers,
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const fetchOptions = {
    ...options,
    headers,
    // HAPUS ignoreResponseError supaya $fetch melempar error saat HTTP 401.
    // Jika tidak dilempar, catch block tidak akan pernah tereksekusi 
    // dan auto-refresh token tidak akan bekerja.
  };

  try {
    const response = await $fetch<any>(url, fetchOptions);
    return {
      data: response,
      status: 200,
      message: response?.message,
      errors: response?.errors,
    };
  } catch (err: any) {
    const errData = err?.response?._data ?? err?.data ?? {};
    const statusCode = err?.response?.status || err?.status || 500;

    if (statusCode === 401) {
      try {
        const refreshed = await nuxtApp.runWithContext(() => auth.refreshAccessToken());

        if (refreshed && auth.accessToken) {
          fetchOptions.headers.Authorization = `Bearer ${auth.accessToken}`;
          try {
            const retryResponse = await $fetch<any>(url, fetchOptions);
            return {
              data: retryResponse,
              status: 200,
              message: retryResponse?.message,
            };
          } catch (retryErr: any) {
            const retryData = retryErr?.response?._data ?? retryErr?.data ?? {};
            return {
              data: null,
              status: retryErr?.response?.status || retryErr?.status || 500,
              message: retryData?.message || "Request failed after retry",
              errors: retryData?.errors,
              error: retryErr,
            };
          }
        }
      } catch (refreshErr) {
        return {
          data: null,
          status: statusCode,
          message: errData?.message || "Authentication failed",
          errors: errData?.errors,
          error: err,
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
}
