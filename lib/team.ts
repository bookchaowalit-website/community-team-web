// Team roster: the page's data, list rules and its localStorage store.
// Everything here is pure or works through a storage object passed in, so it can be tested without a browser.

export const STATUSES = ["Core", "Collaborator", "Available"] as const;
export type Status = (typeof STATUSES)[number];
export type Person = { id: string; name: string; role: string; status: Status };
export type PersonDraft = { name: string; role: string; status: Status };

export const STORAGE_KEY = "team-v2";
export const SEED: Person[] = [{ id: "book", name: "Book", role: "Founder / Eng", status: "Core" }];

function isPerson(value: unknown): value is Person {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === "string" &&
    typeof entry.name === "string" &&
    typeof entry.role === "string" &&
    (STATUSES as readonly unknown[]).includes(entry.status)
  );
}

/** Saved roster, or null when nothing usable is saved. Entries of the wrong shape or status are dropped. */
export function parsePeople(raw: string | null): Person[] | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter(isPerson) : null;
  } catch {
    return null;
  }
}

export function serializePeople(people: Person[]): string {
  return JSON.stringify(people);
}

export function filterPeople(people: Person[], query: string): Person[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return people;
  return people.filter((person) => `${person.name} ${person.role} ${person.status}`.toLowerCase().includes(needle));
}

/** New person on top; a blank name or role changes nothing (same array back). */
export function addPerson(people: Person[], draft: PersonDraft, id: string): Person[] {
  const name = draft.name.trim();
  const role = draft.role.trim();
  if (!name || !role) return people;
  return [{ id, name, role, status: draft.status }, ...people];
}

export function removePerson(people: Person[], id: string): Person[] {
  return people.filter((person) => person.id !== id);
}

type StorageLike = { getItem(key: string): string | null; setItem(key: string, value: string): void };

/**
 * A store for useSyncExternalStore. The server snapshot is the seed, so the first client render matches the
 * server HTML; the saved roster appears right after hydration. If storage is blocked, the roster lasts for the visit.
 */
export function createRosterStore(getStorage: () => StorageLike | undefined, key = STORAGE_KEY) {
  let current: Person[] = SEED;
  let lastRaw: string | null = null;
  const listeners = new Set<() => void>();

  function getSnapshot(): Person[] {
    let raw: string | null;
    try {
      raw = getStorage()?.getItem(key) ?? null;
    } catch {
      return current;
    }
    if (raw === null || raw === lastRaw) return current;
    lastRaw = raw;
    current = parsePeople(raw) ?? SEED;
    return current;
  }

  function update(change: (people: Person[]) => Person[]) {
    current = change(getSnapshot());
    try {
      const raw = serializePeople(current);
      getStorage()?.setItem(key, raw);
      lastRaw = raw;
    } catch {
      // Storage is full or blocked: keep the roster in memory.
    }
    for (const listener of listeners) listener();
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    if (typeof window !== "undefined") window.addEventListener("storage", listener);
    return () => {
      listeners.delete(listener);
      if (typeof window !== "undefined") window.removeEventListener("storage", listener);
    };
  }

  return { getSnapshot, getServerSnapshot: () => SEED, subscribe, update };
}

export const rosterStore = createRosterStore(() => (typeof window === "undefined" ? undefined : window.localStorage));
