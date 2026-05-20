import { useState } from "react";
import { Send, UserPlus, Check } from "lucide-react";
import { useWallet, formatZAR } from "@/lib/wallet-store";
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
import { toast } from "sonner";

export function SendTab() {
  const w = useWallet();
  const [selected, setSelected] = useState<string | null>(null);
  const [amt, setAmt] = useState("");
  const [note, setNote] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [done, setDone] = useState(false);

  const submit = () => {
    if (!selected) return toast.error("Pick a recipient");
    const amount = parseFloat(amt);
    const res = w.transfer(selected, amount, note);
    if (res.ok) {
      setDone(true);
      setTimeout(() => {
        setDone(false);
        setSelected(null);
        setAmt("");
        setNote("");
      }, 1400);
    } else toast.error(res.message);
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Check className="h-8 w-8" />
        </div>
        <div className="text-lg font-semibold">Transfer sent</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-white dark:bg-slate-900 p-4">
        <div className="text-xs text-muted-foreground">Available</div>
        <div className="text-2xl font-bold">{formatZAR(w.balance)}</div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            OTT contacts
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1 text-xs font-medium text-blue-600"
          >
            <UserPlus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {w.contacts.map((c) => {
            const initials = c.name.split(" ").map((p) => p[0]).join("").slice(0, 2);
            return (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`flex flex-col items-center gap-1 rounded-xl border p-2 transition ${
                  selected === c.id
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white">
                  {initials}
                </div>
                <div className="truncate text-[10px] font-medium w-full text-center">{c.name}</div>
                <div className="truncate text-[9px] text-muted-foreground w-full text-center">{c.handle}</div>
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <div className="space-y-3 rounded-xl border bg-white dark:bg-slate-900 p-4">
          <div>
            <Label htmlFor="samt" className="text-xs">Amount (R)</Label>
            <Input
              id="samt"
              inputMode="decimal"
              placeholder="0.00"
              value={amt}
              onChange={(e) => setAmt(e.target.value.replace(/[^\d.]/g, ""))}
              className="text-lg font-semibold"
            />
          </div>
          <div>
            <Label htmlFor="snote" className="text-xs">Note (optional)</Label>
            <Input
              id="snote"
              placeholder="What's it for?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <Button className="w-full" onClick={submit} disabled={!parseFloat(amt)}>
            <Send className="h-4 w-4" />
            Send {parseFloat(amt) > 0 ? formatZAR(parseFloat(amt)) : ""}
          </Button>
        </div>
      )}

      <AddContactDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

function AddContactDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
}) {
  const w = useWallet();
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add OTT contact</DialogTitle>
          <DialogDescription>Search by handle or phone</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          </div>
          <div>
            <Label className="text-xs">OTT handle</Label>
            <Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@username" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!name || !handle}
            onClick={() => {
              w.addContact(name, handle);
              setName("");
              setHandle("");
              onOpenChange(false);
              toast.success("Contact added");
            }}
          >
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}