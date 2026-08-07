import { useSiteSettings } from "@/hooks/useSiteSettings";
import markAsset from "@/assets/synalyx-mark.png.asset.json";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  showTagline?: boolean;
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src={markAsset.url}
      alt="Synalyx Analyticals mark"
      className={className}
      loading="eager"
      decoding="async"
    />
  );
}

export function Logo({ className = "", showWordmark = true, showTagline = false }: LogoProps) {
  const { data } = useSiteSettings();
  const brand = data?.brand_name || "Synalyx Analyticals";
  const tagline = data?.tagline || "Synchronized data, Simplified decisions";

  return (
    <span className={`inline-flex items-center gap-3 text-foreground ${className}`}>
      {data?.logo_url ? (
        <img
          src={data.logo_url}
          alt={`${brand} logo`}
          className="h-9 w-9 shrink-0 rounded-md object-contain"
        />
      ) : (
        <LogoMark className="h-9 w-9 shrink-0 object-contain" />
      )}
      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-xl font-bold uppercase tracking-[-0.04em]">
            {brand}
          </span>
          {showTagline && (
            <span className="mt-1 text-[10px] font-medium tracking-tight text-muted-foreground">
              {tagline}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
