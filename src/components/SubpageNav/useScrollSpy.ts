import { useEffect, useState } from "react";

export function useScrollSpy(slugs: string[]): string | null {
  const [activeSlug, setActiveSlug] = useState<string | null>(slugs[0] ?? null);

  useEffect(() => {
    const sections = slugs
      .map(slug => document.querySelector(`#${slug}`))
      .filter((element): element is HTMLElement => element !== null);

    const observer = new IntersectionObserver(
      entries => {
        // pick the lowest intersecting section: a parent <section> wraps its
        // sub-sections, so on a hash jump both report at once and the deepest
        // one (largest top) is the section actually being read
        const deepest = entries
          .filter(entry => entry.isIntersecting)
          .toSorted((a, b) => b.boundingClientRect.top - a.boundingClientRect.top)
          .at(0);
        if (deepest) {
          setActiveSlug(deepest.target.id);
        }
      },
      // top margin clears the sticky nav; the bottom one keeps the trigger
      // zone in the upper third of the viewport
      { rootMargin: "-100px 0px -65% 0px", threshold: 0 },
    );

    sections.forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, [slugs]);

  return activeSlug;
}
