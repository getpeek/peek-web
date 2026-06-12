import { useEffect, useState } from "react";

// Hysteresis: collapse once past `enter`, but don't expand again until the user
// is back above `exit`. A single threshold flip-flops when small scroll deltas
// straddle it - and because the sticky nav's collapse changes layout height,
// each flip shifts the page, which reads as a shudder near the top.
export function useScrolled(enter = 24, exit = 4): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () =>
      setScrolled(was => (was ? window.scrollY > exit : window.scrollY > enter));
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [enter, exit]);

  return scrolled;
}
