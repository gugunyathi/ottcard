import { useState } from "react";
import { Palette, Star, Repeat, Trash2, Plus, Check, Pause, Play, User, Pencil } from "lucide-react";
import { useWallet, formatZAR, CARD_THEMES, type CardTheme, type SubInterval } from "@/lib/wallet-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { usePWAInstall } from "@/components/PWAInstall";
import { Download } from "lucide-react";
import { toast } from "sonner";

export function MoreTab() {
  const w = useWallet();
  const pwa = usePWAInstall();
  const [subOpen, setSubOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  return (
    <div className="space-y-6">
      <Section title="Account" icon={<User className="h-4 w-4" />}>
        <div className="flex items-center gap-3 rounded-xl border bg-white dark:bg-slate-900 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white">
            {w.profile.initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate">{w.profile.name}</div>
            <div className="text-[11px] text-muted-foreground truncate">{w.profile.email}</div>
          </div>
          <Button size="sm" variant="outline" onClick={() => setEditProfileOpen(true)}>
            <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
          </Button>
        </div>
      </Section>

      <Section title="Card theme" icon={<Palette className="h-4 w-4" />}>
        <div className="grid grid-cols-3 gap-2">
          {(Object.entries(CARD_THEMES) as [CardTheme, { label: string; gradient: string }][]).map(
            ([key, t]) => {
              const active = w.cardTheme === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    w.setCardTheme(key);
                    toast.success(`${t.label} theme applied`);
                  }}
                  className={`relative rounded-xl p-3 text-left text-white shadow-sm ring-2 transition ${
                    active ? "ring-blue-600" : "ring-transparent"
                  }`}
                  style={{ background: t.gradient, aspectRatio: "1.586/1" }}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider">{t.label}</div>
                  {active && (
                    <Check className="absolute right-1.5 top-1.5 h-4 w-4 rounded-full bg-white/30 p-0.5" />
                  )}
                </button>
              );
            },
          )}
        </div>
      </Section>

      <Section title="Favorite merchants" icon={<Star className="h-4 w-4" />}>
        {w.favorites.length === 0 ? (
          <Empty text="No favorites yet. Save them from Places." />
        ) : (
          <div className="space-y-2">
            {w.favorites.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between rounded-xl border bg-white dark:bg-slate-900 p-3"
              >
                <div>
                  <div className="text-sm font-semibold">{f.name}</div>
                  {f.category && (
                    <div className="text-[11px] text-muted-foreground">{f.category}</div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast.info(`Use Spend → Tap/Scan/PIN to pay ${f.name}`)}
                  >
                    Pay
                  </Button>
                  <button
                    onClick={() => w.removeFavorite(f.id)}
                    className="p-2 text-muted-foreground hover:text-red-600"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Recurring payments"
        icon={<Repeat className="h-4 w-4" />}
        action={
          <button
            onClick={() => setSubOpen(true)}
            className="flex items-center gap-1 text-xs font-medium text-blue-600"
          >
            <Plus className="h-3.5 w-3.5" /> New
          </button>
        }
      >
        {w.subscriptions.length === 0 ? (
          <Empty text="No subscriptions. Add one to track recurring spend." />
        ) : (
          <div className="space-y-2">
            {w.subscriptions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-xl border bg-white dark:bg-slate-900 p-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{s.merchant}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {formatZAR(s.amount)} • {s.interval} • next {new Date(s.nextDue).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => w.toggleSubscription(s.id)}
                    className="p-2 text-muted-foreground hover:text-blue-600"
                    aria-label={s.active ? "Pause" : "Resume"}
                  >
                    {s.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => w.removeSubscription(s.id)}
                    className="p-2 text-muted-foreground hover:text-red-600"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Preferences" icon={<Palette className="h-4 w-4" />}>
        <ThemeToggle />
        {pwa.available && (
          <button
            onClick={pwa.prompt}
            className="mt-2 flex items-center justify-between w-full rounded-xl border bg-white dark:bg-slate-900 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <span className="flex items-center gap-3 text-sm font-medium">
              <Download className="h-4 w-4" /> Install app
            </span>
            <span className="text-xs text-blue-600 font-semibold">Add to home</span>
          </button>
        )}
        {pwa.installed && (
          <div className="mt-2 rounded-xl border bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-sm">
            <span className="font-medium text-emerald-700 dark:text-emerald-300">
              ✓ Installed on this device
            </span>
          </div>
        )}
      </Section>

      <AddSubDialog open={subOpen} onOpenChange={setSubOpen} />
    </div>
  );
}

function Section({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {icon} {title}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border bg-white dark:bg-slate-900 py-6 text-center text-xs text-muted-foreground">
      {text}
    </div>
  );
}

function AddSubDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
}) {
  const w = useWallet();
  const [merchant, setMerchant] = useState("");
  const [amt, setAmt] = useState("");
  const [interval, setInterval] = useState<SubInterval>("monthly");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New recurring payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Merchant</Label>
            <Input value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="Netflix, Spotify…" />
          </div>
          <div>
            <Label className="text-xs">Amount (R)</Label>
            <Input
              inputMode="decimal"
              value={amt}
              onChange={(e) => setAmt(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label className="text-xs">Frequency</Label>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {(["weekly", "monthly", "yearly"] as SubInterval[]).map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setInterval(i)}
                  className={`rounded-md border py-2 text-xs font-semibold capitalize ${
                    interval === i
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 bg-white dark:bg-slate-900"
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!merchant || !parseFloat(amt)}
            onClick={() => {
              w.addSubscription(merchant, parseFloat(amt), interval);
              setMerchant("");
              setAmt("");
              onOpenChange(false);
              toast.success("Subscription added");
            }}
          >
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}