export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore();
  const { setFlash } = useFlash();

  if (!auth.getAccessToken) {
    if (import.meta.server) {
      // load refresh token di ssr
      // console.log(useCookie("refreshToken").value);
      auth.loadRefreshToken();
      await auth.setAccessToken();
    }
  }

  if (!auth.getAccessToken && to.path !== "/sign-in3") {
    console.log("belum login");
    return navigateTo("/sign-in");
  }

  if (import.meta.server) return; // jangan dijalankan di server

  const paths = ["/sign-in3", "/sign-up"];
  if (paths.includes(to.path)) {
    if (auth.isAuthenticated) {
      // agar logout tidak dilakukan 2 kali
      await auth.logout();
    }
    return;
  }

  if (!auth.isAuthenticated) {
    // set user kalau belum ada
    await auth.fetchUser();
    // fetch user sudah termasuk refresh access token
  }

  // bila token / user masih belum ada, redirect ke halaman login
  if (!auth.isAuthenticated) {
    // console.log("belum login");
    return navigateTo("/sign-in3");
  }

  // Panggil backend untuk cek akses
  const res = await auth.checkAccess(to.path);
  if (!res) {
    if (to.path === "/") {
      setFlash("Anda belum memiliki akses", "warning");
      return navigateTo("/sign-in");
    }
    setFlash(
      `(404) Anda tidak memiliki akses ke halaman ${to.path}`,
      "warning"
    );
    return navigateTo("/");
  }
});
