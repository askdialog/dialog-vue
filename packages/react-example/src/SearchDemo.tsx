import type { FC } from "react";
import type { Dialog } from "@askdialog/dialog-sdk";
import {
  DialogSearchBar,
  DialogSearchResults,
  useDialogSearch,
} from "@askdialog/dialog-react";

export const SearchDemo: FC<{ client: Dialog }> = ({ client }) => {
  const { controller, state } = useDialogSearch({
    client,
    language: "en",
    currency: client.currency,
  });

  return (
    <section className="search-demo">
      <DialogSearchBar
        controller={controller}
        placeholder="Search the catalog..."
      />
      <DialogSearchResults controller={controller} state={state} />
    </section>
  );
};
