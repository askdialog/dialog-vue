<template>
  <slot></slot>
</template>

<script setup lang="ts">
import { type Theme } from '@askdialog/dialog-sdk';
import { onMounted, watch } from 'vue';

const props = defineProps<{
  theme: Theme;
}>();

const body = document.body;
const camelCaseToKebabCase = (label: string) => {
  return label.replace(/([A-Z])/g, '-$1').toLowerCase();
};

const applyTheme = (theme: Theme) => {
  if (!theme) return;

  Object.keys(theme).forEach(key => {
    const themeKey = key as keyof Theme;
    const kebabCaseKey = camelCaseToKebabCase(key);
    if (theme[themeKey] !== undefined) {
      body.style.setProperty(
        `--dialog-theme-${kebabCaseKey}`,
        theme[themeKey].toString(),
      );
    }
  });
};

onMounted(() => {
  if (props.theme) {
    applyTheme(props.theme);
  }
});

watch(
  () => props.theme,
  newTheme => {
    if (newTheme) {
      applyTheme(newTheme);
    }
  },
  { deep: true },
);
</script>
