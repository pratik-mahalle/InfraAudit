import * as React from "react";

export const DESKTOP_MIN_WIDTH = 1024;

function matchesDesktopViewport() {
  if (typeof window === "undefined") {
    return true;
  }

  return window.matchMedia(`(min-width: ${DESKTOP_MIN_WIDTH}px)`).matches;
}

export function useDesktopViewport() {
  const [isDesktop, setIsDesktop] = React.useState(matchesDesktopViewport);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(`(min-width: ${DESKTOP_MIN_WIDTH}px)`);
    const handleChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);

    setIsDesktop(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isDesktop;
}
