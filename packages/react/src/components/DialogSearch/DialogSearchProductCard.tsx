import { type FC, type MouseEvent, useEffect, useRef } from "react";
import type { SearchController, SearchHit } from "@askdialog/dialog-sdk";
import { formatSearchPrice, safeProductHref } from "./searchDisplay";
import "./DialogSearchProductCard.css";

interface DialogSearchProductCardProps {
  controller: SearchController;
  hit: SearchHit;
  index: number;
  locale?: string;
}

export const DialogSearchProductCard: FC<DialogSearchProductCardProps> = ({
  controller,
  hit,
  index,
  locale,
}) => {
  const cardRef = useRef<HTMLLIElement>(null);

  // Reobserve each response even when the framework reuses the DOM node.
  useEffect(() => {
    if (cardRef.current !== null) {
      controller.observeResult(cardRef.current, index);
    }
  }, [controller, hit, index]);

  // Preserve native modified clicks. Prevent default navigation only when the
  // adapter handles the click; record selection in both cases.
  const handleClick = (event: MouseEvent): void => {
    const opensNatively =
      event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
    if (controller.selectResult(index, { navigate: !opensNatively })) {
      event.preventDefault();
    }
  };

  // Track middle-clicks without the navigation adapter; ignore right-clicks.
  const handleAuxClick = (event: MouseEvent): void => {
    if (event.button === 1) {
      controller.selectResult(index, { navigate: false });
    }
  };

  const title = hit.title ?? hit.objectID;
  const price = formatSearchPrice(hit.priceRange, locale);
  const href = hit.url === undefined ? undefined : safeProductHref(hit.url);

  const content = (
    <>
      <div className="dialog-search-card-image">
        {hit.imageUrl !== undefined && (
          <img src={hit.imageUrl} alt={title} loading="lazy" />
        )}
      </div>
      <div className="dialog-search-card-info">
        <p className="dialog-search-card-title">{title}</p>
        {price !== "" && <p className="dialog-search-card-price">{price}</p>}
      </div>
    </>
  );

  return (
    <li ref={cardRef} className="dialog-search-card">
      {href === undefined ? (
        <div className="dialog-search-card-body">{content}</div>
      ) : (
        <a
          className="dialog-search-card-body"
          href={href}
          onClick={handleClick}
          onAuxClick={handleAuxClick}
        >
          {content}
        </a>
      )}
    </li>
  );
};
