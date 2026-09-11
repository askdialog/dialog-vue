/* eslint-disable max-lines */
import { uuidv7 } from "uuidv7";
import packageJson from "../package.json";
import { defaultTheme } from "./constants/theme";
import {
  CurrentProduct,
  DialogCallbacks,
  DialogConstructor,
} from "./types/constructor";
import { Theme } from "./types/theme";
import {
  DetailedLocaleInfo,
  getDetailedLocaleInfo,
} from "./utils/localization";
import { ANONYMOUS_CUSTOMER_ID, CUSTOMER_ID } from "./constants/user";
import { Suggestion } from "./types/suggestion";
import {
  AddToCartInput,
  DialogEvents,
  GenericQuestionPayload,
  LegacyCheckoutParams,
  OpenAssistantPayload,
  ProductQuestionPayload,
  SubmitCheckoutParams,
} from "./types/events";
import { SimplifiedProduct } from "./types/product";
import {
  SelectSearchResultParams,
  ViewSearchResultsParams,
} from "./types/searchAnalytics";
import { EventsHandler } from "./EventsHandler";
import { loadSuggestions } from "./services/suggestions";
import { searchLexical } from "./services/search";
import { SearchOptions, SearchRequest, SearchResponse } from "./types/search";
import { config } from "./config";
import { AssistantEvent } from "./types/assistantEvent";
import { exposeSdkOnWindowDialog } from "./windowAudit";
export class Dialog {
  public static readonly VERSION = packageJson.version;

  private _apiKey: string;
  private _locale: string;
  private _currency: string;
  private _countryCode?: string;

  private _callbacks?: DialogCallbacks;
  private _theme: Theme;
  private _userId: string;
  private _eventsHandler: EventsHandler;
  private _ignoreOneTrustAutoBlock: boolean;
  private _disableAddToCart: boolean;
  private _currentProduct?: CurrentProduct;

  constructor({
    apiKey,
    locale,
    currency,
    countryCode,
    callbacks,
    theme,
    userId,
    ignoreOneTrustAutoBlock,
    disableAddToCart,
    product,
  }: DialogConstructor) {
    this._apiKey = apiKey;
    this._locale = locale;
    this._currency = currency;
    this._countryCode = countryCode;
    this._callbacks = callbacks;
    this._ignoreOneTrustAutoBlock = ignoreOneTrustAutoBlock ?? false;
    this._disableAddToCart = disableAddToCart ?? false;
    this._currentProduct =
      product !== undefined && Dialog._isValidProductId(product.id)
        ? product
        : undefined;
    if (product !== undefined && this._currentProduct === undefined) {
      console.error(
        "Dialog: `product.id` must be a non-empty string; ignoring the constructor option.",
      );
    }
    this._theme = { ...defaultTheme, ...theme };
    this._userId = this._createOrRetrieveUserId(userId);
    this._eventsHandler = new EventsHandler(locale, userId);
    exposeSdkOnWindowDialog(this, Dialog.VERSION);
    this._loadAssistant();
  }

  public get apiKey(): string {
    return this._apiKey;
  }
  public get theme(): Theme {
    return this._theme;
  }
  public get userId(): string {
    return this._userId;
  }
  public get locale(): string {
    return this._locale;
  }
  public get currency(): string {
    return this._currency;
  }
  public get eventsHandler(): EventsHandler {
    return this._eventsHandler;
  }

  public getLocalizationInformations(): DetailedLocaleInfo | null {
    return getDetailedLocaleInfo(this._locale, this._countryCode);
  }

  private _createOrRetrieveUserId(userId?: string): string {
    if (userId !== undefined) {
      localStorage.setItem(CUSTOMER_ID, userId);

      return userId;
    }

    const existingAnonymousUserId = localStorage.getItem(ANONYMOUS_CUSTOMER_ID);
    if (existingAnonymousUserId !== null) {
      return existingAnonymousUserId;
    }

    const newUserId = uuidv7();
    localStorage.setItem(ANONYMOUS_CUSTOMER_ID, newUserId);

    return newUserId;
  }

  public async getSuggestions(productId: string): Promise<Suggestion> {
    return loadSuggestions(this._apiKey, this._locale, productId);
  }

  /**
   * Send one search request with names built by `searchIndexName`.
   * Cancel through `options.signal`. HTTP errors reject with `DialogSearchError`;
   * network and cancellation errors propagate unchanged.
   */
  public search(
    request: SearchRequest,
    options?: SearchOptions,
  ): Promise<SearchResponse> {
    return searchLexical(this._apiKey, request, options);
  }

  // TODO: Not yet implemented on assistant
  public openAssistant(params: OpenAssistantPayload): void {
    this._eventsHandler.emitExternalEvent(DialogEvents.OPEN_ASSISTANT, params);
  }

  // TODO: Not yet implemented on assistant
  public closeAssistant(): void {
    this._eventsHandler.emitExternalEvent(DialogEvents.CLOSE_ASSISTANT);
  }

  /**
   * Set the default product context for assistant questions.
   * Call on each product-page navigation; IDs must match the Dialog product feed.
   */
  public setCurrentProduct(productId: string, variantId?: string): void {
    if (!Dialog._isValidProductId(productId)) {
      console.error(
        "Dialog: setCurrentProduct expects a non-empty string productId; ignoring the call. Use clearCurrentProduct() to declare a non-product page.",
      );

      return;
    }
    this._currentProduct = { id: productId, variantId };
    this._applyCurrentProductDataset();
  }

  private static _isValidProductId(productId: unknown): productId is string {
    return typeof productId === "string" && productId.trim() !== "";
  }

  /** Clear the product context on non-product pages. */
  public clearCurrentProduct(): void {
    this._currentProduct = undefined;
    this._applyCurrentProductDataset();
  }

