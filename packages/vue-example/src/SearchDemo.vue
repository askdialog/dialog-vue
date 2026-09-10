<script setup lang="ts">
import type { Dialog } from "@askdialog/dialog-sdk";
import {
  DialogSearchBar,
  DialogSearchResults,
  useDialogSearch,
} from "@askdialog/dialog-vue";

const props = defineProps<{
  client: Dialog;
}>();

const { controller, state } = useDialogSearch({
  client: props.client,
  language: "en",
  currency: props.client.currency,
});
</script>

<template>
  <section class="search-demo">
    <DialogSearchBar
      :controller="controller"
      placeholder="Search the catalog..."
    />
    <DialogSearchResults :controller="controller" :state="state" />
  </section>
</template>

<style scoped>
.search-demo {
  width: 384px;
  max-width: calc(100vw - 40px);
  margin: 20px;
}
</style>
