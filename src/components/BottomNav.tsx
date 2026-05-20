import { Home, Send, MapPin, Settings } from "lucide-react";

export type TabKey = "home" | "send" | "places" | "more";

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "home", label: "Home", icon: Home },
  { key: "send", label: "Send", icon: Send },
  { key: "places", label: "Places", icon: MapPin },
  { key: "more", label: "More", icon: Settings },
];

export function BottomNav({ active, onChange }: { active: TabKey; onChange: (t: TabKey) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t bg-white/95 dark:bg-slate-950/95 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-4">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = t.key === active;
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition ${
                isActive ? "text-blue-600" : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "scale-110" : ""}`} />
              {t.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}