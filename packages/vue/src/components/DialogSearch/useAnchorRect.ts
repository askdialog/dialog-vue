import { ref, watch, type Ref } from "vue";

export interface AnchorRect {
  top: number;
  bottom: number;
  left: number;
  width: number;
}

// Position the panel from the previous sibling (search bar), falling back to the anchor.
// Capture ancestor scrolls and track viewport height separately for available space.
export const useAnchorRect = (
  active: Ref<boolean>,
): {
  anchorRef: Ref<HTMLDivElement | undefined>;
  rect: Ref<AnchorRect | undefined>;
  viewportHeight: Ref<number>;
} => {
  const anchorRef = ref<HTMLDivElement>();
  const rect = ref<AnchorRect | undefined>(undefined);
  const viewportHeight = ref(0);

  watch(
    active,
    (isActive, _, onCleanup) => {
      if (!isActive) {
        return;
      }
      const update = (): void => {
        const anchor = anchorRef.value;
        if (anchor === undefined) {
          return;
        }
        const target = anchor.previousElementSibling ?? anchor;
        const { top, bottom, left, width } = target.getBoundingClientRect();
        viewportHeight.value = window.innerHeight;
        const previous = rect.value;
        if (
          previous === undefined ||
          previous.top !== top ||
          previous.bottom !== bottom ||
          previous.left !== left ||
          previous.width !== width
        ) {
          rect.value = { top, bottom, left, width };
        }
      };
      update();
      window.addEventListener("scroll", update, true);
      window.addEventListener("resize", update);
      onCleanup(() => {
        window.removeEventListener("scroll", update, true);
        window.removeEventListener("resize", update);
      });
    },
    { immediate: true, flush: "post" },
  );

  return { anchorRef, rect, viewportHeight };
};
