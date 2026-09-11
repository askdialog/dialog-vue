import { Dialog, type SimplifiedProduct } from "@askdialog/dialog-sdk";
import { DialogInput, DialogProductBlock } from "@askdialog/dialog-react";
import "@askdialog/dialog-react/style.css";
import { SearchDemo } from "./SearchDemo";
import "./App.css";

const client = new Dialog({
  apiKey: import.meta.env.VITE_DIALOG_API_KEY || "",
  locale: "en-US",
  currency: "EUR",
  callbacks: {
    addToCart: () => {
      console.log("addToCart");
      return Promise.resolve();
    },
    getProduct: () => {
      return Promise.resolve({
        title: "Blizzard King All-Mountain Snowboard",
        description: "description",
        descriptionHtml: "descriptionHtml",
        featuredImage: {
          url: "https://cdn.shopify.com/s/files/1/0631/4718/0170/files/Main_a832056e-1370-4df3-b4bc-c0d6fe253970.jpg?v=1707323464",
        },
        handle: "blizzard-king-all-mountain-snowboard",
        id: "gid://shopify/Product/7899322908810",
        totalInventory: 2,
        tracksInventory: true,
        hasOnlyDefaultVariant: false,
        productType: "snowboard",
        status: "ACTIVE",
        options: [
          {
            id: "gid://shopify/ProductOption/10025502343306",
            name: "Taille",
            values: ["162", "159"],
            position: 1,
          },
          {
            id: "gid://shopify/ProductOption/10025502376074",
            name: "Fixation",
            values: ["Classique", "Step on"],
            position: 2,
          },
          {
            id: "gid://shopify/ProductOption/10025502408842",
            name: "Couleur",
            values: ["black", "green", "blue", "pink", "ben-design"],
            position: 3,
          },
        ],
        variants: [
          {
            id: "gid://shopify/ProductVariant/7899322908810",
            displayName: "Yay",
            selectedOptions: [
              {
                name: "Taille",
                value: "162",
              },
            ],
            image: {
              url: "https://cdn.shopify.com/s/files/1/0631/4718/0170/files/Main_a832056e-1370-4df3-b4bc-c0d6fe253970.jpg?v=1707323464",
            },
            inventoryQuantity: 10,
            price: "100",
            currencyCode: "USD",
            compareAtPrice: "100",
          },
        ],
        totalVariants: 20,
      } as SimplifiedProduct);
    },
  },

  theme: {
    backgroundColor: "pink",
    primaryColor: "pink",
    ctaTextColor: "white",
    ctaBorderType: "rounded",
    capitalizeCtas: true,
    fontFamily: "Arial",
    highlightProductName: true,
    title: {
      fontSize: "22px",
      color: "purple",
    },
    description: {
      color: "blue",
      fontSize: "18px",
    },
    content: {
      color: "green",
      fontSize: "10px",
    },
  },
});

function App() {
  return (
    <>
      <SearchDemo client={client} />

      <div className="app-container">
        <DialogProductBlock
          client={client}
          productId="9403924119882"
          productTitle="Product Title"
        />
      </div>

      <div>
        <p>Single input</p>
        <DialogInput
          client={client}
          productId="9403924119882"
          productTitle="Product Title"
          placeholder="Ask something about this product..."
        />
      </div>
    </>
  );
}

export default App;
