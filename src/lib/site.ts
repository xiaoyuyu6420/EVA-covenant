export function getSiteUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined;
  const fallbackUrl = "http://localhost:3002";
  const rawUrl = explicitUrl ?? vercelUrl ?? fallbackUrl;

  try {
    return new URL(rawUrl);
  } catch {
    return new URL(fallbackUrl);
  }
}
