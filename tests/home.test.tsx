import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
import RootLayout, { metadata } from "@/app/layout";

vi.mock("next/font/google", () => ({ Geist: () => ({ variable: "font-geist" }) }));

describe("home page", () => {
  it("renders the seed roster, the availability lists and the local-only note on the App shell", () => {
    const html = renderToString(<Home />);
    expect(html).toContain("<h1>Everyone</h1>");
    expect(html).toContain("Founder / Eng");
    expect(html).toMatch(/Everyone<\/span><span class="as-count">1</);
    expect(html).toContain("1<!-- --> <!-- -->person");
    expect(html).toContain("Add person");
    expect(html).toContain("Nothing is published or synced");
    expect(html).toContain('href="https://bookchaowalit.com/"');
  });

  it("puts the font variable on <html> and the site's own domain in metadata", () => {
    const html = renderToString(<RootLayout><p>child</p></RootLayout>);
    expect(html).toContain('<html lang="en" class="font-geist"');
    expect(String(metadata.metadataBase)).toBe("https://team.bookchaowalit.com/");
  });
});
