import { useEffect, useState, useCallback } from "react";

export type TxType = "topup" | "spend" | "withdraw" | "transfer-out" | "transfer-in";
export interface Tx {
  id: string;
  type: TxType;
  amount: number;
  note?: string;
  pin?: string;
  at: number;
  counterparty?: string;
}
export interface Notif {
  id: string;
  title: string;
  body: string;
  at: number;
  read: boolean;
}
export interface Contact {
  id: string;
  name: string;
  handle: string;
  avatar?: string;
}
export interface FavMerchant {
  id: string;
  name: string;
  category?: string;
  lastAmount?: number;
}
export type SubInterval = "weekly" | "monthly" | "yearly";
export interface Subscription {
  id: string;
  merchant: string;
  amount: number;
  interval: SubInterval;
  nextDue: number;
  active: boolean;
}
export type CardTheme =
  | "ocean"
  | "midnight"
  | "sunset"
  | "emerald"
  | "rose"
  | "graphite";

export const CARD_THEMES: Record<CardTheme, { label: string; gradient: string }> = {
  ocean: { label: "Ocean", gradient: "linear-gradient(135deg,#1f7ce0 0%,#1668c4 45%,#0f4f9c 100%)" },
  midnight: { label: "Midnight", gradient: "linear-gradient(135deg,#1f2937 0%,#0f172a 50%,#020617 100%)" },
  sunset: { label: "Sunset", gradient: "linear-gradient(135deg,#f97316 0%,#e11d48 60%,#7c3aed 100%)" },
  emerald: { label: "Emerald", gradient: "linear-gradient(135deg,#10b981 0%,#047857 60%,#064e3b 100%)" },
  rose: { label: "Rose", gradient: "linear-gradient(135deg,#fb7185 0%,#e11d48 60%,#881337 100%)" },
  graphite: { label: "Graphite", gradient: "linear-gradient(135deg,#475569 0%,#334155 55%,#0f172a 100%)" },
};

interface WalletState {
  balance: number;
  txs: Tx[];
  notifs: Notif[];
  contacts: Contact[];
  favorites: FavMerchant[];
  subscriptions: Subscription[];
  cardTheme: CardTheme;
}

const KEY = "ott-wallet-v1";
const VALID_VOUCHERS: Record<string, number> = {
  "111122223333": 50,
  "444455556666": 100,
  "777788889999": 200,
  "123412341234": 500,
};

const SEED_CONTACTS: Contact[] = [
  { id: "c1", name: "Thabo M.", handle: "@thabo" },
  { id: "c2", name: "Lerato K.", handle: "@lerato" },
  { id: "c3", name: "Sipho N.", handle: "@sipho" },
  { id: "c4", name: "Aisha P.", handle: "@aisha" },
];

const initial: WalletState = {
  balance: 0,
  txs: [],
  notifs: [],
  contacts: SEED_CONTACTS,
  favorites: [],
  subscriptions: [],
  cardTheme: "ocean",
};

function read(): WalletState {
  if (typeof window === "undefined") return initial;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw) as Partial<WalletState>;
    return { ...initial, ...parsed };
  } catch {
    return initial;
  }
}

const listeners = new Set<() => void>();
let state: WalletState | null = null;

function getState(): WalletState {
  if (state === null) state = read();
  return state;
}
function setState(updater: (s: WalletState) => WalletState) {
  state = updater(getState());
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(state));
  }
  listeners.forEach((l) => l());
}

