import { useEffect, useMemo, useState } from "react";
import { MapPin, Star, Loader2, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/lib/wallet-store";
import { toast } from "sonner";

interface Merchant {
  id: string;
  name: string;
  category: string;
  distance: number;
  address: string;
}

const SEED: Omit<Merchant, "distance">[] = [
  { id: "m1", name: "Pick n Pay", category: "Grocery", address: "Main Rd" },
  { id: "m2", name: "Steers", category: "Food", address: "Long St" },
  { id: "m3", name: "Game", category: "Retail", address: "V&A Waterfront" },
  { id: "m4", name: "Engen", category: "Fuel", address: "N1 Highway" },
  { id: "m5", name: "KFC", category: "Food", address: "Sea Point" },
  { id: "m6", name: "Builders Express", category: "Hardware", address: "Claremont" },
  { id: "m7", name: "Clicks Pharmacy", category: "Health", address: "Cavendish Sq" },
  { id: "m8", name: "Takealot Pickup", category: "Retail", address: "Observatory" },
];

export function PlacesTab() {
  const w = useWallet();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      { timeout: 8000 },
    );
  };

  const merchants: Merchant[] = useMemo(() => {
    // Deterministic pseudo distances per session if no coords
    const seedRand = (s: string) => {
      let h = 0;
      for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
      return ((h % 1000) / 1000) * 4.8 + 0.2;
    };
    return SEED.map((m) => ({
      ...m,
      distance: coords ? Number((seedRand(m.id + coords.lat.toFixed(2)) ).toFixed(1)) : Number(seedRand(m.id).toFixed(1)),
    })).sort((a, b) => a.distance - b.distance);
  }, [coords]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-gradient-to-br from-blue-600 to-indigo-700 p-4 text-white">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <MapPin className="h-4 w-4" /> Merchants near you
        </div>
        <div className="mt-1 text-[11px] opacity-90">
          {coords
            ? `Located: ${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)}`
            : "Share your location to see exact distances"}
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="mt-3"
          onClick={requestLocation}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Navigation className="h-3 w-3" />}
          {coords ? "Refresh location" : "Enable location"}
        </Button>
        {error && <div className="mt-2 text-[11px] opacity-90">⚠ {error}</div>}
      </div>

      <div className="space-y-2">
        {merchants.map((m) => {
          const isFav = w.favorites.some((f) => f.name === m.name);
          return (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-xl border bg-white dark:bg-slate-900 p-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold truncate">{m.name}</div>
                  <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] text-muted-foreground">
                    {m.category}
                  </span>
                </div>
                <div className="mt-0.5 text-[11px] text-muted-foreground truncate">
                  {m.address} • {m.distance} km
                </div>
              </div>
              <button
                onClick={() => {
                  if (isFav) return;
                  w.addFavorite({ name: m.name, category: m.category });
                  toast.success(`${m.name} saved`);
                }}
                className={`rounded-full p-2 ${
                  isFav ? "text-amber-500" : "text-muted-foreground hover:text-amber-500"
                }`}
                aria-label="Favorite"
              >
                <Star className="h-4 w-4" fill={isFav ? "currentColor" : "none"} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}