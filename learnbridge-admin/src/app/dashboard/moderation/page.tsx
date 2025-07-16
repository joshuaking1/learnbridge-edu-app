// src/app/dashboard/moderation/page.tsx
import { createClient } from "@/lib/supabase/server";
import { FlaggedContentCard } from "@/components/admin/FlaggedContentCard";

// This is a more complex data fetching pattern to handle the polymorphic relationship.
async function getModerationQueue() {
  const supabase = await createClient();

  // 1. Get all pending flags and the person who reported them.
  const { data: flags, error: flagsError } = await supabase
    .from("flags")
    .select("*, reporter:profiles!reporter_id(id, full_name)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (flagsError) throw flagsError;

  // 2. Separate the IDs of flagged posts and comments.
  const postIds = flags
    .filter((f) => f.content_type === "post")
    .map((f) => f.content_id);
  const commentIds = flags
    .filter((f) => f.content_type === "comment")
    .map((f) => f.content_id);

  // 3. Fetch all flagged posts and comments in two separate, efficient queries.
  const [postsResult, commentsResult] = await Promise.all([
    supabase
      .from("posts")
      .select("id, content, author:profiles(id, full_name)")
      .in("id", postIds),
    supabase
      .from("comments")
      .select("id, content, author:profiles(id, full_name)")
      .in("id", commentIds),
  ]);

  const { data: posts } = postsResult;
  const { data: comments } = commentsResult;

  // 4. Create maps for quick lookups.
  const postsById = new Map(posts?.map((p) => [p.id, p]));
  const commentsById = new Map(comments?.map((c) => [c.id, c]));

  // 5. Combine the data into a single, rich object for the UI.
  const hydratedFlags = flags.map((flag) => ({
    ...flag,
    post: flag.content_type === "post" ? postsById.get(flag.content_id) : null,
    comment:
      flag.content_type === "comment"
        ? commentsById.get(flag.content_id)
        : null,
  }));

  return hydratedFlags;
}

export default async function ModerationPage() {
  const flags = await getModerationQueue();

  return (
    <div>
      <h1 className="text-3xl font-bold text-white">Moderation Queue</h1>
      <p className="text-slate-400">
        Review and act upon user-reported content to maintain a safe community.
      </p>
      <div className="mt-6 space-y-4">
        {flags && flags.length > 0 ? (
          flags.map((flag) => <FlaggedContentCard key={flag.id} flag={flag} />)
        ) : (
          <div className="text-center p-8 bg-slate-800 rounded-lg">
            <p className="text-slate-400">
              The moderation queue is empty. Great job!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
