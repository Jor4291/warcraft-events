"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  addCoHost,
  cancelEvent,
  duplicateEvent,
  promoteWaitlist,
  removeCoHost,
  removeSignup,
  sendSignupsToBracket,
  toggleCheckIn,
  updateEvent,
} from "@/lib/actions";
import { toDatetimeLocalValue } from "@/lib/event-when";
import { confirmedSignups, rosterExport, signupSpotsLabel, waitlistedSignups } from "@/lib/signup-form";
import type { EventRecord, EventSignup } from "@/lib/types";
import { EventCopyEditor } from "./EventCopyEditor";
import { EventLinksBuilder } from "./EventLinksBuilder";
import { SignupFormBuilder } from "./SignupFormBuilder";

function toDatetimeLocal(value: string) {
  return toDatetimeLocalValue(value);
}

export function EventManage({ event, editKey, isOwner }: { event: EventRecord; editKey: string; isOwner: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const confirmed = confirmedSignups(event);
  const waiting = waitlistedSignups(event);

  return (
    <section className="tavern-frame space-y-5 p-5">
      <div>
        <h2 className="tavern-title text-xl">Host controls</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Edit the listing, manage the roster, or send names to the bracket.{" "}
          {event.signupMode === "invite" ? (
            <>
              Invite code: <code className="text-[var(--gold)]">{event.inviteCode}</code>
            </>
          ) : (
            "Sign-up is open to anyone who finds this event."
          )}
        </p>
        {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
        {message ? <p className="mt-2 text-sm text-emerald-300">{message}</p> : null}
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
        <div className="block text-sm md:col-span-2">
          Description
          <div className="mt-1">
            <EventCopyEditor name="description" defaultValue={event.description} rows={6} />
          </div>
        </div>
        <fieldset className="md:col-span-2">
          <legend className="text-sm text-[var(--muted)]">Links</legend>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Discord for voice comms, a stream, a rules doc — anything attendees should open.
          </p>
          <div className="mt-2">
            <EventLinksBuilder initialLinks={event.links} />
          </div>
        </fieldset>
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
        <label className="block text-sm md:col-span-2">
          Player cap
          <input
            name="signupCap"
            type="number"
            min={0}
            max={1000}
            defaultValue={event.signupCap || ""}
            placeholder="Leave blank for no cap"
            className="tavern-input max-w-xs"
          />
          <span className="mt-1 block text-xs text-[var(--muted)]">
            Once confirmed seats hit this number, new players join the waitlist or see that sign-ups are filled.
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm md:col-span-2">
          <input type="checkbox" name="waitlistEnabled" defaultChecked={event.waitlistEnabled} className="mt-1" />
          <span>
            Enable waitlist
            <span className="mt-1 block text-xs text-[var(--muted)]">
              When the cap is full, new players can still join a waitlist. Promote them when a seat opens.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm md:col-span-2">
          <input type="checkbox" name="rosterPublic" defaultChecked={event.rosterPublic} className="mt-1" />
          <span>
            Show player names on the public page
            <span className="mt-1 block text-xs text-[var(--muted)]">
              Uncheck to keep the roster private. Hosts and co-hosts still see names and answers.
            </span>
          </span>
        </label>
        <div className="md:col-span-2">
          <h3 className="text-sm uppercase tracking-[0.18em] text-[var(--gold)]">Sign-up questions</h3>
          <p className="mt-1 mb-3 text-sm text-[var(--muted)]">
            These questions appear on the public sign-up form. Character name is always required.
          </p>
          <SignupFormBuilder key={event.signupFields.map((field) => field.id).join("-") || "empty"} initialFields={event.signupFields} />
        </div>
        {error ? <p className="text-red-300 md:col-span-2">{error}</p> : null}
        {message ? <p className="text-emerald-300 md:col-span-2">{message}</p> : null}
        <div className="md:col-span-2">
          <button type="submit" className="tavern-btn">
            Save changes
          </button>
        </div>
      </form>

      {isOwner ? (
        <div>
          <h3 className="text-sm uppercase tracking-[0.18em] text-[var(--gold)]">Co-hosts</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Co-hosts can edit the listing, roster, and bracket. They cannot add other co-hosts.
          </p>
          {event.coHosts.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--muted)]">No co-hosts yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {event.coHosts.map((host) => (
                <li key={host.userId} className="flex items-center justify-between gap-3 border border-[var(--line)] p-3 text-sm">
                  <span>
                    <span className="font-semibold">{host.displayName}</span>
                    {host.email ? <span className="text-[var(--muted)]"> · {host.email}</span> : null}
                  </span>
                  <form
                    action={async (formData) => {
                      await removeCoHost(formData);
                    }}
                  >
                    <input type="hidden" name="slug" value={event.slug} />
                    <input type="hidden" name="editKey" value={editKey} />
                    <input type="hidden" name="userId" value={host.userId} />
                    <button type="submit" className="text-[var(--muted)] hover:text-[var(--gold)]">
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <form
            className="mt-3 flex flex-wrap gap-2"
            action={async (formData) => {
              setError("");
              setMessage("");
              const result = await addCoHost(formData);
              if (result && "error" in result && result.error) {
                setError(result.error);
                return;
              }
              setMessage("Co-host added.");
            }}
          >
            <input type="hidden" name="slug" value={event.slug} />
            <input type="hidden" name="editKey" value={editKey} />
            <input name="email" placeholder="Account email or display name" className="tavern-input max-w-sm" />
            <button type="submit" className="tavern-btn-ghost">
              Add co-host
            </button>
          </form>
        </div>
      ) : event.coHosts.length > 0 ? (
        <p className="text-sm text-[var(--muted)]">
          Co-hosts: {event.coHosts.map((host) => host.displayName).join(", ")}
        </p>
      ) : null}

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm uppercase tracking-[0.18em] text-[var(--gold)]">
            Roster · {signupSpotsLabel(event)}
          </h3>
          <div className="flex flex-wrap gap-2">
            {event.signups.length > 0 ? (
              <button
                type="button"
                className="tavern-btn-ghost px-3 py-1 text-sm"
                onClick={async () => {
                  await navigator.clipboard.writeText(rosterExport(event));
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1600);
                }}
              >
                {copied ? "Copied" : "Copy roster"}
              </button>
            ) : null}
            <form
              action={async (formData) => {
                if (!window.confirm("This rebuilds the bracket from the current roster and clears winners.")) {
                  return;
                }
                setError("");
                setMessage("");
                const result = await sendSignupsToBracket(formData);
                if (result && "error" in result && result.error) {
                  setError(result.error);
                  return;
                }
                setMessage("Bracket rebuilt from the roster.");
              }}
            >
              <input type="hidden" name="slug" value={event.slug} />
              <input type="hidden" name="editKey" value={editKey} />
              <button type="submit" className="tavern-btn-ghost px-3 py-1 text-sm">
                Send to bracket
              </button>
            </form>
          </div>
        </div>
        {confirmed.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">Nobody on the roster yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {confirmed.map((signup) => (
              <SignupRow
                key={signup.id}
                event={event}
                signup={signup}
                editKey={editKey}
                waitlisted={false}
                onError={setError}
              />
            ))}
          </ul>
        )}
      </div>

      {event.waitlistEnabled || waiting.length > 0 ? (
        <div>
          <h3 className="text-sm uppercase tracking-[0.18em] text-[var(--gold)]">Waitlist · {waiting.length}</h3>
          {waiting.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--muted)]">The waitlist is empty.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {waiting.map((signup) => (
                <SignupRow
                  key={signup.id}
                  event={event}
                  signup={signup}
                  editKey={editKey}
                  waitlisted
                  onError={setError}
                />
              ))}
            </ul>
          )}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <form
          action={async (formData) => {
            if (!window.confirm("Copy this event as a new listing with an empty roster?")) {
              return;
            }
            setError("");
            const result = await duplicateEvent(formData);
            if (result && "error" in result && result.error) {
              setError(result.error);
              return;
            }
            if (result && "slug" in result && result.slug) {
              router.push(`/events/${result.slug}`);
            }
          }}
        >
          <input type="hidden" name="slug" value={event.slug} />
          <input type="hidden" name="editKey" value={editKey} />
          <button type="submit" className="tavern-btn-ghost">
            Duplicate event
          </button>
        </form>
        {event.cancelledAt ? (
          <p className="self-center text-sm text-[var(--muted)]">This event is cancelled.</p>
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
      </div>
    </section>
  );
}

