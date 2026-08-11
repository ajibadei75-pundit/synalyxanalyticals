import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, MessageSquare, Star, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/auth/AuthProvider";
import { deleteReview, listMyReviews, listReviews, upsertReview } from "@/lib/content.functions";

export type ReviewTarget = "media" | "merch" | "project" | "blog";

export type ReviewRow = {
  id: string;
  target_id: string;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
};

export type MyReviewRow = {
  id: string;
  target_type: string;
  target_id: string;
  rating: number;
  comment: string;
};

export function useMyReviews() {
  const { user } = useAuth();
  const load = useServerFn(listMyReviews);
  const { data } = useQuery({
    queryKey: ["my-reviews", user?.id],
    queryFn: () => load() as Promise<MyReviewRow[]>,
    enabled: Boolean(user),
    staleTime: 30_000,
  });
  return data ?? [];
}

export function useReviews(targetType: ReviewTarget) {
  const load = useServerFn(listReviews);
  const { data } = useQuery({
    queryKey: ["reviews", targetType],
    queryFn: () => load({ data: { target_type: targetType } }) as Promise<ReviewRow[]>,
    staleTime: 30_000,
  });

  return useMemo(() => {
    const byTarget = new Map<string, ReviewRow[]>();
    for (const row of data ?? []) {
      const list = byTarget.get(row.target_id) ?? [];
      list.push(row);
      byTarget.set(row.target_id, list);
    }
    return byTarget;
  }, [data]);
}

export function Stars({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3.5 w-3.5 ${
            n <= Math.round(value) ? "fill-primary-glow text-primary-glow" : "text-muted-foreground"
          }`}
        />
      ))}
    </span>
  );
}

export function ReviewPanel({
  targetType,
  targetId,
  title,
  reviews,
}: {
  targetType: ReviewTarget;
  targetId: string;
  title: string;
  reviews: ReviewRow[];
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const save = useServerFn(upsertReview);
  const remove = useServerFn(deleteReview);
  const [open, setOpen] = useState(false);
  const myReviews = useMyReviews();

  const mine = myReviews.find((r) => r.target_type === targetType && r.target_id === targetId);
  const [rating, setRating] = useState(mine?.rating ?? 5);
  const [comment, setComment] = useState(mine?.comment ?? "");

  useEffect(() => {
    if (mine) {
      setRating(mine.rating);
      setComment(mine.comment);
    }
  }, [mine?.id, mine?.rating, mine?.comment]);

  const average = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["reviews", targetType] });
    queryClient.invalidateQueries({ queryKey: ["my-reviews"] });
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      save({ data: { target_type: targetType, target_id: targetId, rating, comment } }),
    onSuccess: () => {
      toast.success(mine ? "Review updated" : "Thanks for the review");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Review removed");
      setComment("");
      setRating(5);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
        >
          <Stars value={average} />
          <span className="font-medium text-foreground">
            {reviews.length ? average.toFixed(1) : "New"}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            {reviews.length}
          </span>
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-tight">{title}</DialogTitle>
          <DialogDescription>
            {reviews.length
              ? `${average.toFixed(1)} average from ${reviews.length} review${reviews.length === 1 ? "" : "s"}`
              : "No reviews yet — be the first to share your thoughts."}
          </DialogDescription>
        </DialogHeader>

        {user ? (
          <form
            className="rounded-2xl border border-border bg-card p-4"
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate();
            }}
          >
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  aria-label={`Rate ${n} out of 5`}
                  className="rounded p-0.5 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-5 w-5 ${
                      n <= rating ? "fill-primary-glow text-primary-glow" : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={800}
              placeholder="What did you think?"
              className="mt-3"
            />
            <div className="mt-3 flex items-center gap-2">
              <Button type="submit" size="sm" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mine ? "Update review" : "Post review"}
              </Button>
              {mine && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(mine.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4 text-destructive" /> Delete
                </Button>
              )}
            </div>
          </form>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            <Link to="/auth" className="font-medium text-primary-glow hover:underline">
              Sign in
            </Link>{" "}
            to leave a rating and review.
          </div>
        )}

        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border/70 bg-card/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{r.author_name || "Synalyx learner"}</p>
                <Stars value={r.rating} />
              </div>
              {r.comment && (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.comment}</p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
