export const useTheme = () => {
  const theme = useCookie<"light" | "dark">("theme", {
    default: () => "light",
    path: "/",
  });

  const setTheme = (value: "light" | "dark") => {
    theme.value = value;
    if (import.meta.client) {
      document.documentElement.setAttribute("data-bs-theme", value);
      useHead({
        htmlAttrs: {
          "data-bs-theme": theme.value,
        },
      });
    }
  };

  const toggleTheme = () => {
    const newTheme = theme.value === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  const applyTheme = () => {
    if (import.meta.client) {
      document.documentElement.setAttribute("data-bs-theme", theme.value);
    }
  };

  return { theme, setTheme, toggleTheme, applyTheme };
};
