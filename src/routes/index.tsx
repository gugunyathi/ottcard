import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bell,
  Plus,
  Wifi,
  QrCode,
  KeyRound,
  ArrowDownToLine,
  Check,
  X,
  Copy,
  History,
  Trash2,
  CreditCard,
  Apple,
  Smartphone,
  Ticket,
  Loader2,
  Fingerprint,
} from "lucide-react";
import { VirtualCard } from "@/components/VirtualCard";
import { useWallet, formatZAR, type Tx } from "@/lib/wallet-store";
import { BottomNav, type TabKey } from "@/components/BottomNav";
import { SendTab } from "@/components/tabs/SendTab";
import { PlacesTab } from "@/components/tabs/PlacesTab";
import { MoreTab } from "@/components/tabs/MoreTab";
import { PWAInstallBanner } from "@/components/PWAInstall";
import { useDarkMode } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Toaster, toast } from "sonner";

export const Route = createFileRoute("/")({
  component: Index,
});

type SpendMethod = "tap" | "scan" | "pin";

function Index() {
  const w = useWallet();
  useDarkMode();
  const [tab, setTab] = useState<TabKey>("home");
  const [topupOpen, setTopupOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [spendMethod, setSpendMethod] = useState<SpendMethod | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [pinResult, setPinResult] = useState<{ pin: string; amount: number } | null>(null);

  const unread = w.notifs.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 dark:text-slate-100 pb-24">
      <Toaster position="top-center" richColors />
      {/* App header */}
      <header className="sticky top-0 z-10 border-b bg-white/85 dark:bg-slate-950/85 dark:border-slate-800 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <div>
            <div className="text-xs text-muted-foreground">Welcome</div>
            <div className="text-sm font-semibold">
              {tab === "home" ? "OTT Virtual Card" : tab === "send" ? "Send money" : tab === "places" ? "Merchants" : "More"}
            </div>
          </div>
          <button
            onClick={() => {
              setNotifOpen(true);
              w.markAllRead();
            }}
            className="relative rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pt-6">
        <PWAInstallBanner />
        {tab === "home" && (
          <>
        <VirtualCard balance={w.balance} theme={w.cardTheme} />

        {/* Primary actions */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <ActionTile
            label="Top up"
            icon={<Plus className="h-5 w-5" />}
            onClick={() => setTopupOpen(true)}
            primary
          />
          <ActionTile
            label="Withdraw"
            icon={<ArrowDownToLine className="h-5 w-5" />}
            onClick={() => setWithdrawOpen(true)}
          />
        </div>

        <div className="mt-6">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Spend
          </div>
          <div className="grid grid-cols-3 gap-3">
            <ActionTile
              label="Tap"
              icon={<Wifi className="h-5 w-5 rotate-90" />}
              onClick={() => setSpendMethod("tap")}
              compact
            />
            <ActionTile
              label="Scan"
              icon={<QrCode className="h-5 w-5" />}
              onClick={() => setSpendMethod("scan")}
              compact
            />
            <ActionTile
              label="PIN"
              icon={<KeyRound className="h-5 w-5" />}
              onClick={() => setSpendMethod("pin")}
              compact
            />
          </div>
        </div>

        {/* Activity preview */}
        <div className="mt-8">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Recent activity
            </div>
            <button
              onClick={() => setHistoryOpen(true)}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              See all
            </button>
          </div>
          <div className="rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-800">
            {w.txs.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
                <History className="h-6 w-6 opacity-50" />
                No transactions yet
              </div>
            ) : (
              w.txs.slice(0, 5).map((t) => <TxRow key={t.id} t={t} />)
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          Spend your OTT Voucher anywhere it's accepted. Drop spent PINs on the OTT App for
          rewards.
        </p>

        {w.txs.length > 0 && (
          <button
            onClick={() => {
              if (confirm("Reset wallet?")) w.reset();
            }}
            className="mx-auto mt-4 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-red-600"
          >
            <Trash2 className="h-3 w-3" /> Reset demo wallet
          </button>
        )}
          </>
        )}

        {tab === "send" && <SendTab />}
        {tab === "places" && <PlacesTab />}
        {tab === "more" && <MoreTab />}
      </main>

      <TopUpDialog open={topupOpen} onOpenChange={setTopupOpen} />
      <WithdrawDialog open={withdrawOpen} onOpenChange={setWithdrawOpen} />
      <SpendDialog
        method={spendMethod}
        onClose={() => setSpendMethod(null)}
        onPinGenerated={(pin, amount) => setPinResult({ pin, amount })}
      />
      <PinResultDialog
        result={pinResult}
        onClose={() => setPinResult(null)}
      />
      <HistorySheet open={historyOpen} onOpenChange={setHistoryOpen} />
      <NotificationsSheet open={notifOpen} onOpenChange={setNotifOpen} />
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}

function ActionTile({
  label,
  icon,
  onClick,
  primary,
  compact,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border transition active:scale-[0.98] ${
        primary
          ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
          : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
      } ${compact ? "py-3" : "py-4"}`}
    >
      {icon}
      <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
    </button>
  );
}

function TxRow({ t }: { t: Tx }) {
  const sign = t.type === "topup" ? "+" : "-";
  const color = t.type === "topup" ? "text-emerald-600" : "text-slate-900";
  const label =
    t.type === "topup" ? "Top up" : t.type === "withdraw" ? "Withdraw" : t.note || "Payment";
  return (
    <div className="flex items-center justify-between border-b px-4 py-3 last:border-b-0">
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{label}</div>
        <div className="text-[11px] text-muted-foreground">
          {new Date(t.at).toLocaleString()}
        </div>
      </div>
      <div className={`text-sm font-semibold ${color}`}>
        {sign} {formatZAR(t.amount)}
      </div>
    </div>
  );
}

function TopUpDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
}) {
  const w = useWallet();
  const [pin, setPin] = useState("");
  const sampleList = useMemo(() => Object.entries(w.sampleVouchers), [w.sampleVouchers]);

  const submit = () => {
    const res = w.topUp(pin);
    if (res.ok) {
      toast.success(res.message);
      setPin("");
      onOpenChange(false);
    } else {
      toast.error(res.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Top up your card</DialogTitle>
          <DialogDescription>Choose a payment method</DialogDescription>
        </DialogHeader>
        <TopUpMethodPicker
          onClose={() => onOpenChange(false)}
          voucherView={
            <div className="space-y-3">
          <Label htmlFor="pin">Voucher PIN</Label>
          <Input
            id="pin"
            inputMode="numeric"
            maxLength={12}
            placeholder="••••••••••••"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            className="text-center text-lg tracking-[0.3em]"
          />
          <div className="rounded-lg bg-slate-50 p-3 text-xs">
            <div className="mb-1 font-semibold text-slate-700">Demo vouchers</div>
            <ul className="space-y-1">
              {sampleList.map(([p, amt]) => (
                <li key={p} className="flex justify-between text-slate-600">
                  <button
                    type="button"
                    onClick={() => setPin(p)}
                    className="font-mono hover:text-blue-600"
                  >
                    {p}
                  </button>
                  <span>{formatZAR(amt)}</span>
                </li>
              ))}
            </ul>
          </div>
              <DialogFooter className="pt-2">
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={submit} disabled={pin.length !== 12}>
                  Redeem
                </Button>
              </DialogFooter>
            </div>
          }
        />
      </DialogContent>
    </Dialog>
  );
}

type TopUpMethod = "voucher" | "card" | "applepay" | "googlepay";

function TopUpMethodPicker({
  voucherView,
  onClose,
}: {
  voucherView: React.ReactNode;
  onClose: () => void;
}) {
  const [method, setMethod] = useState<TopUpMethod>("voucher");

  const tabs: { id: TopUpMethod; label: string; icon: React.ReactNode }[] = [
    { id: "voucher", label: "Voucher", icon: <Ticket className="h-4 w-4" /> },
    { id: "card", label: "Card", icon: <CreditCard className="h-4 w-4" /> },
    { id: "applepay", label: "Apple Pay", icon: <Apple className="h-4 w-4" /> },
    { id: "googlepay", label: "Google Pay", icon: <Smartphone className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-1 rounded-lg bg-slate-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setMethod(t.id)}
            className={`flex flex-col items-center gap-1 rounded-md py-2 text-[10px] font-semibold transition ${
              method === t.id ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {method === "voucher" && voucherView}
      {method === "card" && <CardTopUpForm onDone={onClose} />}
      {method === "applepay" && <WalletTopUpForm source="applepay" onDone={onClose} />}
      {method === "googlepay" && <WalletTopUpForm source="googlepay" onDone={onClose} />}
    </div>
  );
}

const QUICK_AMOUNTS = [50, 100, 200, 500];

function CardTopUpForm({ onDone }: { onDone: () => void }) {
  const w = useWallet();
  const [amt, setAmt] = useState("");
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [exp, setExp] = useState("");
  const [cvv, setCvv] = useState("");
  const [phase, setPhase] = useState<"form" | "processing" | "done">("form");

  const amount = parseFloat(amt) || 0;
  const numClean = number.replace(/\s/g, "");
  const valid =
    amount > 0 &&
    numClean.length >= 12 &&
    name.trim().length > 1 &&
    /^\d{2}\/\d{2}$/.test(exp) &&
    /^\d{3,4}$/.test(cvv);

  const submit = () => {
    if (!valid) return toast.error("Fill in all card details");
    setPhase("processing");
    setTimeout(() => {
      const res = w.topUpExternal(amount, "card");
      if (!res.ok) {
        toast.error(res.message);
        setPhase("form");
        return;
      }
      setPhase("done");
      setTimeout(() => {
        toast.success(res.message);
        onDone();
      }, 900);
    }, 1400);
  };

  if (phase === "processing")
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-sm text-muted-foreground">Authorising card…</p>
      </div>
    );
  if (phase === "done")
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Check className="h-7 w-7" />
        </div>
        <div className="font-semibold">Card charged</div>
        <div className="text-sm text-muted-foreground">{formatZAR(amount)} added</div>
      </div>
    );

  return (
    <div className="space-y-3">
      <AmountInput value={amt} onChange={setAmt} />
      <div>
        <Label htmlFor="ccnum" className="text-xs">Card number</Label>
        <Input
          id="ccnum"
          inputMode="numeric"
          placeholder="4242 4242 4242 4242"
          value={number}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 19);
            setNumber(v.replace(/(.{4})/g, "$1 ").trim());
          }}
        />
      </div>
      <div>
        <Label htmlFor="ccname" className="text-xs">Cardholder name</Label>
        <Input
          id="ccname"
          placeholder="J. Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="ccexp" className="text-xs">Expiry</Label>
          <Input
            id="ccexp"
            placeholder="MM/YY"
            maxLength={5}
            value={exp}
            onChange={(e) => {
              let v = e.target.value.replace(/\D/g, "").slice(0, 4);
              if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2);
              setExp(v);
            }}
          />
        </div>
        <div>
          <Label htmlFor="cccvv" className="text-xs">CVV</Label>
          <Input
            id="cccvv"
            inputMode="numeric"
            maxLength={4}
            placeholder="123"
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
          />
        </div>
      </div>
      <DialogFooter className="pt-2">
        <Button onClick={submit} disabled={!valid} className="w-full">
          Pay {amount > 0 ? formatZAR(amount) : ""}
        </Button>
      </DialogFooter>
    </div>
  );
}

