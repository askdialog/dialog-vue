<template>
  <div ref="anchorRef" />
  <Teleport v-if="showPanel" to="body">
    <div ref="panelRef" class="dialog-search-panel" :style="panelStyle">
      <p
        v-if="props.state.status === SearchStatus.LOADING"
        role="status"
        class="dialog-search-status"
      >
        Searching “{{ props.state.query }}”…
      </p>
      <div
        v-else-if="props.state.status === SearchStatus.ERROR"
        class="dialog-search-error"
      >
        <p role="alert" class="dialog-search-status dialog-search-status-error">
          {{ describeError(props.state.error) }}
        </p>
        <button
          type="button"
          class="dialog-search-retry"
          @click="props.controller.retry()"
        >
          Retry
        </button>
      </div>
      <p
        v-else-if="props.state.status === SearchStatus.EMPTY"
        role="status"
        class="dialog-search-status"
      >
        No products match “{{ props.state.response?.query }}”.
      </p>
      <template
        v-else-if="
          props.state.status === SearchStatus.SUCCESS &&
          props.state.response !== undefined
        "
      >
        <p role="status" class="dialog-search-status">
          {{ props.state.response.nbHits }}
          result{{ props.state.response.nbHits > 1 ? "s" : "" }}
        </p>
        <ul class="dialog-search-results">
          <DialogSearchProductCard
            v-for="(hit, index) in props.state.response.hits"
            :key="hit.objectID"
            :controller="props.controller"
            :hit="hit"
            :index="index"
            :locale="props.locale"
          />
        </ul>
        <DialogSearchPagination
          :controller="props.controller"
          :state="props.state"
        />
      </template>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import {
  DialogSearchError,
  SearchStatus,
  type SearchController,
  type SearchControllerState,
} from "@askdialog/dialog-sdk";
import { computed, type CSSProperties } from "vue";
import DialogSearchPagination from "./DialogSearchPagination.vue";
import DialogSearchProductCard from "./DialogSearchProductCard.vue";
import { useAnchorRect, type AnchorRect } from "./useAnchorRect";
import { useOutsideDismiss } from "./useOutsideDismiss";

const PANEL_OFFSET_PX = 8;
const VIEWPORT_MARGIN_PX = 16;
// Flip above the bar when space below is limited and more is available above.
const MIN_PANEL_SPACE_PX = 200;

interface Props {
  controller: SearchController;
  state: SearchControllerState;
  locale?: string;
}

const props = defineProps<Props>();

const describeError = (error: unknown): string => {
  if (error instanceof DialogSearchError) {
    return `Search failed (${error.status}${error.code ? ` ${error.code}` : ""}): ${error.message}`;
  }

  return "Search failed: network error. Check your connection and try again.";
};

const isAnchorOnScreen = (rect: AnchorRect, viewportHeight: number): boolean =>
  rect.bottom > 0 && rect.top < viewportHeight;

const computePanelStyle = (
  rect: AnchorRect,
  viewportHeight: number,
): CSSProperties => {
  const spaceBelow =
    viewportHeight - rect.bottom - PANEL_OFFSET_PX - VIEWPORT_MARGIN_PX;
  const spaceAbove = rect.top - PANEL_OFFSET_PX - VIEWPORT_MARGIN_PX;
  const base = { left: `${rect.left}px`, width: `${rect.width}px` };

  if (spaceBelow < MIN_PANEL_SPACE_PX && spaceAbove > spaceBelow) {
    return {
      ...base,
      bottom: `${viewportHeight - rect.top + PANEL_OFFSET_PX}px`,
      maxHeight: `${Math.max(spaceAbove, 0)}px`,
    };
  }

  return {
    ...base,
    top: `${rect.bottom + PANEL_OFFSET_PX}px`,
    maxHeight: `${Math.max(spaceBelow, 0)}px`,
  };
};

const stateRef = computed(() => props.state);
const hasResults = computed(() => props.state.status !== SearchStatus.IDLE);

// Render fixed under document.body to avoid ancestor clipping and stacking contexts.
const { anchorRef, rect, viewportHeight } = useAnchorRect(hasResults);
const { isOpen, panelRef } = useOutsideDismiss(stateRef, anchorRef);

const showPanel = computed(
  () =>
    isOpen.value &&
    rect.value !== undefined &&
    isAnchorOnScreen(rect.value, viewportHeight.value),
);
const panelStyle = computed(() =>
  rect.value === undefined
    ? undefined
    : computePanelStyle(rect.value, viewportHeight.value),
);
</script>

<style>
/* Teleported to document.body; top/left/width/max-height are set inline from the anchor. */
.dialog-search-panel {
  position: fixed;
  z-index: 9999;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 24px;
  box-shadow: 0 6px 20px -6px rgba(0, 0, 0, 0.1);
}

.dialog-search-status {
  margin: 0;
  font-family: "Inter", sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: #a3a3a3;
}

.dialog-search-status-error {
  color: #b3261e;
}

.dialog-search-error {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.dialog-search-retry {
  margin: 0;
  padding: 6px 14px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 9999px;
  background: #ffffff;
  font-family: "Inter", sans-serif;
  font-weight: 500;
  font-size: 13px;
  line-height: 20px;
  color: #737373;
  cursor: pointer;
  transition: background-color 120ms ease;
}

.dialog-search-retry:hover {
  background-color: #fafafa;
}

.dialog-search-results {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 480px;
  min-height: 0;
  overflow-y: auto;
}
</style>
