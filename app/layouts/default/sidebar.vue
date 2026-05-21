<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
const auth = useAuthStore();
</script>

<template>
  <!-- Sidebar -->
  <aside class="navbar navbar-vertical navbar-expand-lg" data-bs-theme="dark">
    <div class="container-fluid">
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#sidebar-menu"
        aria-controls="sidebar-menu"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon" />
      </button>
      <div class="navbar-brand navbar-brand-autodark">
        <!-- <a href="."> -->
        <h2 class="h2 text-center align-middle mb-0">
          <NuxtImg
            src="/vendor/img/D33.png"
            width="30"
            height="30"
            alt="Logo"
            class="bg-green-lt border border-green-lt rounded-3"
          />
          Admin Panel
        </h2>
        <!-- </a> -->
      </div>
      <div class="navbar-nav flex-row d-lg-none">
        <div class="nav-item dropdown">
          <a
            href="#"
            class="nav-link d-flex lh-1 text-reset p-0"
            data-bs-toggle="dropdown"
            aria-label="Open user menu"
          >
            <span class="avatar avatar-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
              >
                <g
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1"
                >
                  <path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0" />
                  <path
                    d="M9 10a3 3 0 1 0 6 0a3 3 0 1 0-6 0m-2.832 8.849A4 4 0 0 1 10 16h4a4 4 0 0 1 3.834 2.855"
                  />
                </g>
              </svg>
            </span>
          </a>
          <div class="dropdown-menu dropdown-menu-end dropdown-menu-arrow">
            <a href="#" class="dropdown-item">Status</a>
            <a href="./profile.html" class="dropdown-item">Profile</a>
            <a href="#" class="dropdown-item">Feedback</a>
            <div class="dropdown-divider"></div>
            <a href="./settings.html" class="dropdown-item">Settings</a>
            <a href="./sign-in.html" class="dropdown-item">Logout</a>
          </div>
        </div>
      </div>
      <div id="sidebar-menu" class="collapse navbar-collapse">
        <ul class="navbar-nav pt-lg-3">
          <template v-for="item in auth.menus" :key="item.title">
            <UiNavItem :to="item.to" :icon="item.icon" :title="item.title" />
          </template>
          <!-- example with dropdown menu -->
          <li class="nav-item dropdown">
            <a
              class="nav-link dropdown-toggle"
              href="#navbar-base"
              data-bs-toggle="dropdown"
              data-bs-auto-close="false"
              role="button"
              aria-expanded="false"
            >
              <span class="nav-link-icon d-md-none d-lg-inline-block">
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
                  class="icon icon-tabler icons-tabler-outline icon-tabler-package"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M12 3l8 4.5l0 9l-8 4.5l-8 -4.5l0 -9l8 -4.5" />
                  <path d="M12 12l8 -4.5" />
                  <path d="M12 12l0 9" />
                  <path d="M12 12l-8 -4.5" />
                  <path d="M16 5.25l-8 4.5" />
                </svg>
              </span>
              <span class="nav-link-title"> Interface </span>
            </a>
            <div class="dropdown-menu">
              <div class="dropdown-menu-columns">
                <div class="dropdown-menu-column">
                  <a class="dropdown-item" href="./accordion.html">
                    Accordion
                  </a>
                  <a class="dropdown-item" href="./alerts.html"> Alerts </a>
                  <div class="dropend">
                    <a
                      class="dropdown-item dropdown-toggle"
                      href="#sidebar-authentication"
                      data-bs-toggle="dropdown"
                      data-bs-auto-close="false"
                      role="button"
                      aria-expanded="false"
                    >
                      Authentication
                    </a>
                    <div class="dropdown-menu">
                      <a href="./sign-in.html" class="dropdown-item">
                        Sign in
                      </a>
                      <a href="./sign-in-link.html" class="dropdown-item">
                        Sign in link
                      </a>
                      <a
                        href="./sign-in-illustration.html"
                        class="dropdown-item"
                      >
                        Sign in with illustration
                      </a>
                      <a href="./sign-in-cover.html" class="dropdown-item">
                        Sign in with cover
                      </a>
                      <a href="./sign-up.html" class="dropdown-item">
                        Sign up
                      </a>
                      <a href="./forgot-password.html" class="dropdown-item">
                        Forgot password
                      </a>
                      <a href="./terms-of-service.html" class="dropdown-item">
                        Terms of service
                      </a>
                      <a href="./auth-lock.html" class="dropdown-item">
                        Lock screen
                      </a>
                      <a
                        href="./2-step-verification.html"
                        class="dropdown-item"
                      >
                        2 step verification
                      </a>
                      <a
                        href="./2-step-verification-code.html"
                        class="dropdown-item"
                      >
                        2 step verification code
                      </a>
                    </div>
                  </div>
                  <a class="dropdown-item" href="./badges.html">
                    Badges
                    <span
                      class="badge badge-sm bg-green-lt text-uppercase ms-auto"
                    >New</span>
                  </a>
                  <a class="dropdown-item" href="./blank.html"> Blank page </a>
                  <a class="dropdown-item" href="./buttons.html"> Buttons </a>
                  <div class="dropend">
                    <a
                      class="dropdown-item dropdown-toggle"
                      href="#sidebar-cards"
                      data-bs-toggle="dropdown"
                      data-bs-auto-close="false"
                      role="button"
                      aria-expanded="false"
                    >
                      Cards
                      <span
                        class="badge badge-sm bg-green-lt text-uppercase ms-auto"
                      >New</span>
                    </a>
                    <div class="dropdown-menu">
                      <a href="./cards.html" class="dropdown-item">
                        Sample cards
                      </a>
                      <a href="./card-actions.html" class="dropdown-item">
                        Card actions
                        <span
                          class="badge badge-sm bg-green-lt text-uppercase ms-auto"
                        >New</span>
                      </a>
                      <a href="./cards-masonry.html" class="dropdown-item">
                        Cards Masonry
                      </a>
                    </div>
                  </div>
                  <a class="dropdown-item" href="./carousel.html">
                    Carousel
                    <span
                      class="badge badge-sm bg-green-lt text-uppercase ms-auto"
                    >New</span>
                  </a>
                  <a class="dropdown-item" href="./charts.html"> Charts </a>
                  <a class="dropdown-item" href="./colorpicker.html">
                    Color picker
                    <span
                      class="badge badge-sm bg-green-lt text-uppercase ms-auto"
                    >New</span>
                  </a>
                  <a class="dropdown-item" href="./colors.html"> Colors </a>
                  <a class="dropdown-item" href="./datagrid.html">
                    Data grid
                    <span
                      class="badge badge-sm bg-green-lt text-uppercase ms-auto"
                    >New</span>
                  </a>
                  <a class="dropdown-item" href="./datatables.html">
                    Datatables
                    <span
                      class="badge badge-sm bg-green-lt text-uppercase ms-auto"
                    >New</span>
                  </a>
                  <a class="dropdown-item" href="./dropdowns.html">
                    Dropdowns
                  </a>
                  <a class="dropdown-item" href="./dropzone.html">
                    Dropzone
                    <span
                      class="badge badge-sm bg-green-lt text-uppercase ms-auto"
                    >New</span>
                  </a>
                  <div class="dropend">
                    <a
                      class="dropdown-item dropdown-toggle"
                      href="#sidebar-error"
                      data-bs-toggle="dropdown"
                      data-bs-auto-close="false"
                      role="button"
                      aria-expanded="false"
                    >
                      Error pages
                    </a>
                    <div class="dropdown-menu">
                      <a href="./error-404.html" class="dropdown-item">
                        404 page
                      </a>
                      <a href="./error-500.html" class="dropdown-item">
                        500 page
                      </a>
                      <a href="./error-maintenance.html" class="dropdown-item">
                        Maintenance page
                      </a>
                    </div>
                  </div>
                  <a class="dropdown-item" href="./flags.html">
                    Flags
                    <span
                      class="badge badge-sm bg-green-lt text-uppercase ms-auto"
                    >New</span>
                  </a>
                  <a class="dropdown-item" href="./inline-player.html">
                    Inline player
                    <span
                      class="badge badge-sm bg-green-lt text-uppercase ms-auto"
                    >New</span>
                  </a>
                  <a class="dropdown-item" href="./lightbox.html">
                    Lightbox
                    <span
                      class="badge badge-sm bg-green-lt text-uppercase ms-auto"
                    >New</span>
                  </a>
                </div>
                <div class="dropdown-menu-column">
                  <a class="dropdown-item" href="./lists.html"> Lists </a>
                  <a class="dropdown-item" href="./modals.html"> Modal </a>
                  <a class="dropdown-item" href="./maps.html"> Map </a>
                  <a class="dropdown-item" href="./map-fullsize.html">
                    Map fullsize
                  </a>
                  <a class="dropdown-item" href="./maps-vector.html">
                    Map vector
                    <span
                      class="badge badge-sm bg-green-lt text-uppercase ms-auto"
                    >New</span>
                  </a>
                  <a class="dropdown-item" href="./markdown.html"> Markdown </a>
                  <a class="dropdown-item" href="./navigation.html">
                    Navigation
                  </a>
                  <a class="dropdown-item" href="./offcanvas.html">
                    Offcanvas
                  </a>
                  <a class="dropdown-item" href="./pagination.html">
                    Pagination
                  </a>
                  <a class="dropdown-item" href="./placeholder.html">
                    Placeholder
                  </a>
                  <a class="dropdown-item" href="./social-icons.html">
                    Social icons
                    <span
                      class="badge badge-sm bg-green-lt text-uppercase ms-auto"
                    >New</span>
                  </a>
                  <a class="dropdown-item" href="./stars-rating.html">
                    Stars rating
                    <span
                      class="badge badge-sm bg-green-lt text-uppercase ms-auto"
                    >New</span>
                  </a>
                  <a class="dropdown-item" href="./steps.html">
                    Steps
                    <span
                      class="badge badge-sm bg-green-lt text-uppercase ms-auto"
                    >New</span>
                  </a>
                  <a class="dropdown-item" href="./tables.html"> Tables </a>
                  <a class="dropdown-item" href="./tabs.html"> Tabs </a>
                  <a class="dropdown-item" href="./tags.html"> Tags </a>
                  <a class="dropdown-item" href="./tinymce.html">
                    TinyMCE
                    <span
                      class="badge badge-sm bg-green-lt text-uppercase ms-auto"
                    >New</span>
                  </a>
                  <a class="dropdown-item" href="./toasts.html"> Toasts </a>
                  <a class="dropdown-item" href="./typography.html">
                    Typography
                  </a>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </aside>
</template>
