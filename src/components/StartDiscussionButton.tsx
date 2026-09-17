"use client";

import { useState } from "react";
import { openEventDiscussion } from "@/lib/actions";

export function StartDiscussionButton({ slug }: { slug: string }) {
  const [error, setError] = useState("");

  return (
    <form
      action={async (formData) => {
        setError("");
        const result = await openEventDiscussion(formData);
        if (result && "error" in result && result.error) {
          setError(result.error);
        }
      }}
    >
      <input type="hidden" name="slug" value={slug} />
      {error ? <p className="mb-2 text-sm text-red-300">{error}</p> : null}
      <button type="submit" className="tavern-btn">
        Start a discussion
      </button>
    </form>
  );
}
