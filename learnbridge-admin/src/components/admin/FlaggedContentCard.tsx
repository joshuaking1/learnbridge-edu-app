// src/components/admin/FlaggedContentCard.tsx
"use client";
import { useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Trash2, UserX, Loader2 } from "lucide-react";
import {
  dismissFlag,
  deleteFlaggedContent,
  banUser,
} from "@/app/dashboard/moderation/actions";

type Flag = {
  id: string;
  content_type: "post" | "comment";
  content_id: string;
  reason: string;
  reason_details: string | null;
  created_at: string;
  reporter: { full_name: string | null; id: string } | null;
  post?: {
    content: string;
    author: { full_name: string | null; id: string } | null;
  } | null;
  comment?: {
    content: string;
    author: { full_name: string | null; id: string } | null;
  } | null;
};

export const FlaggedContentCard = ({ flag }: { flag: Flag }) => {
  const [isPending, startTransition] = useTransition();

  const content =
    flag.content_type === "post" ? flag.post?.content : flag.comment?.content;
  const author =
    flag.content_type === "post" ? flag.post?.author : flag.comment?.author;

  const handleDismiss = () => startTransition(() => dismissFlag(flag.id));
  const handleDelete = () =>
    startTransition(() =>
      deleteFlaggedContent(flag.id, flag.content_type, flag.content_id)
    );
  const handleBan = () =>
    author
      ? startTransition(() => banUser(author.id))
      : alert("Author not found.");

  return (
    <Card className="bg-slate-900 border-slate-700 text-white relative">
      {isPending && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-lg text-yellow-400 capitalize">
          Flagged {flag.content_type}
        </CardTitle>
        <CardDescription>
          Reported by{" "}
          <span className="font-semibold text-slate-300">
            {flag.reporter?.full_name || "A User"}
          </span>{" "}
          for:{" "}
          <span className="font-semibold text-slate-300">{flag.reason}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="border-t border-b border-slate-700 py-4">
        <p className="text-sm text-slate-400 mb-2">"{flag.reason_details}"</p>
        <blockquote className="border-l-4 border-slate-500 pl-4 text-slate-300">
          {content || (
            <span className="italic text-slate-500">
              [Content may have already been deleted]
            </span>
          )}
        </blockquote>
        <p className="text-xs text-slate-500 mt-2 text-right">
          - {author?.full_name || "Unknown Author"}
        </p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={handleDismiss} disabled={isPending}>
          <ShieldCheck className="mr-2 h-4 w-4" /> Dismiss
        </Button>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={isPending || !content}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete Content
        </Button>
        <Button
          variant="destructive"
          className="bg-red-800 hover:bg-red-700"
          onClick={handleBan}
          disabled={isPending || !author}
        >
          <UserX className="mr-2 h-4 w-4" /> Ban User
        </Button>
      </CardFooter>
    </Card>
  );
};
