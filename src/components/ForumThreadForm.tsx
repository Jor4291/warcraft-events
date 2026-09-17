"use client";

import { useState } from "react";
import { createForumThread } from "@/lib/actions";
import { FORUM_BODY_MAX, FORUM_TITLE_MAX, FORUMS } from "@/lib/forum";

export function ForumThreadForm({ forumId = "general" }: { forumId?: string }) {
  const [error, setError] = useState("");

  return (
    <form
      className="space-y-4"
      action={async (formData) => {
        setError("");
        const result = await createForumThread(formData);
        if (result && "error" in result && result.error) {
          setError(result.error);
        }
      }}
    >
      <label className="block text-sm">
        Forum
        <select name="forumId" defaultValue={forumId} className="tavern-input">
          {FORUMS.map((forum) => (
            <option key={forum.id} value={forum.id}>
              {forum.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Topic
        <input name="title" required maxLength={FORUM_TITLE_MAX} className="tavern-input" />
      </label>
      <label className="block text-sm">
        First post
        <textarea name="body" required rows={8} maxLength={FORUM_BODY_MAX} className="tavern-input" />
      </label>
      {error ? <p className="text-red-300">{error}</p> : null}
      <button type="submit" className="tavern-btn">
        Post topic
      </button>
    </form>
  );
}
