import type { Metadata } from "next";

/**
 * Resolves the canonical public origin for metadataBase, OpenGraph, and Twitter URLs.
 * Automatically ignores leftover placeholder values (e.g. "your-project.vercel.app")
 * and resolves the live Vercel domain so social/WhatsApp previews always fetch valid images.
 */
export function getSiteUrl(): string {
  const configured = (process.env.NEXT_PUBLIC_APP_URL || "").trim();
  const isPlaceholder =
    !configured ||
    /your-project|your-vercel|example\.com/i.test(configured) ||
    (Boolean(process.env.VERCEL) && /localhost/i.test(configured));

  const raw = !isPlaceholder
    ? configured
    : process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://lamsparks.vercel.app";

  return raw.replace(/\/+$/, "");
}

export const SITE_NAME = "LamSparks Photography";
export const DEFAULT_OG_IMAGE = "/og/home.jpg";

interface BuildMetadataInput {
  title: string;
  description: string;
  path?: string;
  image?: string;
  imageAlt?: string;
  keywords?: string[];
  noIndex?: boolean;
  absoluteTitle?: boolean;
}

export function buildPageMetadata({
  title,
  description,
  path = "/",
  image = DEFAULT_OG_IMAGE,
  imageAlt = "LamSparks Photography Atelier · Abuja, Nigeria",
  keywords,
  noIndex = false,
  absoluteTitle = false,
}: BuildMetadataInput): Metadata {
  const siteUrl = getSiteUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const fullUrl = `${siteUrl}${normalizedPath === "/" ? "" : normalizedPath}`;
  const fullOgTitle = title.includes("LamSparks") ? title : `${title} | ${SITE_NAME}`;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: {
      canonical: fullUrl,
    },
    ...(noIndex
      ? {
          robots: {
            index: false,
            follow: false,
          },
        }
      : {
          robots: {
            index: true,
            follow: true,
            googleBot: {
              index: true,
              follow: true,
              "max-image-preview": "large",
              "max-snippet": -1,
            },
          },
        }),
    openGraph: {
      title: fullOgTitle,
      description,
      url: fullUrl,
      siteName: `${SITE_NAME} · Abuja`,
      locale: "en_NG",
      type: "website",
      images: [
        {
          url: `${siteUrl}${image.startsWith("/") ? image : `/${image}`}`,
          width: 1200,
          height: 630,
          type: "image/jpeg",
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullOgTitle,
      description,
      images: [
        {
          url: `${siteUrl}${image.startsWith("/") ? image : `/${image}`}`,
          alt: imageAlt,
        },
      ],
      creator: "@lamsparksphotography",
    },
  };
}
