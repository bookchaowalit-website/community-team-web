import { describe, expect, it, vi } from "vitest";
import {
  SEED,
  STORAGE_KEY,
  addPerson,
  createRosterStore,
  filterPeople,
  parsePeople,
  removePerson,
  serializePeople,
  type Person,
} from "@/lib/team";

const person = (overrides: Partial<Person> = {}): Person => ({ id: "x", name: "Alex", role: "Product design", status: "Collaborator", ...overrides });

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return { data, getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => void data.set(key, value) };
}

describe("parsePeople", () => {
  it("returns null for missing, malformed or non-array JSON", () => {
    expect(parsePeople(null)).toBeNull();
    expect(parsePeople("")).toBeNull();
    expect(parsePeople("{oops")).toBeNull();
    expect(parsePeople('{"name":"A"}')).toBeNull();
  });

  it("drops entries of the wrong shape, including an unknown or missing status", () => {
    const raw = JSON.stringify([person({ id: "a" }), { id: "b", name: "B", role: "R" }, person({ id: "c", status: "Boss" as Person["status"] }), 7, person({ id: "d", status: "Core" })]);
    expect(parsePeople(raw)?.map((entry) => entry.id)).toEqual(["a", "d"]);
  });

  it("round-trips through serializePeople, including an empty roster", () => {
    const people = [person({ id: "a" }), person({ id: "b", status: "Available" })];
    expect(parsePeople(serializePeople(people))).toEqual(people);
    expect(parsePeople(serializePeople([]))).toEqual([]);
  });
});

describe("roster logic", () => {
  const people = [person({ id: "a", name: "Book", role: "Founder / Eng", status: "Core" }), person({ id: "b", name: "Mai", role: "Illustration", status: "Available" })];

  it("searches name, role and status without case", () => {
    expect(filterPeople(people, "book").map((entry) => entry.id)).toEqual(["a"]);
    expect(filterPeople(people, "ILLUS").map((entry) => entry.id)).toEqual(["b"]);
    expect(filterPeople(people, "available").map((entry) => entry.id)).toEqual(["b"]);
    expect(filterPeople(people, " ")).toEqual(people);
    expect(filterPeople(people, "nobody")).toEqual([]);
  });

  it("pins a trimmed person to the top and needs both name and role", () => {
    const next = addPerson(people, { name: " Kim ", role: " Sound ", status: "Collaborator" }, "k1");
    expect(next[0]).toEqual({ id: "k1", name: "Kim", role: "Sound", status: "Collaborator" });
    expect(next).toHaveLength(3);
    expect(addPerson(people, { name: "Kim", role: "  ", status: "Core" }, "k2")).toBe(people);
    expect(addPerson(people, { name: "", role: "Sound", status: "Core" }, "k3")).toBe(people);
  });

  it("removes a person by id", () => {
    expect(removePerson(people, "a").map((entry) => entry.id)).toEqual(["b"]);
    expect(removePerson(people, "zzz")).toEqual(people);
  });
});

describe("createRosterStore", () => {
  it("serves the seed on the server and when nothing is saved", () => {
    const store = createRosterStore(() => fakeStorage());
    expect(store.getServerSnapshot()).toBe(SEED);
    expect(store.getSnapshot()).toBe(SEED);
  });

  it("drops corrupt saved entries and falls back to the seed for a non-list, instead of crashing the page", () => {
    expect(createRosterStore(() => fakeStorage({ [STORAGE_KEY]: '[{"id":"1","name":"No status"}]' })).getSnapshot()).toEqual([]);
    expect(createRosterStore(() => fakeStorage({ [STORAGE_KEY]: '"text"' })).getSnapshot()).toBe(SEED);
  });

  it("returns the same array while storage is unchanged", () => {
    const store = createRosterStore(() => fakeStorage({ [STORAGE_KEY]: serializePeople([person()]) }));
    const first = store.getSnapshot();
    expect(store.getSnapshot()).toBe(first);
    expect(first).toEqual([person()]);
  });

  it("writes updates to storage and notifies subscribers", () => {
    const storage = fakeStorage();
    const store = createRosterStore(() => storage);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.update((current) => addPerson(current, { name: "Kim", role: "Sound", status: "Available" }, "k"));
    expect(listener).toHaveBeenCalledTimes(1);
    expect(parsePeople(storage.data.get(STORAGE_KEY) ?? null)?.map((entry) => entry.id)).toEqual(["k", "book"]);
    unsubscribe();
    store.update((current) => current);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("keeps working in memory when storage throws", () => {
    const blocked = () => {
      throw new Error("blocked");
    };
    const store = createRosterStore(() => ({ getItem: blocked, setItem: blocked }));
    expect(store.getSnapshot()).toBe(SEED);
    store.update(() => [person({ id: "mem" })]);
    expect(store.getSnapshot().map((entry) => entry.id)).toEqual(["mem"]);
  });
});
