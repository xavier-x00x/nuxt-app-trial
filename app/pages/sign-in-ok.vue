<script setup lang="ts">
const { loading, login } = useAuth();
const { setFlash } = useFlash();
const title = "Sign In";
definePageMeta({
  layout: "auth",
});

useHead({ title });

const dataForm = reactive({
  email: "",
  password: "",
  remember: false,
});

const res = ref<string>("");

const onSubmit = async () => {
  try {
    await login(dataForm.email, dataForm.password, dataForm.remember);
    navigateTo("/");
  } catch (error) {
    console.log(error);
    setFlash("Gagal login", "warning");
  }
};
</script>
<template>
  <div class="container-tight">
    <div class="text-center mb-2">
      <a href="." class="navbar-brand navbar-brand-autodark">
        <h2 class="h2 text-center mb-0">
          <img
            src="/vendor/img/D33.png"
            alt="Tabler"
            style="height: 35px"
            class="bg-green-lt border border-green-lt rounded-3 me-2"
          />
          <strong>Admin Panel</strong>
        </h2>
      </a>
    </div>
    <div class="card card-md">
      <div class="card-body">
        <h2 class="h2 text-center mb-4">Login to your account</h2>
        <form autocomplete="off" novalidate @submit.prevent="onSubmit">
          <div class="mb-3">
            <label class="form-label">Email</label>
            <input
              v-model="dataForm.email"
              type="email"
              class="form-control"
              placeholder="Email"
            />
          </div>
          <div class="mb-2">
            <label class="form-label">
              Password
              <!-- <span class="form-label-description">
                <a href="#">I forgot password</a>
              </span> -->
            </label>
            <div class="input-group input-group-flat">
              <input
                v-model="dataForm.password"
                type="password"
                class="form-control"
                placeholder="Your password"
                autocomplete="off"
              />
              <span class="input-group-text">
                <a
                  href="#"
                  class="link-secondary"
                  title="Show password"
                  data-bs-toggle="tooltip"
                >
                  <!-- Download SVG icon from http://tabler.io/icons/icon/eye -->
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="icon icon-1"
                  >
                    <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                    <path
                      d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6"
                    />
                  </svg>
                </a>
              </span>
            </div>
          </div>
          <div class="mb-2">
            <label class="form-check">
              <input
                v-model="dataForm.remember"
                type="checkbox"
                class="form-check-input"
              />
              <span class="form-check-label">Remember me on this device</span>
            </label>
          </div>
          <div class="form-footer">
            <button
              :disabled="loading"
              type="submit"
              class="btn btn-primary w-100"
            >
              {{ loading ? "Loading..." : "Sign in" }}
            </button>
          </div>
        </form>
      </div>
      <div class="hr-text">or</div>
      <div class="card-body">
        <div class="row">
          <div class="col">
            <ui-google-sign-in v-model="res" :remember="dataForm.remember" />
          </div>
        </div>
      </div>
    </div>
    <div class="text-center text-secondary my-3">
      Don't have account yet?
      <NuxtLink to="/sign-up" tabindex="-1">Sign up</NuxtLink>
    </div>
  </div>
</template>
