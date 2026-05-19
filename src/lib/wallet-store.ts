import { useEffect, useState, useCallback } from "react";

export type TxType = "topup" | "spend" | "withdraw";
export interface Tx {
  id: string;
  type: TxType;
  amount: number;
  note?: string;
  pin?: string;
  at: number;
}
export interface Notif {
  id: string;
  title: string;
  body: string;
  at: number;
  read: boolean;
}
interface WalletState {
  balance: number;
  txs: Tx[];
  notifs: Notif[];
}

const KEY = "ott-wallet-v1";
const VALID_VOUCHERS: Record<string, number> = {
  "111122223333": 50,
  "444455556666": 100,
  "777788889999": 200,
  "123412341234": 500,
};

const initial: WalletState = { balance: 0, txs: [], notifs: [] };

function read(): WalletState {
  if (typeof window === "undefined") return initial;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial;
    return JSON.parse(raw) as WalletState;
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

  return {
    balance: s.balance,
    txs: s.txs,
    notifs: s.notifs,
    topUp,
    spend,
    withdraw,
    markAllRead,
    pushNotif,
    reset,
    sampleVouchers: VALID_VOUCHERS,
  };
}

export function formatZAR(n: number) {
  return `R ${n.toFixed(2)}`;
}