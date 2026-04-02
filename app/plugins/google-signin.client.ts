import GoogleSignInPlugin from "vue3-google-signin";

export default defineNuxtPlugin((nuxtApp) => {
  // const config = useRuntimeConfig();
  nuxtApp.vueApp.use(GoogleSignInPlugin, {
    // clientId: config.public.googleClientId,
    clientId:
      "1018288769431-3tq34tlljm71m3bb73os6vuv0j0f6c15.apps.googleusercontent.com",
  });
});
