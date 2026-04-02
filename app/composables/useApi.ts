/* eslint-disable @typescript-eslint/no-explicit-any */
// composables/useApi.ts
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
  const auth = useAuthStore();

  // if (!options.headers) options.headers = {};
  // if (auth.accessToken) {
  //   options.headers["Authorization"] = `Bearer ${auth.accessToken}`;
  // }

  // Setup headers dengan token
  const headers = {
    ...options.headers,
    ...(auth.accessToken && { Authorization: `Bearer ${auth.accessToken}` }),
  };

  const fetchOptions = {
    ...options,
    headers,
    // Mencegah throw error, handle manual
    ignoreResponseError: true,
  };

  try {
    // return await $fetch<T>(url, options);
    const response = await $fetch<any>(url, fetchOptions);
    return {
      data: response,
      status: response.status || 200,
      message: response.message,
      errors: response.data?.errors || response.errors,
    };
  } catch (err: any) {
    console.warn("API Error:", err); // Log untuk debugging tanpa throw
    // Kalau token expired → refresh token → ulang request
    // if (err?.status === 401 && auth.refreshToken) {
    //   auth.loadRefreshToken();
    //   await auth.setAccessToken();

    //   if (auth.accessToken) {
    //     options.headers["Authorization"] = `Bearer ${auth.accessToken}`;
    //     return await $fetch<T>(url, options); // retry
    //   }
    // }
    // Auto refresh token pada 401 error
    if (err?.status === 401 && auth.refreshToken) {
      try {
        auth.loadRefreshToken();
        await auth.setAccessToken();

        if (auth.accessToken) {
          fetchOptions.headers.Authorization = `Bearer ${auth.accessToken}`;
          try {
            const retryResponse = await $fetch<any>(url, fetchOptions);
            return {
              data: retryResponse,
              status: retryResponse.status || 200,
              message: retryResponse.message,
            };
          } catch (retryErr: any) {
            console.warn("API Retry Error:", retryErr);
            return {
              data: null,
              status: retryErr?.status || 500,
              message: retryErr?.data?.message || "Request failed after retry",
              error: retryErr,
            };
          }
        }
      } catch (refreshErr) {
        console.warn("Token refresh error:", refreshErr);
        return {
          data: null,
          status: err?.status || 500,
          message: err?.data?.message || "Authentication failed",
          error: err,
        };
      }
    }

    // Return error response instead of throwing
    return {
      data: null,
      status: err?.status || 500,
      message: err?.data?.message || err?.message || "Request failed",
      error: err,
    };
  }
}
