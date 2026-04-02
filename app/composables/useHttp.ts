/* eslint-disable @typescript-eslint/no-explicit-any */
// composables/useHttp.ts

// Base response interface
// interface ApiResponse<T = any> {
//   data?: T
//   message?: string
//   success?: boolean
// }

// HTTP method types - using exact string literals
type HttpMethod = "POST" | "PUT" | "DELETE";

// Generic request options - simplified for better compatibility
interface RequestOptions<T = any> {
  body?: T;
  headers?: Record<string, string>;
  query?: Record<string, any>;
  baseURL?: string;
  timeout?: number;
  retry?: number;
  retryDelay?: number;
  onRequest?: (context: { options: any }) => void;
  onResponse?: (context: { response: any }) => void;
  onResponseError?: (context: { error: any }) => void;
  [key: string]: any;
}

// Response state interface
// interface HttpState<T> {
//   data: Ref<T | null>
//   error: Ref<Error | null>
//   pending: Ref<boolean>
//   success: Ref<boolean>
// }

// Main composable function
export const useHttp = <TRequest = any, TResponse = any>(
  url: string,
  method: HttpMethod,
  options: RequestOptions<TRequest> = {}
) => {
  const data = ref<TResponse | null>(null);
  const error = ref<Error | null>(null);
  const pending = ref(false);
  const success = ref(false);

  const execute = async (
    requestData?: TRequest,
    overrideOptions?: RequestOptions<TRequest>
  ): Promise<TResponse | null> => {
    try {
      pending.value = true;
      error.value = null;
      success.value = false;

      // Merge options properly
      const mergedOptions = {
        ...options,
        ...overrideOptions,
      };

      // Add Authorization header if provided
      // if (mergedOptions.bearerToken) {
      //   const auth = useAuthStore();
      //   mergedOptions.headers = {
      //     ...mergedOptions.headers,
      //     Authorization: `Bearer ${auth.accessToken}`,
      //   };
      // }

      // Prepare fetch options with proper typing
      const fetchOptions: Record<string, any> = {
        method: method,
        headers: {
          "Content-Type": "application/json",
          ...mergedOptions.headers,
        },
      };

      // Add body if provided
      const bodyData = requestData || mergedOptions.body;
      if (bodyData !== undefined) {
        fetchOptions.body = bodyData;
      }

      // Add other options
      if (mergedOptions.query) fetchOptions.query = mergedOptions.query;
      if (mergedOptions.baseURL) fetchOptions.baseURL = mergedOptions.baseURL;
      if (mergedOptions.timeout) fetchOptions.timeout = mergedOptions.timeout;
      if (mergedOptions.retry !== undefined)
        fetchOptions.retry = mergedOptions.retry;
      if (mergedOptions.retryDelay)
        fetchOptions.retryDelay = mergedOptions.retryDelay;
      if (mergedOptions.onRequest)
        fetchOptions.onRequest = mergedOptions.onRequest;
      if (mergedOptions.onResponse)
        fetchOptions.onResponse = mergedOptions.onResponse;
      if (mergedOptions.onResponseError)
        fetchOptions.onResponseError = mergedOptions.onResponseError;

      const response = await $fetch<TResponse>(url, fetchOptions);

      data.value = response;
      success.value = true;
      return response;
    } catch (err) {
      error.value = err as Error;
      success.value = false;
      throw err;
    } finally {
      pending.value = false;
    }
  };

  const reset = () => {
    data.value = null;
    error.value = null;
    pending.value = false;
    success.value = false;
  };

  return {
    data: readonly(data),
    error: readonly(error),
    pending: readonly(pending),
    success: readonly(success),
    execute,
    reset,
  };
};

// Specialized composables for each HTTP method
export const usePost = <TRequest = any, TResponse = any>(
  url: string,
  options?: RequestOptions<TRequest>
) => {
  return useHttp<TRequest, TResponse>(url, "POST", options);
};

export const usePut = <TRequest = any, TResponse = any>(
  url: string,
  options?: RequestOptions<TRequest>
) => {
  return useHttp<TRequest, TResponse>(url, "PUT", options);
};

export const useDelete = <TRequest = any, TResponse = any>(
  url: string,
  options?: RequestOptions<TRequest>
) => {
  return useHttp<TRequest, TResponse>(url, "DELETE", options);
};

// Utility composable with auto-retry
export const useHttpWithRetry = <TRequest = any, TResponse = any>(
  url: string,
  method: HttpMethod,
  options: RequestOptions<TRequest> & {
    maxRetries?: number;
    retryDelay?: number;
  } = {}
) => {
  console.log("useHttpWithRetry");

  const { maxRetries = 3, retryDelay = 1000, ...httpOptions } = options;
  const http = useHttp<TRequest, TResponse>(url, method, httpOptions);
  // const auth = useAuthStore();

  const executeWithRetry = async (
    requestData?: TRequest,
    overrideOptions?: RequestOptions<TRequest>
  ): Promise<TResponse | null> => {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      // if (attempt === 2) {
      //   auth.loadRefreshToken();
      //   await auth.setAccessToken();
      // }

      try {
        return await http.execute(requestData, overrideOptions);
      } catch (err) {
        lastError = err as Error;

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }
    }

    throw lastError;
  };

  return {
    ...http,
    executeWithRetry,
    maxRetries,
    retryDelay,
  };
};

// Batch operations composable
export const useBatchHttp = () => {
  const operations = ref<Array<Promise<any>>>([]);
  const pending = ref(false);
  const results = ref<any[]>([]);
  const errors = ref<Error[]>([]);

  const addOperation = <TRequest, TResponse>(
    url: string,
    method: HttpMethod,
    data?: TRequest,
    options?: RequestOptions<TRequest>
  ) => {
    const fetchOptions: Record<string, any> = {
      method: method,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    };

    if (data !== undefined) {
      fetchOptions.body = data;
    }

    // Add other options
    if (options?.query) fetchOptions.query = options.query;
    if (options?.baseURL) fetchOptions.baseURL = options.baseURL;
    if (options?.timeout) fetchOptions.timeout = options.timeout;
    if (options?.retry !== undefined) fetchOptions.retry = options.retry;
    if (options?.retryDelay) fetchOptions.retryDelay = options.retryDelay;

    const operation = $fetch<TResponse>(url, fetchOptions);
    operations.value.push(operation);
    return operation;
  };

  const executeAll = async () => {
    if (operations.value.length === 0) return [];

    try {
      pending.value = true;
      results.value = await Promise.allSettled(operations.value);

      errors.value = results.value
        .filter((result) => result.status === "rejected")
        .map((result) => (result as PromiseRejectedResult).reason);

      return results.value;
    } finally {
      pending.value = false;
    }
  };

  const reset = () => {
    operations.value = [];
    results.value = [];
    errors.value = [];
    pending.value = false;
  };

  return {
    operations: readonly(operations),
    results: readonly(results),
    errors: readonly(errors),
    pending: readonly(pending),
    addOperation,
    executeAll,
    reset,
  };
};
