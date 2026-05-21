// Ambil store & token di dalam function (bukan module scope)

export function useApiNew<T>(url: string, options: any = {}) {
  // Fungsi internal untuk build headers
  const buildHeaders = (token?: string | null) => ({
    ...options.headers,
    ...(token && { Authorization: `Bearer ${token}` }),
  });

  // Fungsi fetch murni — tidak pakai composable apapun
  const executeFetch = async (token?: string | null): Promise<{
    data: T | null;
    status: number;
    message?: string;
    error?: any;
    errors?: any;
  }> => {
    const fetchOptions = {
      ...options,
      headers: buildHeaders(token),
      ignoreResponseError: true,
    };

    try {
      const response = await $fetch<any>(url, fetchOptions);
      return {
        data: response,
        status: response.status || 200,
        message: response.message,
        errors: response.data?.errors || response.errors,
      };
    } catch (err: any) {
      console.warn("API Error:", err);

      // Auto refresh token pada 401
      if (err?.status === 401) {
        try {
          const auth = useAuthStore();
          const refreshed = await auth.refreshAccessToken();

          if (refreshed && auth.accessToken) {
            // Retry dengan token baru
            return await executeFetch(auth.accessToken);
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

      return {
        data: null,
        status: err?.status || 500,
        message: err?.data?.message || err?.message || "Request failed",
        error: err,
      };
    }
  };

  // Return fungsi — caller harus panggil di setup context
  return () => {
    const auth = useAuthStore();
    return executeFetch(auth.accessToken);
  };
}