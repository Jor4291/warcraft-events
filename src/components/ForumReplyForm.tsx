"use client";

import { useState } from "react";
import { replyToForumThread } from "@/lib/actions";
import { FORUM_BODY_MAX } from "@/lib/forum";

export function ForumReplyForm({ slug }: { slug: string }) {
  const [error, setError] = useState("");

  return (
    <form
      className="space-y-4"
      action={async (formData) => {
        setError("");
        const result = await replyToForumThread(formData);
        if (result && "error" in result && result.error) {
          setError(result.error);
        }
      }}
    >
      <input type="hidden" name="slug" value={slug} />
      <label className="block text-sm">
        Reply
        <textarea name="body" required rows={5} maxLength={FORUM_BODY_MAX} className="tavern-input" />
      </label>
      {error ? <p className="text-red-300">{error}</p> : null}
      <button type="submit" className="tavern-btn">
        Send reply
      </button>
    </form>
  );
}
