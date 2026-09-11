import { AddToCartInput } from "./events";
import { SimplifiedProduct } from "./product";
import { Theme } from "./theme";

export interface DialogCallbacks {
  addToCart: (input: AddToCartInput) => Promise<void>;
  getProduct: (
    productId: string,
    variantId?: string,
  ) => Promise<SimplifiedProduct>;
}

export interface CurrentProduct {
  /** The catalog product id — must match the id in the Dialog product feed. */
  id: string;
  variantId?: string;
}

export interface DialogConstructor {
  apiKey: string;
  /** BCP-47 locale, e.g. `fr-FR`. */
  locale: string;
  /** Currency (ISO 4217), independent of language. */
  currency: string;
  /**
   * Optional ISO 3166 country code used to format prices (e.g. 'FR', 'US').
   * When provided it takes precedence over the country derived from `locale`.
   * Omit it to keep deriving the country from the locale (backward compatible).
   */
  countryCode?: string;
  /**
   * Commerce callbacks. Optional: a search-only integration can omit them —
   * the assistant runtime still loads, and only `getProduct()` / `addToCart()`
   * throw a configuration error when their callback is absent.
   */
  callbacks?: DialogCallbacks;
  theme?: Partial<Theme>;
  userId?: string;
  /**
   * Adds `data-ot-ignore` on the injected assistant script so OneTrust
   * auto-blocking does not neutralize it for visitors who declined cookies.
   * The assistant gates analytics on consent internally, so loading it is
   * safe — but exempting a script from the CMP is the merchant's compliance
   * call, hence opt-in. No effect outside OneTrust auto-blocking setups.
   */
  ignoreOneTrustAutoBlock?: boolean;
  /**
   * Disables Dialog add-to-cart for this widget instance/session. Defaults to
   * `false`. When `true`, the SDK flags the injected assistant so it hides the
   * add-to-cart CTA on product recommendation and conversational product cards,
   * and `addToCart()` becomes a no-op that emits no tracking event — nothing is
   * added to the cart even if a stale UI still calls it. Meant for sessions
   * where the merchant hides purchasing actions (e.g. logged-in B2B shoppers).
   * Product links and recommendation browsing are unaffected.
   */
  disableAddToCart?: boolean;
  /**
   * The product of the page the SDK is instantiated on, when it is a product
   * page. The assistant uses it as the conversation's product context for
   * entry points that carry no product of their own (floating bookmark,
   * resume surface, free-text questions), so answers stay grounded on the
   * product under the visitor's eyes after PDP-to-PDP navigation. On
   * single-page storefronts, update it on navigation with
   * `setCurrentProduct()` / `clearCurrentProduct()`.
   */
  product?: CurrentProduct;
}
