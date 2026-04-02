<script setup lang="ts">
import type { ApiErrorResponse, ApiSuccessResponse } from "~/types/api";
import type { FetchError } from "ofetch";
const { setFlash } = useFlash();
const { isReady, login } = useGoogleReg();
const title = "Sign Up";
definePageMeta({
  layout: "auth",
});

useHead({
  title: title,
});

const toastRef = ref();

const dataForm = reactive({
  name: "",
  username: "",
  email: "",
  password: "",
});

const eye = ref(false);
const errors = ref<Record<string, string>>({});
const msgs = ref<string>("");

const onSubmit = async () => {
  try {
    errors.value = {};
    msgs.value = "";
    const res = await $fetch<ApiSuccessResponse<string>>("auth/register", {
      method: "POST",
      body: dataForm,
      baseURL: "http://localhost:3050/api/",
    });

    setFlash(res.message, "success");
    navigateTo("/sign-in");
  } catch (err) {
    const e = err as FetchError<ApiErrorResponse>;

    const res = e?.data;
    if (res?.errors) {
      errors.value = res.errors;
      Object.values(errors.value).forEach((msg) => {
        msgs.value = `${msgs.value} ${msg} <br />`;
      });
      msgs.value = msgs.value.substring(0, msgs.value.length - 6);
    } else if (res?.error) {
      // errors.value = { general: res.error };
      msgs.value = res.error;
    } else if (res?.message) {
      // errors.value = { general: res.message };
      msgs.value = res.message;
    } else {
      // errors.value = { general: "Terjadi kesalahan" };
      msgs.value = "Terjadi kesalahan";
    }
    // setFlash(msgs.value, "warning");
    // console.log(error);
    // setFlash(error?.response._data.error, "warning");
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
        <form autocomplete="off" novalidate @submit.prevent="onSubmit">
          <h2 class="card-title text-center mb-4">Create new account</h2>
          <div class="mb-3">
            <label class="form-label">Name</label>
            <input
              v-model="dataForm.name"
              type="text"
              class="form-control"
              placeholder="Enter name"
            />
            <span
              v-if="errors.Name"
              class="text-danger error-text"
              v-text="errors.Name"
            ></span>
          </div>
          <div class="mb-3">
            <label class="form-label">Username</label>
            <input
              v-model="dataForm.username"
              type="text"
              class="form-control"
              placeholder="Enter username"
            />
            <span
              v-if="errors.Username"
              class="text-danger error-text"
              v-text="errors.Username"
            ></span>
          </div>
          <div class="mb-3">
            <label class="form-label">Email address</label>
            <input
              v-model="dataForm.email"
              type="email"
              class="form-control"
              placeholder="Enter email"
            />
            <span
              v-if="errors.Email"
              class="text-danger error-text"
              v-text="errors.Email"
            ></span>
          </div>
          <div class="mb-3">
            <label class="form-label">Password</label>
            <div class="input-group input-group-flat">
              <input
                v-model="dataForm.password"
                :type="eye ? 'text' : 'password'"
                class="form-control"
                placeholder="Password"
                autocomplete="off"
              />
              <span class="input-group-text text-center">
                <a
                  href="#"
                  class="link-secondary"
                  title="Show password"
                  data-bs-toggle="tooltip"
                  style="vertical-align: middle"
                  @click="eye = !eye"
                >
                  <svg
                    v-if="eye"
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
                    <path d="M10.585 10.587a2 2 0 0 0 2.829 2.828" />
                    <path
                      d="M16.681 16.673A8.7 8.7 0 0 1 12 18q-5.4 0-9-6q1.908-3.18 4.32-4.674m2.86-1.146A9 9 0 0 1 12 6q5.4 0 9 6q-1 1.665-2.138 2.87M3 3l18 18"
                    />
                  </svg>
                  <svg
                    v-else
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
            <span
              v-if="errors.Password"
              class="text-danger error-text"
              v-text="errors.Password"
            ></span>
          </div>
          <!-- <div class="mb-3">
            <label class="form-check">
              <input type="checkbox" class="form-check-input" />
              <span class="form-check-label"
                >Agree the
                <a href="./terms-of-service.html" tabindex="-1"
                  >terms and policy</a
                >.</span
              >
            </label>
          </div> -->
          <div class="form-footer">
            <button type="submit" class="btn btn-primary w-100">
              Create new account
            </button>
          </div>
        </form>
      </div>
      <div class="hr-text">or</div>
      <div class="card-body">
        <div class="row">
          <div class="col">
            <a
              href="#"
              class="btn btn-4 w-100"
              :disabled="!isReady"
              @click="login()"
            >
              <Icon name="i-tabler:brand-google" class="me-2 fs-2" />
              Sign up with Gmail
            </a>
          </div>
        </div>
      </div>
    </div>
    <div class="text-center text-secondary mt-3">
      Already have account?
      <NuxtLink to="/sign-in" tabindex="-1">Sign in</NuxtLink>
    </div>
    <ui-toast ref="toastRef" />
  </div>
</template>
