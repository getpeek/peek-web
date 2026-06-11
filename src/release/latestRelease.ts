const FALLBACK_VERSION = "2.5.6";
const RELEASES_API = "https://api.github.com/repos/getpeek/peek/releases/latest";

export type Release = {
  version: string;
  downloadUrl: string;
};

const releaseFromVersion = (version: string): Release => ({
  version,
  downloadUrl: `https://github.com/getpeek/peek/releases/download/v${version}/Peek_${version}_aarch64.dmg`,
});

const parseTagVersion = (body: unknown): string | null => {
  if (typeof body !== "object" || body === null) {
    return null;
  }
  const tag = (body as Record<string, unknown>).tag_name;
  if (typeof tag !== "string" || !/^v\d+\.\d+\.\d+$/u.test(tag)) {
    return null;
  }
  return tag.slice(1);
};

export async function getLatestRelease(): Promise<Release> {
  try {
    const response = await fetch(RELEASES_API, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 3600 },
    });
    if (!response.ok) {
      return releaseFromVersion(FALLBACK_VERSION);
    }
    const version = parseTagVersion(await response.json());
    return releaseFromVersion(version ?? FALLBACK_VERSION);
  } catch {
    return releaseFromVersion(FALLBACK_VERSION);
  }
}
