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
      if (typeof theme[themeKey] === 'object') {
        Object.keys(theme[themeKey]).forEach(childKey => {
          const themeChildKey = childKey as keyof Theme[typeof themeKey];
          if (themeChildKey !== undefined) {
            const kebabCaseChildKey = camelCaseToKebabCase(childKey);

            const themeValue = theme[themeKey] as Record<string, string>;

            body.style.setProperty(
              `--dialog-theme-${kebabCaseKey}-${kebabCaseChildKey}`,
              themeValue[themeChildKey]?.toString(),
            );
          }
        });
        return;
      }

      if (themeKey === 'ctaBorderType') {
        const borderRadius = theme[themeKey] === 'rounded' ? '24px' : '0';
        body.style.setProperty(`--dialog-theme-${kebabCaseKey}`, borderRadius);
        return;
      }

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
