import type { SearchPriceRange } from "@askdialog/dialog-sdk";

// Hide invalid prices; show a bare amount when currency is absent.
const formatMoney = (
  { amount, currencyCode }: SearchPriceRange["min"],
  locale: string | undefined,
): string =>
  currencyCode === undefined
    ? new Intl.NumberFormat(locale).format(Number(amount))
    : new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currencyCode,
      }).format(Number(amount));

const formatRange = (
  { min, max }: SearchPriceRange,
  locale: string | undefined,
): string =>
  min.amount === max.amount
    ? formatMoney(min, locale)
    : `${formatMoney(min, locale)} – ${formatMoney(max, locale)}`;

export const formatSearchPrice = (
  priceRange: SearchPriceRange | undefined,
  locale?: string,
): string => {
  if (priceRange === undefined) {
    return "";
  }
  try {
    return formatRange(priceRange, locale);
  } catch {
    return "";
  }
};

// Allow only HTTP(S) product links.
export const safeProductHref = (url: string): string | undefined => {
  try {
    const { protocol } = new URL(url, window.location.href);

    return protocol === "http:" || protocol === "https:" ? url : undefined;
  } catch {
    return undefined;
  }
};
