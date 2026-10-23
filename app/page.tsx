"use client";

import { useState, useSyncExternalStore } from "react";
import { STATUSES, addPerson, filterPeople, removePerson, rosterStore, type Status } from "@/lib/team";

export default function Home() {
  const people = useSyncExternalStore(rosterStore.subscribe, rosterStore.getSnapshot, rosterStore.getServerSnapshot);
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<Status>("Collaborator");
  const visible = filterPeople(people, query);
  const pinPerson = () => {
    if (!name.trim() || !role.trim()) return;
    rosterStore.update((current) => addPerson(current, { name, role, status }, crypto.randomUUID()));
    setName(""); setRole(""); setStatus("Collaborator");
  };

  return (
    <main className="crew-room">
      <header className="crew-header">
        <div className="crew-logo">B<span>/</span>CREW</div>
        <div className="crew-header-copy"><span>STUDIO DIRECTORY</span><strong>LOCAL CUT / 01</strong></div>
        <span className="crew-status"><i /> {people.length} {people.length === 1 ? "name" : "names"} on the rail</span>
      </header>
      <section className="crew-intro">
        <div><p className="work-label">THE WORKBENCH</p><h1>People who<br /><em>make the cut.</em></h1></div>
        <p className="intro-copy">A small studio roster, arranged like a work print. Add a person, give them a role, and keep the cut in this browser.</p>
      </section>
      <div className="perforation" aria-hidden="true">{Array.from({ length: 28 }, (_, index) => <i key={index} />)}</div>
      <section className="workbench" aria-label="Team directory">
        <div className="rail-column">
          <div className="rail-heading"><div><p className="work-label">SELECT RAIL</p><h2>Roster</h2></div><span>{visible.length.toString().padStart(2, "0")}</span></div>
          <label className="crew-search"><span>Search the cut</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, role, status" /></label>
          <div className="film-rail">
            {visible.length === 0 ? <p className="empty-rail">No names match this cut.</p> : visible.map((person, index) => (
              <article className="crew-strip" key={person.id}>
                <div className="strip-index">{String(index + 1).padStart(2, "0")}</div>
                <div className="strip-person"><h3>{person.name}</h3><p>{person.role}</p></div>
                <span className={`status-mark ${person.status.toLowerCase()}`}>{person.status}</span>
                <button className="remove-button" aria-label={`Delete ${person.name}`} onClick={() => rosterStore.update((current) => removePerson(current, person.id))}>×</button>
              </article>
            ))}
          </div>
        </div>
        <aside className="clip-board">
          <p className="work-label">NEW ENTRY</p><h2>Pin someone<br /><em>to the rail.</em></h2>
          <p className="board-note">This is local-only. Nothing is published or synced.</p>
          <label><span>Name</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Alex" /></label>
          <label><span>Role / detail</span><input value={role} onChange={(event) => setRole(event.target.value)} placeholder="e.g. Product design" /></label>
          <label><span>Availability mark</span><select value={status} onChange={(event) => setStatus(event.target.value as Status)}>{STATUSES.map((item) => <option key={item}>{item}</option>)}</select></label>
          <button className="pin-button" onClick={pinPerson}>Pin to roster <span>↗</span></button>
        </aside>
      </section>
      <footer className="crew-footer"><span>BOOKCHAOWALIT / TEAM</span><span>LOCAL BROWSER STATE · DEMO-GRADE</span></footer>
    </main>
  );
}
