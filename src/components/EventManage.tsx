"use client";

import { useState } from "react";
import { cancelEvent, removeSignup, updateEvent } from "@/lib/actions";
import type { EventRecord } from "@/lib/types";

function toDatetimeLocal(value: string) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.length >= 16 ? value.slice(0, 16) : value;
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function EventManage({ event, editKey }: { event: EventRecord; editKey: string }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  return (
    <section className="tavern-frame space-y-5 p-5">
      <div>
        <h2 className="tavern-title text-xl">Host controls</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Edit the listing, change how people join, or cancel.{" "}
          {event.signupMode === "invite" ? (
            <>
              Invite code: <code className="text-[var(--gold)]">{event.inviteCode}</code>
            </>
          ) : (
            "Sign-up is open to anyone who finds this event."
          )}
        </p>
      </div>
      <form
        className="grid gap-3 md:grid-cols-2"
        action={async (formData) => {
          setError("");
          setMessage("");
          const result = await updateEvent(formData);
          if (result && "error" in result && result.error) {
            setError(result.error);
            return;
          }
          setMessage("Event updated.");
        }}
      >
        <input type="hidden" name="slug" value={event.slug} />
        <input type="hidden" name="editKey" value={editKey} />
        <Field label="Title" name="title" defaultValue={event.title} required />
        <Field label="Game" name="game" defaultValue={event.game} />
        <Field label="Format" name="format" defaultValue={event.format} />
        <Field label="Region" name="region" defaultValue={event.region} />
        <Field label="Starts" name="startsAt" type="datetime-local" defaultValue={toDatetimeLocal(event.startsAt)} />
        <Field label="Ends" name="endsAt" type="datetime-local" defaultValue={toDatetimeLocal(event.endsAt)} />
        <Field label="Location" name="location" defaultValue={event.location} />
        <Field label="Contact" name="contact" defaultValue={event.contact} />
        <label className="block text-sm md:col-span-2">
          Description
          <textarea name="description" rows={4} defaultValue={event.description} className="tavern-input" />
        </label>
        <fieldset className="md:col-span-2">
          <legend className="text-sm text-[var(--muted)]">Who can sign up</legend>
          <div className="mt-2 flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" name="signupMode" value="open" defaultChecked={event.signupMode === "open"} />
              Open sign-up
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="signupMode" value="invite" defaultChecked={event.signupMode === "invite"} />
              Invite by code
            </label>
          </div>
        </fieldset>
        {error ? <p className="text-red-300 md:col-span-2">{error}</p> : null}
        {message ? <p className="text-emerald-300 md:col-span-2">{message}</p> : null}
        <div className="md:col-span-2">
          <button type="submit" className="tavern-btn">
            Save changes
          </button>
        </div>
      </form>
      {event.signups.length > 0 ? (
        <div>
          <h3 className="text-sm uppercase tracking-[0.18em] text-[var(--gold)]">Sign-ups</h3>
          <ul className="mt-2 space-y-2">
            {event.signups.map((signup) => (
              <li key={signup.id} className="flex items-center justify-between gap-3 text-sm">
                <span>{signup.name}</span>
                <form
                  action={async (formData) => {
                    await removeSignup(formData);
                  }}
                >
                  <input type="hidden" name="slug" value={event.slug} />
                  <input type="hidden" name="editKey" value={editKey} />
                  <input type="hidden" name="signupId" value={signup.id} />
                  <button type="submit" className="text-[var(--muted)] hover:text-[var(--gold)]">
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {event.cancelledAt ? (
        <p className="text-sm text-[var(--muted)]">This event is cancelled.</p>
      ) : (
        <form
          action={async (formData) => {
            if (!window.confirm("Cancel this event? It will stay listed as cancelled.")) {
              return;
            }
            await cancelEvent(formData);
          }}
        >
          <input type="hidden" name="slug" value={event.slug} />
          <input type="hidden" name="editKey" value={editKey} />
          <button type="submit" className="tavern-btn-ghost">
            Cancel event
          </button>
        </form>
      )}
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      {label}
      <input name={name} type={type} defaultValue={defaultValue} required={required} className="tavern-input" />
    </label>
  );
}
