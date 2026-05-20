import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const KEY = "ott-theme";

export function useDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem(KEY);
    const initial = stored ? stored === "dark" : window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    setDark(!!initial);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem(KEY, dark ? "dark" : "light");
  }, [dark]);
  return { dark, setDark, toggle: () => setDark((d) => !d) };
}

export function ThemeToggle() {
  const { dark, toggle } = useDarkMode();
  return (
    <button
      onClick={toggle}
      className="flex items-center justify-between w-full rounded-xl border bg-white dark:bg-slate-900 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800"
    >
      <span className="flex items-center gap-3 text-sm font-medium">
        {dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        Dark mode
      </span>
      <span
        className={`relative h-6 w-11 rounded-full transition ${
          dark ? "bg-blue-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
            dark ? "left-5" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}