export function useWallet() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  const s = getState();

  const pushNotif = useCallback((title: string, body: string) => {
    setState((prev) => ({
      ...prev,
      notifs: [
        { id: crypto.randomUUID(), title, body, at: Date.now(), read: false },
        ...prev.notifs,
      ].slice(0, 50),
    }));
  }, []);

  const topUp = useCallback((pin: string): { ok: boolean; message: string; amount?: number } => {
    const clean = pin.replace(/\s/g, "");
    if (!/^\d{12}$/.test(clean)) return { ok: false, message: "PIN must be 12 digits" };
    const amount = VALID_VOUCHERS[clean];
    if (!amount) return { ok: false, message: "Invalid or already used voucher" };
    if (getState().txs.some((t) => t.pin === clean && t.type === "topup")) {
      return { ok: false, message: "Voucher already redeemed" };
    }
    setState((p) => ({
      ...p,
      balance: p.balance + amount,
      txs: [
        { id: crypto.randomUUID(), type: "topup", amount, pin: clean, note: "Voucher top up", at: Date.now() },
        ...p.txs,
      ],
      notifs: [
        {
          id: crypto.randomUUID(),
          title: "Top up successful",
          body: `R ${amount.toFixed(2)} added to your card.`,
          at: Date.now(),
          read: false,
        },
        ...p.notifs,
      ],
    }));
    return { ok: true, message: `R ${amount.toFixed(2)} added`, amount };
  }, []);

  const topUpExternal = useCallback(
    (amount: number, source: "card" | "applepay" | "googlepay"): { ok: boolean; message: string } => {
      if (!amount || amount <= 0) return { ok: false, message: "Enter an amount" };
      const label =
        source === "card" ? "Card top up" : source === "applepay" ? "Apple Pay top up" : "Google Pay top up";
      setState((p) => ({
        ...p,
        balance: p.balance + amount,
        txs: [
          { id: crypto.randomUUID(), type: "topup", amount, note: label, at: Date.now() },
          ...p.txs,
        ],
        notifs: [
          {
            id: crypto.randomUUID(),
            title: "Top up successful",
            body: `R ${amount.toFixed(2)} added via ${label.replace(" top up", "")}.`,
            at: Date.now(),
            read: false,
          },
          ...p.notifs,
        ],
      }));
      return { ok: true, message: `R ${amount.toFixed(2)} added` };
    },
    [],
  );

  const spend = useCallback(
    (amount: number, method: "tap" | "scan" | "pin", note?: string): { ok: boolean; message: string; pin?: string } => {
      if (!amount || amount <= 0) return { ok: false, message: "Enter an amount" };
      if (amount > getState().balance) return { ok: false, message: "Insufficient balance" };
      const pin =
        method === "pin"
          ? Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join("")
          : undefined;
      const label =
        method === "tap" ? "Tap to pay" : method === "scan" ? "Scan to pay" : "PIN payment";
      setState((p) => ({
        ...p,
        balance: p.balance - amount,
        txs: [
          {
            id: crypto.randomUUID(),
            type: "spend",
            amount,
            note: note || label,
            pin,
            at: Date.now(),
          },
          ...p.txs,
        ],
        notifs: [
          {
            id: crypto.randomUUID(),
            title: `${label} – R ${amount.toFixed(2)}`,
            body: pin ? `PIN generated: ${pin}` : "Payment completed.",
            at: Date.now(),
            read: false,
          },
          ...p.notifs,
        ],
      }));
      return { ok: true, message: "Paid", pin };
    },
    [],
  );

  const withdraw = useCallback((amount: number): { ok: boolean; message: string } => {
    if (!amount || amount <= 0) return { ok: false, message: "Enter an amount" };
    if (amount > getState().balance) return { ok: false, message: "Insufficient balance" };
    setState((p) => ({
      ...p,
      balance: p.balance - amount,
      txs: [
        { id: crypto.randomUUID(), type: "withdraw", amount, note: "Withdraw", at: Date.now() },
        ...p.txs,
      ],
      notifs: [
        {
          id: crypto.randomUUID(),
          title: "Withdrawal",
          body: `R ${amount.toFixed(2)} withdrawn from your card.`,
          at: Date.now(),
          read: false,
        },
        ...p.notifs,
      ],
    }));
    return { ok: true, message: "Withdrawn" };
  }, []);

  const markAllRead = useCallback(() => {
    setState((p) => ({ ...p, notifs: p.notifs.map((n) => ({ ...n, read: true })) }));
  }, []);

  const reset = useCallback(() => {
    setState(() => initial);
  }, []);

  const transfer = useCallback(
    (contactId: string, amount: number, note?: string): { ok: boolean; message: string } => {
      if (!amount || amount <= 0) return { ok: false, message: "Enter an amount" };
      if (amount > getState().balance) return { ok: false, message: "Insufficient balance" };
      const contact = getState().contacts.find((c) => c.id === contactId);
      if (!contact) return { ok: false, message: "Pick a recipient" };
      setState((p) => ({
        ...p,
        balance: p.balance - amount,
        txs: [
          {
            id: crypto.randomUUID(),
            type: "transfer-out",
            amount,
            note: note || `Sent to ${contact.name}`,
            counterparty: contact.handle,
            at: Date.now(),
          },
          ...p.txs,
        ],
        notifs: [
          {
            id: crypto.randomUUID(),
            title: `Sent ${formatZAR(amount)}`,
            body: `To ${contact.name} (${contact.handle})`,
            at: Date.now(),
            read: false,
          },
          ...p.notifs,
        ],
      }));
      return { ok: true, message: `Sent to ${contact.name}` };
    },
    [],
  );

  const addContact = useCallback((name: string, handle: string) => {
    const h = handle.startsWith("@") ? handle : `@${handle}`;
    setState((p) => ({
      ...p,
      contacts: [{ id: crypto.randomUUID(), name, handle: h }, ...p.contacts],
    }));
  }, []);

  const addFavorite = useCallback((m: Omit<FavMerchant, "id">) => {
    setState((p) => {
      if (p.favorites.some((f) => f.name.toLowerCase() === m.name.toLowerCase())) return p;
      return { ...p, favorites: [{ id: crypto.randomUUID(), ...m }, ...p.favorites] };
    });
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setState((p) => ({ ...p, favorites: p.favorites.filter((f) => f.id !== id) }));
  }, []);

  const addSubscription = useCallback(
    (merchant: string, amount: number, interval: SubInterval) => {
      const ms =
        interval === "weekly" ? 7 * 864e5 : interval === "monthly" ? 30 * 864e5 : 365 * 864e5;
      setState((p) => ({
        ...p,
        subscriptions: [
          {
            id: crypto.randomUUID(),
            merchant,
            amount,
            interval,
            nextDue: Date.now() + ms,
            active: true,
          },
          ...p.subscriptions,
        ],
      }));
    },
    [],
  );

  const toggleSubscription = useCallback((id: string) => {
    setState((p) => ({
      ...p,
      subscriptions: p.subscriptions.map((s) =>
        s.id === id ? { ...s, active: !s.active } : s,
      ),
    }));
  }, []);

  const removeSubscription = useCallback((id: string) => {
    setState((p) => ({
      ...p,
      subscriptions: p.subscriptions.filter((s) => s.id !== id),
    }));
  }, []);

  const setCardTheme = useCallback((theme: CardTheme) => {
    setState((p) => ({ ...p, cardTheme: theme }));
  }, []);

  return {
    balance: s.balance,
    txs: s.txs,
    notifs: s.notifs,
    contacts: s.contacts,
    favorites: s.favorites,
    subscriptions: s.subscriptions,
    cardTheme: s.cardTheme,
    topUp,
    topUpExternal,
    spend,
    withdraw,
    transfer,
    addContact,
    addFavorite,
    removeFavorite,
    addSubscription,
    toggleSubscription,
    removeSubscription,
    setCardTheme,
    markAllRead,
    pushNotif,
    reset,
    sampleVouchers: VALID_VOUCHERS,
  };
}

export function formatZAR(n: number) {
  return `R ${n.toFixed(2)}`;
}