import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { getMyNotifications, markNotificationsRead } from "@/lib/portal.functions";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export function NotificationBell() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fetchNotifications = useServerFn(getMyNotifications);
  const markRead = useServerFn(markNotificationsRead);
  const [open, setOpen] = useState(false);
  const greeted = useRef(false);

  const { data = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: () => fetchNotifications(),
    refetchOnWindowFocus: true,
  });

  const unread = data.filter((n) => !n.read_at);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notifications-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as { title: string; body: string };
          toast(row.title, { description: row.body });
          queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  // Welcome pop-up on sign-in with a digest of what's waiting.
  useEffect(() => {
    if (!user || greeted.current || !data.length) return;
    greeted.current = true;
    if (unread.length) {
      const first = unread[0]!;
      toast(`${unread.length} new notification${unread.length > 1 ? "s" : ""}`, {
        description: first.title,
        action: { label: "View", onClick: () => setOpen(true) },
        duration: 7000,
      });
    }
  }, [user, data, unread]);

  const mutation = useMutation({
    mutationFn: () => markRead({ data: { ids: [] } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Notifications${unread.length ? `, ${unread.length} unread` : ""}`}
          className="relative rounded-full border border-border/70 bg-card/60 p-2.5 text-foreground transition-colors hover:border-primary/60 hover:text-primary-glow"
        >
          <Bell className="h-4.5 w-4.5" />
          {unread.length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unread.length > 9 ? "9+" : unread.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-88 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="font-display text-sm font-bold uppercase tracking-widest">Notifications</p>
          {unread.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => mutation.mutate()}
            >
              <CheckCheck className="mr-1 h-3.5 w-3.5" /> Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          {data.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nothing here yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {data.map((n) => (
                <li
                  key={n.id}
                  className={`px-4 py-3 ${n.read_at ? "opacity-70" : "bg-primary/5"}`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        n.kind === "success"
                          ? "bg-emerald-400"
                          : n.kind === "announcement"
                            ? "bg-primary-glow"
                            : "bg-sky-400"
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{n.title}</p>
                      {n.body && (
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          {n.body}
                        </p>
                      )}
                      <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                        {timeAgo(n.created_at)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
