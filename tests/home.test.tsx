import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("home page", () => {
  it("renders the crew workbench, the entry form and the local-only notice", () => {
    const html = renderToString(<Home />);
    expect(html).toContain("People who");
    expect(html).toContain("Pin to roster");
    expect(html).toContain("This is local-only. Nothing is published or synced.");
    expect(html).toContain("LOCAL BROWSER STATE · DEMO-GRADE");
  });

  it("renders the seed roster on the server with every availability mark to choose from", () => {
    const html = renderToString(<Home />);
    expect(html).toContain("Founder / Eng");
    expect(html).toMatch(/1<!-- --> <!-- -->name<!-- --> on the rail/);
    expect(html).toContain('<option>Core</option><option selected="">Collaborator</option><option>Available</option>');
  });
});