function WalletTopUpForm({
  source,
  onDone,
}: {
  source: "applepay" | "googlepay";
  onDone: () => void;
}) {
  const w = useWallet();
  const [amt, setAmt] = useState("");
  const [phase, setPhase] = useState<"amount" | "sheet" | "auth" | "done">("amount");
  const amount = parseFloat(amt) || 0;

  const isApple = source === "applepay";
  const brand = isApple ? "Apple Pay" : "Google Pay";

  const startSheet = () => {
    if (amount <= 0) return toast.error("Enter an amount");
    setPhase("sheet");
  };
  const authorise = () => {
    setPhase("auth");
    setTimeout(() => {
      const res = w.topUpExternal(amount, source);
      if (!res.ok) {
        toast.error(res.message);
        setPhase("amount");
        return;
      }
      setPhase("done");
      setTimeout(() => {
        toast.success(res.message);
        onDone();
      }, 900);
    }, 1300);
  };

  if (phase === "amount")
    return (
      <div className="space-y-3">
        <AmountInput value={amt} onChange={setAmt} />
        <DialogFooter className="pt-2">
          <Button
            onClick={startSheet}
            disabled={amount <= 0}
            className={`w-full ${
              isApple ? "bg-black hover:bg-black/90" : "bg-slate-900 hover:bg-slate-900/90"
            }`}
          >
            {isApple ? <Apple className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
            Pay with {brand}
          </Button>
        </DialogFooter>
      </div>
    );

  if (phase === "sheet")
    return (
      <div className="space-y-3 rounded-xl border bg-white p-4 shadow-inner">
        <div className="flex items-center gap-2 border-b pb-3">
          {isApple ? (
            <Apple className="h-5 w-5" />
          ) : (
            <Smartphone className="h-5 w-5 text-blue-600" />
          )}
          <span className="font-semibold">{brand}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Pay to</span>
          <span className="font-medium">OTT Virtual Card</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Card</span>
          <span className="font-medium">•••• 4242</span>
        </div>
        <div className="flex justify-between border-t pt-3">
          <span className="text-muted-foreground text-sm">Total</span>
          <span className="text-lg font-bold">{formatZAR(amount)}</span>
        </div>
        <Button
          onClick={authorise}
          className={`w-full ${isApple ? "bg-black hover:bg-black/90" : "bg-slate-900 hover:bg-slate-900/90"}`}
        >
          <Fingerprint className="h-4 w-4" />
          {isApple ? "Confirm with Face ID" : "Confirm with fingerprint"}
        </Button>
        <Button variant="ghost" className="w-full" onClick={() => setPhase("amount")}>
          Cancel
        </Button>
      </div>
    );

  if (phase === "auth")
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-blue-500/30" />
          <Fingerprint className="relative h-10 w-10 text-blue-600" />
        </div>
        <p className="text-sm text-muted-foreground">Authenticating with {brand}…</p>
      </div>
    );

  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white">
        <Check className="h-7 w-7" />
      </div>
      <div className="font-semibold">{brand} successful</div>
      <div className="text-sm text-muted-foreground">{formatZAR(amount)} added</div>
    </div>
  );
}

function AmountInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="topupamt" className="text-xs">Amount (R)</Label>
      <Input
        id="topupamt"
        inputMode="decimal"
        placeholder="0.00"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))}
        className="text-lg font-semibold"
      />
      <div className="flex gap-2">
        {QUICK_AMOUNTS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => onChange(String(a))}
            className="flex-1 rounded-md border border-slate-200 py-1.5 text-xs font-medium hover:bg-slate-50"
          >
            R{a}
          </button>
        ))}
      </div>
    </div>
  );
}

function WithdrawDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
}) {
  const w = useWallet();
  const [amt, setAmt] = useState("");
  const submit = () => {
    const res = w.withdraw(parseFloat(amt));
    if (res.ok) {
      toast.success(`Withdrew ${formatZAR(parseFloat(amt))}`);
      setAmt("");
      onOpenChange(false);
    } else toast.error(res.message);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Withdraw</DialogTitle>
          <DialogDescription>
            Available balance: {formatZAR(w.balance)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="wamt">Amount (R)</Label>
          <Input
            id="wamt"
            inputMode="decimal"
            placeholder="0.00"
            value={amt}
            onChange={(e) => setAmt(e.target.value.replace(/[^\d.]/g, ""))}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Withdraw</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SpendDialog({
  method,
  onClose,
  onPinGenerated,
}: {
  method: SpendMethod | null;
  onClose: () => void;
  onPinGenerated: (pin: string, amount: number) => void;
}) {
  const w = useWallet();
  const [amt, setAmt] = useState("");
  const [phase, setPhase] = useState<"input" | "processing" | "done">("input");

  const reset = () => {
    setAmt("");
    setPhase("input");
  };

  const submit = () => {
    if (!method) return;
    const amount = parseFloat(amt);
    if (!amount || amount <= 0) return toast.error("Enter an amount");
    if (amount > w.balance) return toast.error("Insufficient balance");

    if (method === "pin") {
      const res = w.spend(amount, "pin");
      if (res.ok && res.pin) {
        onPinGenerated(res.pin, amount);
        reset();
        onClose();
      } else toast.error(res.message);
      return;
    }

    setPhase("processing");
    setTimeout(() => {
      const res = w.spend(amount, method);
      if (res.ok) {
        setPhase("done");
        setTimeout(() => {
          reset();
          onClose();
        }, 1100);
      } else {
        toast.error(res.message);
        setPhase("input");
      }
    }, 1500);
  };

  const titles: Record<SpendMethod, string> = {
    tap: "Tap to pay",
    scan: "Scan to pay",
    pin: "Generate PIN",
  };

  return (
    <Dialog
      open={method !== null}
      onOpenChange={(o) => {
        if (!o) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{method ? titles[method] : ""}</DialogTitle>
          <DialogDescription>
            Available: {formatZAR(w.balance)}
          </DialogDescription>
        </DialogHeader>

        {phase === "input" && (
          <div className="space-y-3">
            <Label htmlFor="samt">Amount (R)</Label>
            <Input
              id="samt"
              inputMode="decimal"
              placeholder="0.00"
              value={amt}
              onChange={(e) => setAmt(e.target.value.replace(/[^\d.]/g, ""))}
              autoFocus
            />
            {method === "pin" && (
              <p className="text-xs text-muted-foreground">
                A unique 12-digit PIN will be generated. Enter it at the merchant to complete
                payment.
              </p>
            )}
          </div>
        )}

        {phase === "processing" && method !== "pin" && (
          <div className="flex flex-col items-center gap-4 py-8">
            {method === "tap" ? (
              <div className="relative flex h-24 w-24 items-center justify-center">
                <span className="absolute inset-0 animate-ping rounded-full bg-blue-500/30" />
                <span
                  className="absolute inset-3 animate-ping rounded-full bg-blue-500/40"
                  style={{ animationDelay: "0.3s" }}
                />
                <Wifi className="relative h-10 w-10 rotate-90 text-blue-600" />
              </div>
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-lg border-4 border-dashed border-blue-500 bg-blue-50">
                <QrCode className="h-16 w-16 text-blue-600 animate-pulse" />
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              {method === "tap" ? "Hold near terminal…" : "Scanning QR code…"}
            </p>
          </div>
        )}

        {phase === "done" && (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white">
              <Check className="h-8 w-8" />
            </div>
            <div className="text-lg font-semibold">Payment successful</div>
            <div className="text-sm text-muted-foreground">{formatZAR(parseFloat(amt))}</div>
          </div>
        )}

        {phase === "input" && (
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                reset();
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button onClick={submit}>{method === "pin" ? "Generate PIN" : "Pay"}</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PinResultDialog({
  result,
  onClose,
}: {
  result: { pin: string; amount: number } | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!result} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Your payment PIN</DialogTitle>
          <DialogDescription>
            Enter this 12-digit PIN at the merchant to pay {result && formatZAR(result.amount)}.
          </DialogDescription>
        </DialogHeader>
        {result && (
          <div className="space-y-3">
            <div className="rounded-xl bg-slate-900 px-4 py-5 text-center font-mono text-2xl tracking-[0.25em] text-white">
              {result.pin.match(/.{1,4}/g)?.join(" ")}
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                navigator.clipboard?.writeText(result.pin);
                toast.success("PIN copied");
              }}
            >
              <Copy className="mr-2 h-4 w-4" /> Copy PIN
            </Button>
            <p className="text-[11px] text-muted-foreground">
              Tip: drop the spent PIN on the OTT App for rewards.
            </p>
          </div>
        )}
        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HistorySheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
}) {
  const w = useWallet();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh]">
        <SheetHeader>
          <SheetTitle>Transaction history</SheetTitle>
          <SheetDescription>All activity on your virtual card</SheetDescription>
        </SheetHeader>
        <div className="mt-4 max-h-[70vh] overflow-y-auto rounded-xl border bg-white">
          {w.txs.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Nothing here yet.
            </div>
          ) : (
            w.txs.map((t) => <TxRow key={t.id} t={t} />)
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function NotificationsSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
}) {
  const w = useWallet();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[88vw] sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>Recent alerts from your wallet</SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-2 overflow-y-auto">
          {w.notifs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
              <Bell className="h-6 w-6 opacity-50" />
              No notifications
            </div>
          ) : (
            w.notifs.map((n) => (
              <div
                key={n.id}
                className="rounded-lg border bg-white p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold">{n.title}</div>
                  <button
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="dismiss"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">{n.body}</div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  {new Date(n.at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
