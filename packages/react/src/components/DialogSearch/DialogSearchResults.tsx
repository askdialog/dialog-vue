import type { CSSProperties, FC, ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  DialogSearchError,
  SearchStatus,
  type SearchController,
  type SearchControllerState,
} from "@askdialog/dialog-sdk";
import { DialogSearchPagination } from "./DialogSearchPagination";
import { DialogSearchProductCard } from "./DialogSearchProductCard";
import { useAnchorRect, type AnchorRect } from "./useAnchorRect";
import { useOutsideDismiss } from "./useOutsideDismiss";
import "./DialogSearchResults.css";

const PANEL_OFFSET_PX = 8;
const VIEWPORT_MARGIN_PX = 16;
// Flip above the bar when space below is limited and more is available above.
const MIN_PANEL_SPACE_PX = 200;

interface DialogSearchResultsProps {
  controller: SearchController;
  state: SearchControllerState;
  locale?: string;
}

const describeError = (error: unknown): string => {
  if (error instanceof DialogSearchError) {
    return `Search failed (${error.status}${error.code ? ` ${error.code}` : ""}): ${error.message}`;
  }

  return "Search failed: network error. Check your connection and try again.";
};

const isAnchorOnScreen = (rect: AnchorRect, viewportHeight: number): boolean =>
  rect.bottom > 0 && rect.top < viewportHeight;

const panelStyle = (
  rect: AnchorRect,
  viewportHeight: number,
): CSSProperties => {
  const spaceBelow =
    viewportHeight - rect.bottom - PANEL_OFFSET_PX - VIEWPORT_MARGIN_PX;
  const spaceAbove = rect.top - PANEL_OFFSET_PX - VIEWPORT_MARGIN_PX;
  const base = { left: rect.left, width: rect.width };

  if (spaceBelow < MIN_PANEL_SPACE_PX && spaceAbove > spaceBelow) {
    return {
      ...base,
      bottom: viewportHeight - rect.top + PANEL_OFFSET_PX,
      maxHeight: Math.max(spaceAbove, 0),
    };
  }

  return {
    ...base,
    top: rect.bottom + PANEL_OFFSET_PX,
    maxHeight: Math.max(spaceBelow, 0),
  };
};

const panelContent = (
  controller: SearchController,
  state: SearchControllerState,
  locale: string | undefined,
): ReactNode => {
  const response = state.response;

  switch (state.status) {
    case SearchStatus.LOADING:
      return (
        <p role="status" className="dialog-search-status">
          Searching “{state.query}”…
        </p>
      );
    case SearchStatus.ERROR:
      return (
        <div className="dialog-search-error">
          <p
            role="alert"
            className="dialog-search-status dialog-search-status-error"
          >
            {describeError(state.error)}
          </p>
          <button
            type="button"
            className="dialog-search-retry"
            onClick={() => controller.retry()}
          >
            Retry
          </button>
        </div>
      );
    case SearchStatus.EMPTY:
      return (
        <p role="status" className="dialog-search-status">
          No products match “{response?.query}”.
        </p>
      );
    case SearchStatus.SUCCESS:
      if (response === undefined) {
        return null;
      }

      return (
        <>
          <p role="status" className="dialog-search-status">
            {response.nbHits} result{response.nbHits > 1 ? "s" : ""}
          </p>
          <ul className="dialog-search-results">
            {response.hits.map((hit, index) => (
              <DialogSearchProductCard
                key={hit.objectID}
                controller={controller}
                hit={hit}
                index={index}
                locale={locale}
              />
            ))}
          </ul>
          <DialogSearchPagination controller={controller} state={state} />
        </>
      );
    default:
      return null;
  }
};

// Render fixed under document.body to avoid ancestor clipping and stacking contexts.
export const DialogSearchResults: FC<DialogSearchResultsProps> = ({
  controller,
  state,
  locale,
}) => {
  const hasResults = state.status !== SearchStatus.IDLE;
  const { anchorRef, rect, viewportHeight } = useAnchorRect(hasResults);
  const { isOpen, panelRef } = useOutsideDismiss(state, anchorRef);

  return (
    <>
      <div ref={anchorRef} />
      {isOpen &&
        rect !== undefined &&
        isAnchorOnScreen(rect, viewportHeight) &&
        createPortal(
          <div
            ref={panelRef}
            className="dialog-search-panel"
            style={panelStyle(rect, viewportHeight)}
          >
            {panelContent(controller, state, locale)}
          </div>,
          document.body,
        )}
    </>
  );
};
