const RELEASES_API = "https://api.github.com/repos/getpeek/peek/releases?per_page=10";

export type ReleaseNote = {
  version: string;
  htmlUrl: string;
  publishedAt: string;
  body: string;
};

const parseReleaseNote = (item: unknown): ReleaseNote | null => {
  if (typeof item !== "object" || item === null) {
    return null;
  }
  const release = item as Record<string, unknown>;
  if (release.draft === true || release.prerelease === true) {
    return null;
  }
  const tag = release.tag_name;
  const htmlUrl = release.html_url;
  const publishedAt = release.published_at;
  if (typeof tag !== "string" || typeof htmlUrl !== "string" || typeof publishedAt !== "string") {
    return null;
  }
  return {
    version: tag.replace(/^v/u, ""),
    htmlUrl,
    publishedAt,
    body: typeof release.body === "string" ? release.body : "",
  };
};

export async function listReleases(): Promise<ReleaseNote[]> {
  try {
    const response = await fetch(RELEASES_API, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 3600 },
    });
    if (!response.ok) {
      return [];
    }
    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) {
      return [];
    }
    return payload.map(item => parseReleaseNote(item)).filter(note => note !== null);
  } catch {
    return [];
  }
}
