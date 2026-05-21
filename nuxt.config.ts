// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  modules: [
    "@nuxt/eslint",
    "@nuxt/fonts",
    "@nuxt/icon",
    "@nuxt/test-utils",
    "@nuxt/scripts",
    "@nuxt/image",
    "@pinia/nuxt",
  ],
  // image: {
  //   provider: "ipx",
  //   ipx: {
  //     sharpOptions: {
  //       animated: true,
  //     },
  //   },
  // },
  image: {
    provider: 'none'
  },
  plugins: [
    // { src: "~/plugins/litepicker/dist/js/main.js", mode: "client" },
    // { src: "litepicker/dist/litepicker.js", mode: "client" },
    // { src: "~/plugins/tabler.min.js", mode: "client" },
  ],
  app: {
    head: {
      meta: [
        // <meta name="viewport" content="width=device-width, initial-scale=1">
        { name: "viewport", content: "width=device-width, initial-scale=1" },
      ],
      link: [
        {
          rel: "stylesheet",
          href: "https://cdn.jsdelivr.net/npm/@tabler/core@1.0.0/dist/css/tabler.min.css",
          // href: "https://cdn.jsdelivr.net/npm/@tabler/core@1.4.0/dist/css/tabler.min.css",
        },
        // <link rel="stylesheet" href="https://myawesome-lib.css">
        // {
        //   rel: "stylesheet",
        //   href: "/vendor/dist/css/tabler.min.css",
        // },
        {
          rel: "stylesheet",
          href: "/vendor/dist/libs/litepicker/dist/css/litepicker.css",
        },
        // {
        //   rel: "stylesheet",
        //   href: "https://rsms.me/inter/inter.css",
        // },
      ],
      script: [
        // <script src="https://myawesome-lib.js"></script>
        // {
        //   src: "https://cdnjs.cloudflare.com/ajax/libs/litepicker/2.0.12/litepicker.js",
        // },
        {
          // src: "https://cdn.jsdelivr.net/npm/@tabler/core@1.4.0/dist/js/tabler.min.js",
          src: "https://cdn.jsdelivr.net/npm/@tabler/core@1.0.0/dist/js/tabler.min.js",
        },
        // {
        //   src: "/vendor/dist/js/tabler.min.js",
        // },
        {
          src: "/vendor/dist/libs/litepicker/dist/js/main.js",
          // src: "/vendor/dist/libs/litepicker/dist/litepicker.js",
        },
        // {
        //   src: "https://cdnjs.cloudflare.com/ajax/libs/autonumeric/4.8.1/autoNumeric.min.js",
        // },
      ],
    },
  },
  // css: ["datatables.net-bs5/css/dataTables.bootstrap5.css"],
  css: [
    // "~/plugins/litepicker/dist/css/litepicker.css",
    // "~/assets/css/tabler.min.css",
    // "~/assets/css/tabler-flags.min.css",
    // "~/assets/css/tabler-socials.min.css",
    // "~/assets/css/tabler-payments.min.css",
    // "~/assets/css/tabler-vendors.min.css",
  ],
  experimental: {
    asyncContext: true,
    defaults: {
      nuxtLink: {
        activeClass: "active",
        exactActiveClass: "",
      },
    },
  },
  vue: {
    compilerOptions: {
      isCustomElement: (tag) => tag.startsWith("cropper-"),
    },
  },
  runtimeConfig: {
    public: {
      apiUrl: "http://localhost:3050/api",
    },
  }
});
