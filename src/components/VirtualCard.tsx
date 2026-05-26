import { CARD_THEMES, formatZAR, type CardTheme } from "@/lib/wallet-store";
import ottLogo from "@/assets/ott-logo.png";

export function VirtualCard({
  balance,
  theme = "ocean",
}: {
  balance: number;
  theme?: CardTheme;
}) {
  const gradient = CARD_THEMES[theme]?.gradient ?? CARD_THEMES.ocean.gradient;
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div
        className="relative overflow-hidden rounded-2xl p-5 text-white shadow-xl"
        style={{
          background: gradient,
          aspectRatio: "1.586 / 1",
        }}
      >
        {/* subtle gloss */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 80% at 100% 0%, rgba(255,255,255,0.25), transparent 50%)",
          }}
        />
        <div className="relative flex items-start justify-between">
          <div className="text-2xl font-bold tracking-tight">
            h<span className="font-light">OTT</span>card
            <span className="ml-1">🔥</span>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded bg-white/15 backdrop-blur">
            <span className="text-[10px] font-bold">PAY</span>
          </div>
        </div>

        <div className="relative mt-8 text-[11px] uppercase tracking-[0.2em] opacity-80">
          Balance
        </div>
        <div className="relative text-3xl font-semibold">{formatZAR(balance)}</div>

        <div className="relative mt-4 flex items-end justify-between">
          <div>
            <div className="text-base font-semibold tracking-widest">
              VIRTUAL<span className="font-light">CARD</span>
            </div>
            <div className="mt-1 text-[10px] opacity-80">•••• •••• •••• 4242</div>
          </div>
          <img src={ottLogo} alt="OTT" className="h-8 w-auto object-contain" />
        </div>
      </div>
    </div>
  );
}