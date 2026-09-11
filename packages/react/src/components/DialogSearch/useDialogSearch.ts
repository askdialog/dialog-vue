import {
  createSearchController,
  registerDialogInstallation,
  SearchStatus,
  type Dialog,
  type SearchController,
  type SearchControllerState,
  type SearchHit,
  type SearchSurface,
} from "@askdialog/dialog-sdk";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

export interface UseDialogSearchOptions {
  client: Dialog;
  /** Lowercase ISO 639-1 language code, e.g. `fr`. */
  language: string;
  /** ISO 4217 currency, independent of language. */
  currency: string;
  /** UI surface used in search analytics. */
  surface?: SearchSurface;
  /** Navigate after recording selection; omit to use native links. */
  navigate?: (url: string, hit: SearchHit) => void;
  debounceMs?: number;
  hitsPerPage?: number;
}

export interface DialogSearch {
  controller: SearchController;
  state: SearchControllerState;
}

const SERVER_SNAPSHOT: SearchControllerState = {
  status: SearchStatus.IDLE,
  query: "",
  page: 0,
};

/** Options are fixed when the controller is created. */
export const useDialogSearch = (
  options: UseDialogSearchOptions,
): DialogSearch => {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const controllerRef = useRef<SearchController | undefined>(undefined);

  const getController = useCallback((): SearchController => {
    if (controllerRef.current === undefined) {
      const { client, surface = "search_page", ...rest } = optionsRef.current;
      controllerRef.current = createSearchController({
        search: (request, requestOptions) =>
          client.search(request, requestOptions),
        analytics: {
          surface,
          trackViewSearchResults: (params) =>
            client.trackViewSearchResults(params),
          trackSelectSearchResult: (params) =>
            client.trackSelectSearchResult(params),
        },
        ...rest,
      });
    }

    return controllerRef.current;
  }, []);

  // Resolve the current controller after StrictMode disposes the initial instance.
  const facadeRef = useRef<SearchController | undefined>(undefined);
  facadeRef.current ??= {
    setQuery: (rawQuery) => getController().setQuery(rawQuery),
    submit: (rawQuery) => getController().submit(rawQuery),
    setPage: (page) => getController().setPage(page),
    retry: () => getController().retry(),
    observeResult: (element, index) =>
      getController().observeResult(element, index),
    selectResult: (index, options) =>
      getController().selectResult(index, options),
    subscribe: (listener) => getController().subscribe(listener),
    getState: () => getController().getState(),
    // Create a replacement on next access after disposal.
    dispose: () => {
      controllerRef.current?.dispose();
      controllerRef.current = undefined;
    },
  };

  useEffect(() => {
    registerDialogInstallation({
      method: "react",
      version:
        typeof __DIALOG_REACT_VERSION__ === "undefined"
          ? undefined
          : __DIALOG_REACT_VERSION__,
    });
    const controller = getController();

    return () => {
      controller.dispose();
      if (controllerRef.current === controller) {
        controllerRef.current = undefined;
      }
    };
  }, [getController]);

  const subscribe = useCallback(
    (listener: () => void) => getController().subscribe(listener),
    [getController],
  );
  const getState = useCallback(
    () => getController().getState(),
    [getController],
  );
  const state = useSyncExternalStore(
    subscribe,
    getState,
    () => SERVER_SNAPSHOT,
  );

  return { controller: facadeRef.current, state };
};