function SignupRow({
  event,
  signup,
  editKey,
  waitlisted,
  onError,
}: {
  event: EventRecord;
  signup: EventSignup;
  editKey: string;
  waitlisted: boolean;
  onError: (message: string) => void;
}) {
  return (
    <li className="border border-[var(--line)] p-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">
            {signup.name}
            {signup.checkedIn ? <span className="ml-2 text-xs uppercase tracking-[0.14em] text-[var(--gold)]">Checked in</span> : null}
          </p>
          {event.signupFields.map((field) =>
            signup.answers[field.id] ? (
              <p key={field.id} className="mt-1 text-[var(--muted)]">
                <span className="text-[var(--gold)]">{field.label}:</span> {signup.answers[field.id]}
              </p>
            ) : null,
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          {waitlisted ? (
            <form
              action={async (formData) => {
                const result = await promoteWaitlist(formData);
                if (result && "error" in result && result.error) {
                  onError(result.error);
                }
              }}
            >
              <input type="hidden" name="slug" value={event.slug} />
              <input type="hidden" name="editKey" value={editKey} />
              <input type="hidden" name="signupId" value={signup.id} />
              <button type="submit" className="text-[var(--muted)] hover:text-[var(--gold)]">
                Promote
              </button>
            </form>
          ) : (
            <form
              action={async (formData) => {
                await toggleCheckIn(formData);
              }}
            >
              <input type="hidden" name="slug" value={event.slug} />
              <input type="hidden" name="editKey" value={editKey} />
              <input type="hidden" name="signupId" value={signup.id} />
              <button type="submit" className="text-[var(--muted)] hover:text-[var(--gold)]">
                {signup.checkedIn ? "Undo check-in" : "Check in"}
              </button>
            </form>
          )}
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
        </div>
      </div>
    </li>
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
