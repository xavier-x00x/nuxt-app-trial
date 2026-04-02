import type { ApiErrorResponse } from "~/types/api";
import type { FetchError } from "ofetch";
export function useAuth() {
  const url = "http://localhost:3050/api/";
  const user = useState<unknown>("auth_user", () => null);
  const accessToken = useState<string | null>("access_token", () => null);
  const loading = useState<boolean>("auth_loading", () => false);
  const refreshToken = useCookie("refresh_token");

  const getRefreshToken = () => {
    return refreshToken.value ? refreshToken.value : null;
  };
  const setRefreshToken = (token: string | null, rememberMe = false) => {
    if (!import.meta.client) return;
    if (token) {
      useCookie("refresh_token", {
        default: () => token,
        path: "/",
        ...(rememberMe ? { maxAge: 60 * 60 * 24 * 30 * 6 } : {}), // 6 bulan atau session
      });
    } else {
      refreshToken.value = null;
    }
  };

  const login = async (email: string, password: string, rememberMe = false) => {
    try {
      loading.value = true;
      const res = await $fetch<{ access_token: string; refreshToken: string }>(
        `${url}auth/login`,
        {
          method: "POST",
          body: { email, password },
        }
      );
      accessToken.value = res.access_token;
      setRefreshToken(res.refreshToken, rememberMe);
      await fetchUser();
      return false;
    } catch (error) {
      loading.value = false;
      const e = error as FetchError<ApiErrorResponse>;

      const res = e?.data;
      if (res?.error) {
        return res.error;
      } else {
        return "Terjadi kesalahan";
      }
    }
  };

  const glogin = async (access_token: string, rememberMe = false) => {
    try {
      loading.value = true;
      const res = await $fetch<{ access_token: string; refreshToken: string }>(
        `${url}auth/google`,
        {
          method: "POST",
          body: { access_token: access_token },
        }
      );
      accessToken.value = res.access_token;
      setRefreshToken(res.refreshToken, rememberMe);
      await fetchUser();
      return false;
    } catch (error) {
      loading.value = false;
      const e = error as FetchError<ApiErrorResponse>;

      const res = e?.data;
      if (res?.error) {
        return res.error;
      } else {
        return "Terjadi kesalahan";
      }
    }
  };

  // perbarui access token
  const refreshAccessToken = async () => {
    const refresh = getRefreshToken();
    if (!refresh) return false;

    try {
      const res = await $fetch<{
        access_token: string;
        refresh_token?: string;
      }>(`${url}auth/refresh`, {
        method: "POST",
        body: { refreshToken: refresh },
      });
      accessToken.value = res.access_token;
      // Update refresh token hanya kalau server kirim
      if (res.refresh_token) {
        refreshToken.value = res.refresh_token;
      }
      return true;
    } catch {
      logout();
      return false;
    }
  };

  const fetchUser = async () => {
    if (!accessToken.value) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) return;
    }

    try {
      const data = await $fetch(`${url}auth/me`, {
        headers: { Authorization: `Bearer ${accessToken.value}` },
      });
      user.value = data;
    } catch {
      user.value = null;
    }
  };

  const logout = () => {
    if (import.meta.client) {
      accessToken.value = null;
      user.value = null;
      loading.value = false;
      useCookie("refresh_token", {
        path: "/",
        maxAge: -1,
      });
      navigateTo("/sign-in");
    }
  };

  const checkAccess = async (path: string) => {
    if (!accessToken.value) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) return false;
    }

    const doCheck = async (): Promise<boolean> => {
      const res = await $fetch<{ allowed: boolean }>(
        `${url}autorization/check-access`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken.value}` },
          body: { path },
        }
      );
      return res.allowed;
    };

    try {
      return await doCheck();
    } catch {
      // Jika gagal, coba refresh token dan ulangi
      const refreshed = await refreshAccessToken();
      if (!refreshed) return false;

      try {
        return await doCheck();
      } catch {
        return false;
      }
    }
  };

  return {
    loading,
    user,
    accessToken,
    login,
    glogin,
    logout,
    fetchUser,
    refreshAccessToken,
    checkAccess,
  };
}
