"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { AppFoot, AppTop, ListButton, Pill, PlusIcon, type Tone } from "@/components/app-shell";
import { STATUSES, addPerson, peopleIn, restorePerson, rosterStore, type Filter, type Person, type PersonDraft as Draft, type Status } from "@/lib/team";

const EMPTY_DRAFT: Draft = { name: "", role: "", status: "Collaborator" };

// beforeId: the person that followed it when it was removed. nextShown / prevShown: the rows shown around it, for focus.
type RemovedEntry = { person: Person; beforeId: string | null; nextShown?: string; prevShown?: string };
type RemovedBatch = { entries: RemovedEntry[]; viaKeyboard: boolean };
const removedLabel = (entries: RemovedEntry[]) => (entries.length === 1 ? `Removed ${entries[0].person.name}` : `Removed ${entries.length} people`);

const TONE: Record<Status, Tone> = { Core: "green", Collaborator: "amber", Available: "grey" };
const FILTERS: Filter[] = ["All", ...STATUSES];

// randomUUID only exists in secure contexts (HTTPS/localhost) and newer browsers.
function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `person-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function Home() {
  const people = useSyncExternalStore(rosterStore.subscribe, rosterStore.getSnapshot, rosterStore.getServerSnapshot);
  const setPeople = rosterStore.update;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  // Every removal still inside the Undo window: one Undo puts them all back where they were.
  const [removed, setRemovedState] = useState<RemovedBatch | null>(null);
  // The latest batch, so two removals before a re-render still both land in it.
  const removedRef = useRef<RemovedBatch | null>(null);
  const setRemoved = (batch: RemovedBatch | null) => { removedRef.current = batch; setRemovedState(batch); };
  const [toastFocused, setToastFocused] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);
  const newRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const undoRef = useRef<HTMLButtonElement>(null);
  const toastRef = useRef<HTMLDivElement>(null);
  const wasComposing = useRef(false);
  const focusNext = useRef<string[] | null>(null);
  const visible = useMemo(() => peopleIn(people, filter, query), [people, filter, query]);
  const countOf = (value: Filter) => (value === "All" ? people.length : people.filter((item) => item.status === value).length);

  // Opening the composer focuses the title; closing it returns focus to Add person.
  useEffect(() => {
    if (composing) titleRef.current?.focus();
    else if (wasComposing.current) newRef.current?.focus();
    wasComposing.current = composing;
  }, [composing]);
  useEffect(() => { if (removed?.viaKeyboard) undoRef.current?.focus(); }, [removed]);
  // After the toast closes, focus goes to the nearest row still shown, else Add person.
  useEffect(() => {
    const ids = focusNext.current;
    if (removed || !ids) return;
    focusNext.current = null;
    const rows = [...document.querySelectorAll<HTMLElement>(".as-row[data-person]")];
    const row = ids.map((id) => rows.find((r) => r.dataset.person === id)).find(Boolean);
    (row?.querySelector<HTMLButtonElement>(".as-danger") ?? newRef.current ?? titleRef.current)?.focus();
  }, [removed, people]);
  // Reserve the toast's height at the bottom so a control focused behind it scrolls clear.
  const toastShown = removed !== null;
  useLayoutEffect(() => {
    const toast = toastRef.current;
    if (!toastShown || !toast) return;
    const rootStyle = document.documentElement.style;
    const reserve = () => rootStyle.setProperty("--as-toast-space", `${toast.offsetHeight + 32}px`);
    reserve();
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(reserve) : null;
    observer?.observe(toast);
    return () => { observer?.disconnect(); rootStyle.removeProperty("--as-toast-space"); };
  }, [toastShown]);
  // The toast closes 6 s after the latest removal (each removal restarts it), but never while it holds focus.
  useEffect(() => {
    if (!removed || toastFocused) return;
    const timer = window.setTimeout(() => { removedRef.current = null; setRemovedState(null); }, 6000);
    return () => window.clearTimeout(timer);
  }, [removed, toastFocused]);

  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = addPerson(people, draft, createId());
    if (next === people) return;
    const person = next[0];
    setPeople((items) => [person, ...items]);
    const status = person.status as Status;
    if (filter !== "All" && filter !== status) setFilter(status);
    setQuery("");
    setAnnouncement(`Added ${person.name} to the roster.`);
    setDraft(EMPTY_DRAFT);
    setComposing(false);
  }
  function clearSearch() {
    setQuery("");
    searchRef.current?.focus();
  }
  function remove(person: Person, viaKeyboard: boolean) {
    const index = people.findIndex((item) => item.id === person.id);
    if (index < 0) return;
    const shownAt = visible.findIndex((item) => item.id === person.id);
    setPeople((items) => items.filter((item) => item.id !== person.id));
    const entry: RemovedEntry = { person, beforeId: people[index + 1]?.id ?? null, nextShown: visible[shownAt + 1]?.id, prevShown: shownAt > 0 ? visible[shownAt - 1].id : undefined };
    const entries = [...(removedRef.current?.entries ?? []), entry];
    setRemoved({ entries, viaKeyboard });
    setAnnouncement(entries.length === 1 ? `Removed ${person.name}. Undo is available for a few seconds.` : `Removed ${entries.length} people. Undo is available for a few seconds.`);
  }
  function closeToast(ids?: string[]) {
    const last = removedRef.current?.entries.at(-1);
    // Dismissed: the row after the removed one, else the one before it.
    focusNext.current = ids ?? [last?.nextShown, last?.prevShown].filter((id): id is string => Boolean(id));
    setRemoved(null);
    setToastFocused(false);
  }
  function undo() {
    const entries = removedRef.current?.entries;
    if (!entries?.length) return;
    // Latest removal first: each goes back before the person that followed it when it was removed.
    setPeople((current) => entries.reduceRight((list, { person, beforeId }) => restorePerson(list, person, beforeId), current));
    const latest = entries[entries.length - 1].person;
    setAnnouncement(entries.length === 1 ? `Restored ${latest.name}.` : `Restored ${entries.length} people.`);
    // Undone: back to the restored row the user removed last.
    closeToast([latest.id]);
  }

  const title = filter === "All" ? "Everyone" : filter;

  return (
    <div className="as">
      <a className="as-skip" href="#main">Skip to content</a>
      <AppTop name="Team" tagline="A small studio roster" />

      <div className="as-body">
        <aside className="as-side" aria-label="Lists">
          <h2>Roster</h2>
          <ul className="as-lists">
            {FILTERS.map((value) => (
              <ListButton key={value} label={value === "All" ? "Everyone" : value} count={countOf(value)} tone={value === "All" ? undefined : TONE[value]} current={filter === value} onSelect={() => setFilter(value)} />
            ))}
          </ul>
        </aside>

        <main id="main" className="as-main">
          <div className="as-head">
            <div>
              <h1>{title}</h1>
              <p aria-live="polite">{visible.length} {visible.length === 1 ? "person" : "people"}{query.trim() ? ` matching “${query.trim()}”` : ""}</p>
            </div>
            <div className="as-tools">
              <label className="as-search">
                <span className="as-sr">Search people</span>
                <input ref={searchRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" />
              </label>
              {composing ? null : <button ref={newRef} type="button" className="as-button" onClick={() => setComposing(true)}><PlusIcon />Add person</button>}
            </div>
          </div>

          {composing ? (
            <form className="as-composer" onSubmit={add} aria-label="Add a person">
              <label className="as-field">Name
                <input ref={titleRef} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="e.g. Alex" autoComplete="off" required />
              </label>
              <label className="as-field">Role
                <input value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value })} placeholder="e.g. Product design" autoComplete="off" required />
              </label>
              <div className="as-composer-foot">
                <div className="as-segmented-wrap">
                  <span id="state-label">Availability</span>
                  <div className="as-segmented" role="group" aria-labelledby="state-label">
                    {STATUSES.map((status) => (
                      <button key={status} type="button" aria-pressed={draft.status === status} onClick={() => setDraft({ ...draft, status })}>{status}</button>
                    ))}
                  </div>
                </div>
                <div className="as-composer-actions">
                  <button type="button" className="as-plain" onClick={() => { setComposing(false); setDraft(EMPTY_DRAFT); }}>Cancel</button>
                  <button type="submit" className="as-button" disabled={!draft.name.trim() || !draft.role.trim()}>Add</button>
                </div>
              </div>
            </form>
          ) : null}

          {visible.length ? (
            <ul className="as-list" aria-label={title}>
              {visible.map((person) => (
                <li className="as-row" key={person.id} data-person={person.id}>
                  <div>
                    <h3>{person.name}</h3>
                    <p className="as-row-detail">{person.role}</p>
                  </div>
                  <Pill tone={TONE[person.status as Status] ?? "grey"}>{person.status}</Pill>
                  <button type="button" className="as-plain as-danger" aria-label={`Remove ${person.name}`} onClick={(event) => remove(person, event.detail === 0)}>Remove</button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="as-list as-empty">
              {query.trim() ? (
                <>
                  <strong>Nothing matches</strong>
                  No one in {filter === "All" ? "the roster" : title} mentions “{query.trim()}”.
                  <div className="as-actions-row tm-center"><button type="button" className="as-plain" onClick={clearSearch}>Clear search</button></div>
                </>
              ) : people.length === 0 ? (
                <><strong>The roster is empty</strong>Press Add person to put the first name on it.</>
              ) : (
                <><strong>No one is {title} yet</strong>Press Add person and pick {title} to add someone here.</>
              )}
            </div>
          )}

          <p className="as-note">Saved in this browser only. Nothing is published or synced; this is a demo roster, not a staff directory.</p>
        </main>
      </div>

      <p className="as-sr" role="status" aria-live="polite">{announcement}</p>
      {removed ? (
        <div
          ref={toastRef}
          className="as-toast"
          role="group"
          aria-label="Undo remove"
          onFocus={() => setToastFocused(true)}
          onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setToastFocused(false); }}
          onKeyDown={(event) => { if (event.key === "Escape") closeToast(); }}
        >
          <span>{removedLabel(removed.entries)}</span>
          <button ref={undoRef} type="button" className="as-plain" onClick={undo} aria-label={removed.entries.length === 1 ? "Undo remove" : `Undo remove of ${removed.entries.length} people`}>Undo</button>
        </div>
      ) : null}

      <AppFoot source="https://github.com/bookchaowalit-website/community-team-web" />
    </div>
  );
}
