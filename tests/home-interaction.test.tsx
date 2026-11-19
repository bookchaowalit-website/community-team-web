// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
import { SEED, STORAGE_KEY, rosterStore } from "@/lib/team";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let host: HTMLDivElement;
const $ = <T extends Element = HTMLElement>(selector: string) => host.querySelector(selector) as T | null;
const $$ = (selector: string) => [...host.querySelectorAll<HTMLInputElement>(selector)];
const button = (text: string, scope: ParentNode = host) => [...scope.querySelectorAll("button")].find((b) => b.textContent?.trim().startsWith(text)) as HTMLButtonElement;
const rows = () => [...host.querySelectorAll(".as-row h3")].map((h) => h.textContent);
const press = (el: Element, detail = 0) => act(() => { el.dispatchEvent(new MouseEvent("click", { bubbles: true, detail })); });
function type(el: HTMLInputElement, value: string) {
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
const addButton = () => button("Add", $(".as-composer .as-composer-actions")!);
function addPerson(name: string, role: string, status?: string) {
  press(button("Add person"));
  const [nameField, roleField] = $$(".as-composer input");
  type(nameField, name);
  type(roleField, role);
  if (status) press(button(status, $(".as-composer")!));
  press(addButton());
}

beforeEach(() => {
  localStorage.clear();
  rosterStore.update(() => SEED);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  act(() => root.render(<Home />));
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.useRealTimers();
});

describe("composer", () => {
  it("opens focused, needs both name and role, adds on top and returns focus", () => {
    press(button("Add person"));
    expect(document.activeElement).toBe($(".as-composer input"));
    expect(addButton().disabled).toBe(true);
    type($$(".as-composer input")[0], "Alex");
    expect(addButton().disabled).toBe(true);
    type($$(".as-composer input")[1], "Product design");
    press(button("Available", $(".as-composer")!));
    press(addButton());
    expect(rows()).toEqual(["Alex", "Book"]);
    expect(document.activeElement?.textContent).toContain("Add person");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)[0]).toMatchObject({ name: "Alex", role: "Product design", status: "Available" });
  });

  it("adding from another list switches to the new person's list; Cancel adds nothing", () => {
    press(button("Available", $(".as-side")!));
    expect(host.textContent).toContain("No one is Available yet");
    addPerson("Sam", "Writing");
    expect($("h1")!.textContent).toBe("Collaborator");
    press(button("Add person"));
    type($$(".as-composer input")[0], "never");
    press(button("Cancel"));
    expect(rows()).not.toContain("never");
  });

  it("still adds without crypto.randomUUID", () => {
    vi.stubGlobal("crypto", {});
    try {
      addPerson("Plain", "HTTP");
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)[0].id).toMatch(/^person-\d+-[a-z0-9]+$/);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("search, remove and undo", () => {
  it("search shows a way back when nothing matches", () => {
    type($<HTMLInputElement>(".as-search input")!, "zzz");
    expect(host.textContent).toContain("Nothing matches");
    press(button("Clear search"));
    expect(document.activeElement).toBe($(".as-search input"));
    expect(rows()).toEqual(["Book"]);
  });

  it("Remove is a labelled button with Undo that restores in place", () => {
    addPerson("Alex", "Design");
    press($('[aria-label="Remove Alex"]')!);
    expect(rows()).toEqual(["Book"]);
    expect(document.activeElement).toBe(button("Undo"));
    press(button("Undo"));
    expect(rows()).toEqual(["Alex", "Book"]);
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Remove Alex");
  });

  it("Escape and the timer close the toast; an empty roster says how to start", () => {
    addPerson("Alex", "Design");
    press($('[aria-label="Remove Alex"]')!);
    act(() => { $(".as-toast")!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); });
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Remove Book");
    vi.useFakeTimers();
    press($('[aria-label="Remove Book"]')!, 1);
    act(() => { vi.advanceTimersByTime(6100); });
    expect($(".as-toast")).toBeNull();
    expect(host.textContent).toContain("The roster is empty");
  });
});
