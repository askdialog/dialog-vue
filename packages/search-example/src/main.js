import {
  createSearchController,
  Dialog,
  DialogSearchError,
  SearchStatus,
} from "@askdialog/dialog-sdk";

const apiKeySection = document.getElementById("api-key-section");
const apiKeyInput = document.getElementById("api-key-input");
const searchInput = document.getElementById("search-input");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");
const paginationEl = document.getElementById("pagination");
const prevButton = document.getElementById("prev-page");
const nextButton = document.getElementById("next-page");
const pageIndicator = document.getElementById("page-indicator");

let controller;

function formatPrice(priceRange) {
  if (priceRange === undefined) {
    return "";
  }
  const { min, max } = priceRange;
  // A price indexed without a currency shows as a bare amount.
  const format = ({ amount, currencyCode }) =>
    currencyCode === undefined
      ? new Intl.NumberFormat().format(Number(amount))
      : new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: currencyCode,
        }).format(Number(amount));
  return min.amount === max.amount
    ? format(min)
    : `${format(min)} – ${format(max)}`;
}

/**
 * Catalog data is untrusted: only allow http(s) links so a `javascript:` URL
 * cannot execute script. Relative URLs resolve against the page and pass.
 */
function safeProductHref(url) {
  try {
    const { protocol } = new URL(url, window.location.href);
    return protocol === "http:" || protocol === "https:" ? url : undefined;
  } catch {
    return undefined;
  }
}

function renderProductCard(hit, index) {
  const li = document.createElement("li");
  li.className = "card";

  const image = document.createElement("div");
  image.className = "card-image";
  if (hit.imageUrl !== undefined) {
    const img = document.createElement("img");
    img.src = hit.imageUrl;
    img.alt = hit.title ?? hit.objectID;
    img.loading = "lazy";
    image.appendChild(img);
  }
  li.appendChild(image);

  const title = document.createElement("p");
  title.className = "card-title";
  title.textContent = hit.title ?? hit.objectID;
  li.appendChild(title);

  const meta = document.createElement("p");
  meta.className = "card-meta";
  meta.textContent = formatPrice(hit.priceRange);
  li.appendChild(meta);

  const href = hit.url === undefined ? undefined : safeProductHref(hit.url);
  if (href !== undefined) {
    const link = document.createElement("a");
    link.className = "card-link";
    link.href = href;
    link.textContent = "View product";
    // `selectResult` records attribution (forced impression + select event,
    // so CTR by position stays ≤ 100%) — also on auxclick: a middle-click /
    // new-tab open is a selection too.
    // Demo-only: seed URLs are fake, so same-tab navigation is suppressed to
    // keep the console (and its logged events) alive. Real integrations must
    // NOT preventDefault — the events are designed to survive navigation.
    link.addEventListener("click", (event) => {
      event.preventDefault();
      controller.selectResult(index);
    });
    // auxclick also fires on right-click, which only opens a context menu:
    // only the middle button is a navigation.
    link.addEventListener("auxclick", (event) => {
      if (event.button === 1) {
        controller.selectResult(index);
      }
    });
    li.appendChild(link);
  }

  return li;
}

function describeError(error) {
  if (error instanceof DialogSearchError) {
    return `Search failed (${error.status}${error.code ? ` ${error.code}` : ""}): ${error.message}`;
  }
  return "Search failed: network error. Check your connection and try again.";
}

function renderResults(response) {
  statusEl.textContent = `${response.nbHits} product${response.nbHits > 1 ? "s" : ""} for “${response.query}” (${response.processingTimeMS} ms)`;
  resultsEl.replaceChildren(
    ...response.hits.map((hit, index) => {
      const card = renderProductCard(hit, index);
      controller.observeResult(card, index);
      return card;
    }),
  );

  if (response.nbPages > 1) {
    paginationEl.hidden = false;
    pageIndicator.textContent = `Page ${response.page + 1} / ${response.nbPages}`;
    prevButton.disabled = response.page === 0;
    nextButton.disabled = response.page >= response.nbPages - 1;
  }
}

function render(state) {
  resultsEl.replaceChildren();
  paginationEl.hidden = true;
  statusEl.classList.toggle(
    "status-error",
    state.status === SearchStatus.ERROR,
  );

  switch (state.status) {
    case SearchStatus.IDLE:
      statusEl.textContent = "Start typing to search the catalog.";
      return;
    case SearchStatus.LOADING:
      statusEl.textContent = `Searching “${state.query}”…`;
      return;
    case SearchStatus.ERROR:
      statusEl.textContent = describeError(state.error);
      return;
    case SearchStatus.EMPTY:
      statusEl.textContent = `No products match “${state.response.query}”.`;
      return;
    case SearchStatus.SUCCESS:
      renderResults(state.response);
      return;
  }
}

function start(apiKey) {
  const dialog = new Dialog({ apiKey, locale: "fr-FR", currency: "EUR" });
  controller = createSearchController({
    search: (request, options) => dialog.search(request, options),
    language: "fr",
    currency: dialog.currency,
    analytics: {
      surface: "search_page",
      trackViewSearchResults: (params) => dialog.trackViewSearchResults(params),
      trackSelectSearchResult: (params) =>
        dialog.trackSelectSearchResult(params),
    },
    // No `navigate` adapter: the demo renders plain `<a href>` links and
    // suppresses navigation above; a real integration passes its router here.
  });
  controller.subscribe((state) => {
    console.log(
      `[search] ${state.status} query="${state.query}" page=${state.page}`,
      state,
    );
  });
  controller.subscribe(render);

  apiKeySection.hidden = true;
  searchInput.disabled = false;
  searchInput.focus();
  render(controller.getState());
}

searchInput.addEventListener("input", () => {
  controller.setQuery(searchInput.value);
});

// Enter skips the debounce: an explicit submission runs immediately.
searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    controller.submit(searchInput.value);
  }
});

prevButton.addEventListener("click", () => {
  controller.setPage(controller.getState().response.page - 1);
});

nextButton.addEventListener("click", () => {
  controller.setPage(controller.getState().response.page + 1);
});

const envApiKey = import.meta.env.VITE_DIALOG_API_KEY;
if (typeof envApiKey === "string" && envApiKey.length > 0) {
  start(envApiKey);
} else {
  apiKeySection.hidden = false;
  apiKeyInput.addEventListener("change", () => {
    if (apiKeyInput.value.length > 0) {
      start(apiKeyInput.value);
      apiKeyInput.value = "";
    }
  });
}
