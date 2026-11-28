import type { MetadataRoute } from "next";

/** The site's own canonical origin, used by metadata, robots.txt and sitemap.xml. */
export const SITE_URL = "https://team.bookchaowalit.com";

export function buildSitemap(base: string = SITE_URL): MetadataRoute.Sitemap {
  return [{ url: base, changeFrequency: "weekly", priority: 1 }];
}

export function buildRobots(base: string = SITE_URL): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: "/api/" }, sitemap: `${base}/sitemap.xml` };
}

/** Shared 1200x630 social card (public/og.png, made with the `art` CLI card template). */
export const OG_IMAGE = { url: "/og.png", width: 1200, height: 630, alt: "Team | Bookchaowalit" } as const;

/** Crawlers cannot fetch an image from a loopback or plain-http origin, so those builds announce no image card. */
export function isShareableOrigin(url: string): boolean {
  const { protocol, hostname } = new URL(url);
  const loopback = hostname === "localhost" || hostname.endsWith(".localhost") || hostname === "[::1]" || /^127\./.test(hostname) || hostname === "0.0.0.0";
  return protocol === "https:" && !loopback;
}

/** Image fields every page's openGraph / twitter metadata spreads in (a small text card when the origin is not shareable). */
export const SOCIAL_CARD = isShareableOrigin(SITE_URL)
  ? { openGraph: { images: [OG_IMAGE] }, twitter: { card: "summary_large_image" as const, images: [OG_IMAGE.url] } }
  : { openGraph: {}, twitter: { card: "summary" as const } };
