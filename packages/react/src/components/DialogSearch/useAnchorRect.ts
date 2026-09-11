import { useLayoutEffect, useRef, useState, type RefObject } from "react";

export interface AnchorRect {
  top: number;
  bottom: number;
  left: number;
  width: number;
}

// Position the panel from the previous sibling (search bar), falling back to the anchor.
// Capture ancestor scrolls and track viewport height separately for available space.
export const useAnchorRect = (
  active: boolean,
): {
  anchorRef: RefObject<HTMLDivElement | null>;
  rect: AnchorRect | undefined;
  viewportHeight: number;
} => {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<AnchorRect | undefined>(undefined);
  const [viewportHeight, setViewportHeight] = useState(0);

  useLayoutEffect(() => {
    if (!active) {
      return;
    }
    const update = (): void => {
      const anchor = anchorRef.current;
      if (anchor === null) {
        return;
      }
      const target = anchor.previousElementSibling ?? anchor;
      const { top, bottom, left, width } = target.getBoundingClientRect();
      setViewportHeight(window.innerHeight);
      setRect((previous) =>
        previous !== undefined &&
        previous.top === top &&
        previous.bottom === bottom &&
        previous.left === left &&
        previous.width === width
          ? previous
          : { top, bottom, left, width },
      );
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [active]);

  return { anchorRef, rect, viewportHeight };
};
