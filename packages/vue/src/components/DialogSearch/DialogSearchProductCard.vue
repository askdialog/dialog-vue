<template>
  <li ref="cardRef" class="dialog-search-card">
    <div v-if="href === undefined" class="dialog-search-card-body">
      <DialogSearchProductCardContent :hit="props.hit" :locale="props.locale" />
    </div>
    <a
      v-else
      class="dialog-search-card-body"
      :href="href"
      @click="handleClick"
      @auxclick="handleAuxClick"
    >
      <DialogSearchProductCardContent :hit="props.hit" :locale="props.locale" />
    </a>
  </li>
</template>

<script setup lang="ts">
import type { SearchController, SearchHit } from "@askdialog/dialog-sdk";
import { computed, ref, watch } from "vue";
import DialogSearchProductCardContent from "./DialogSearchProductCardContent.vue";
import { safeProductHref } from "./searchDisplay";

interface Props {
  controller: SearchController;
  hit: SearchHit;
  index: number;
  locale?: string;
}

const props = defineProps<Props>();

const cardRef = ref<HTMLLIElement>();

// Reobserve each response even when the framework reuses the DOM node.
watch(
  () => props.hit,
  () => {
    if (cardRef.value !== undefined) {
      props.controller.observeResult(cardRef.value, props.index);
    }
  },
  { immediate: true, flush: "post" },
);

// Preserve native modified clicks. Prevent default navigation only when the
// adapter handles the click; record selection in both cases.
const handleClick = (event: MouseEvent): void => {
  const opensNatively =
    event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
  if (
    props.controller.selectResult(props.index, { navigate: !opensNatively })
  ) {
    event.preventDefault();
  }
};

// Track middle-clicks without the navigation adapter; ignore right-clicks.
const handleAuxClick = (event: MouseEvent): void => {
  if (event.button === 1) {
    props.controller.selectResult(props.index, { navigate: false });
  }
};

const href = computed(() =>
  props.hit.url === undefined ? undefined : safeProductHref(props.hit.url),
);
</script>

<style>
.dialog-search-card {
  width: 100%;
}

.dialog-search-card-body {
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 12px;
  color: inherit;
  text-decoration: none;
}

a.dialog-search-card-body:hover {
  background: rgba(0, 0, 0, 0.03);
}

.dialog-search-card-image {
  position: relative;
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  border-radius: 12px;
  overflow: hidden;
  background: #f2f2f2;
}

.dialog-search-card-image::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.03);
  pointer-events: none;
}

.dialog-search-card-image img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dialog-search-card-info {
  display: flex;
  flex: 1 1 0;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.dialog-search-card-title {
  margin: 0;
  font-family: "Inter", sans-serif;
  font-weight: 500;
  font-size: 13px;
  line-height: 20px;
  color: #171717;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dialog-search-card-price {
  margin: 0;
  font-family: "Inter", sans-serif;
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  color: #737373;
}
</style>
