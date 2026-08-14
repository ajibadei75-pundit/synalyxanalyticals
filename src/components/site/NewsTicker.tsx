import { Link } from "@tanstack/react-router";
import { BookOpen, Images, LineChart, ShoppingBag, Sparkles, Star } from "lucide-react";

const items = [
  { to: "/blog", label: "New: tutorials & dashboard teardowns on the blog", icon: BookOpen },
  { to: "/gallery", label: "Event photos & videos in the gallery", icon: Images },
  { to: "/merch", label: "Merch pre-orders are open", icon: ShoppingBag },
  { to: "/projects", label: "Student project showcase", icon: LineChart },
  { to: "/blog", label: "Rate & review everything you read", icon: Star },
] as const;

export function NewsTicker() {
  const loop = [...items, ...items];

  return (
    <div className="relative overflow-hidden border-b border-border/60 bg-card/40">
      <div className="flex w-max marquee-track">
        {loop.map((item, i) => (
          <Link
            key={`${item.to}-${i}`}
            to={item.to}
            className="group flex shrink-0 items-center gap-2.5 px-6 py-2.5 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
          >
            <item.icon className="h-3.5 w-3.5 text-primary-glow" />
            {item.label}
            <Sparkles className="h-3 w-3 text-primary-glow opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        ))}
      </div>
    </div>
  );
}