  // The runtime reads product context from the mount node dataset.
  private _applyCurrentProductDataset(): void {
    // Match the runtime lookup: duplicate IDs must resolve to the same first node.
    const mountNode = document.getElementById("dialog-shopify-ai");
    if (mountNode === null) {
      // Keep the context until a mount node is available.
      console.warn(
        "Dialog: assistant mount node not found; the current product declaration has no effect.",
      );

      return;
    }

    if (this._currentProduct === undefined) {
      delete mountNode.dataset.productId;
      delete mountNode.dataset.variantId;

      return;
    }

    mountNode.dataset.productId = this._currentProduct.id;
    if (this._currentProduct.variantId === undefined) {
      delete mountNode.dataset.variantId;
    } else {
      mountNode.dataset.variantId = this._currentProduct.variantId;
    }
  }

  public sendProductMessage(params: ProductQuestionPayload): void {
    this._eventsHandler.emitExternalEvent(DialogEvents.SEND_MESSAGE, params);
  }

  public sendGenericMessage(params: GenericQuestionPayload): void {
    this._eventsHandler.emitExternalEvent(
      DialogEvents.SEND_GENERIC_QUESTION,
      params,
    );
  }

  public onAssistantEvent(listener: (event: AssistantEvent) => void): void {
    this._eventsHandler.onAssistantEvent(listener);
  }

  public dispatchAssistantEvent(event: AssistantEvent): void {
    this._eventsHandler.emitAssistantEvent(event.type, event.payload);
  }

  public getProduct(
    productId: string,
    variantId?: string,
  ): Promise<SimplifiedProduct> {
    return this._getCallbacksOrThrow("getProduct").getProduct(
      productId,
      variantId,
    );
  }

  // Forward all product fields to the commerce callback and analytics.
  public async addToCart(input: AddToCartInput): Promise<void> {
    // Disabled instances must neither modify the cart nor emit analytics.
    if (this._disableAddToCart) {
      console.warn(
        "Dialog: addToCart is disabled on this instance (disableAddToCart); ignoring the call.",
      );

      return;
    }

    await this._getCallbacksOrThrow("addToCart").addToCart(input);
    this.registerAddToCartEvent(input);

    return;
  }

  // Validate optional commerce callbacks when invoked.
  private _getCallbacksOrThrow(name: keyof DialogCallbacks): DialogCallbacks {
    if (this._callbacks?.[name] === undefined) {
      throw new Error(
        `Dialog: \`callbacks.${name}\` was not provided to the constructor; ${name}() is unavailable on this instance.`,
      );
    }

    return this._callbacks;
  }

  public registerAddToCartEvent(input: AddToCartInput): void {
    this._eventsHandler.emitExternalEvent(DialogEvents.TRACK_ADD_TO_CART, {
      userId: this._userId,
      ...input,
    });
  }

  // Call once per completed order; `orderValue` supplies the revenue total.
  // The deprecated per-item payload remains accepted but has no order total.
  public registerSubmitCheckoutEvent(
    params: SubmitCheckoutParams | LegacyCheckoutParams,
  ): void {
    if ("orderValue" in params) {
      this._eventsHandler.emitExternalEvent(
        DialogEvents.TRACK_SUBMIT_CHECKOUT,
        {
          userId: this._userId,
          orderValue: params.orderValue,
          currency: params.currency,
          transactionId: params.transactionId,
          items: params.items,
        },
      );

      return;
    }

    this._eventsHandler.emitExternalEvent(DialogEvents.TRACK_SUBMIT_CHECKOUT, {
      userId: this._userId,
      productId: params.productId,
      variantId: params.variantId,
      quantity: params.quantity,
      price: params.price,
      currency: params.currency,
    });
  }

  /**
   * Emit impressions batched by `createSearchImpressionTracker`.
   * Use `items: []` for an empty result set.
   */
  public trackViewSearchResults(params: ViewSearchResultsParams): void {
    this._eventsHandler.emitExternalEvent(
      DialogEvents.TRACK_VIEW_SEARCH_RESULTS,
      {
        userId: this._userId,
        ...params,
      },
    );
  }

  /** Emit a selection after its impression, including middle-clicks and modified clicks. */
  public trackSelectSearchResult(params: SelectSearchResultParams): void {
    this._eventsHandler.emitExternalEvent(
      DialogEvents.TRACK_SELECT_SEARCH_RESULT,
      {
        userId: this._userId,
        ...params,
      },
    );
  }

  private _loadAssistant(): void {
    const localeInfo = getDetailedLocaleInfo(this._locale, this._countryCode);

    if (localeInfo === null) {
      console.error("Missing locale information");

      return;
    }

    const div = document.createElement("div");
    div.id = "dialog-shopify-ai";
    div.dataset.shopIsoCode = localeInfo.languageCode;
    div.dataset.apiKey = this._apiKey;
    div.dataset.userId = this._userId;
    div.dataset.countryCode = localeInfo.countryCode;
    div.dataset.language = localeInfo.language;
    if (this._disableAddToCart) {
      // Hide the add-to-cart button in the assistant.
      div.dataset.disableAddToCart = "true";
    }
    document.body.appendChild(div);
    if (this._currentProduct !== undefined) {
      this._applyCurrentProductDataset();
    }

    setTimeout(() => {
      const script = document.createElement("script");
      if (this._ignoreOneTrustAutoBlock) {
        // Set the bypass attribute before src: OneTrust intercepts the src setter.
        script.setAttribute("data-ot-ignore", "");
      }
      script.defer = true;
      script.async = true;
      script.type = "module";
      script.src = config.assistantUrl;
      document.head.insertBefore(script, document.head.firstChild);
    }, 50);
  }
}
