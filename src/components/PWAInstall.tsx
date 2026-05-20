import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "ott-pwa-dismissed";

export function usePWAInstall() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onBIP = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    if (window.matchMedia?.("(display-mode: standalone)").matches) setInstalled(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const prompt = async () => {
    if (!evt) return;
    await evt.prompt();
    await evt.userChoice;
    setEvt(null);
  };

  return { available: !!evt && !installed, installed, prompt };
}

export function PWAInstallBanner() {
  const { available, prompt } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (!available || dismissed) return null;
  return (
    <div className="mx-auto mt-4 flex max-w-md items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/40 dark:border-blue-900 px-4 py-3">
      <div className="flex items-center gap-2 text-sm">
        <Download className="h-4 w-4 text-blue-600" />
        <div>
          <div className="font-semibold">Install OTT Card</div>
          <div className="text-[11px] text-muted-foreground">Add to home screen for fast access</div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button size="sm" onClick={prompt}>Install</Button>
        <button
          aria-label="Dismiss"
          className="p-1 text-muted-foreground hover:text-foreground"
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, "1");
            setDismissed(true);
          }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}