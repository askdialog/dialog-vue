<template>
  <slot></slot>
</template>

<script lang="ts">
import { type Theme } from '@dialog/dialog-custom-sdk';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ThemeProviderV2',
  props: {
    theme: {
      type: Object as () => Theme,
      required: true,
    },
  },
  mounted() {
    if (this.theme) {
      this.applyTheme(this.theme);
    }
  },
  methods: {
    camelCaseToKebabCase(label: string): string {
      return label.replace(/([A-Z])/g, '-$1').toLowerCase();
    },
    applyTheme(theme: Theme): void {
      if (!theme) return;
      Object.keys(theme).forEach(key => {
        const themeKey = key as keyof Theme;
        const kebabCaseKey = this.camelCaseToKebabCase(key);
        if (theme[themeKey] !== undefined) {
          document.body.style.setProperty(
            `--dialog-theme-${kebabCaseKey}`,
            theme[themeKey].toString(),
          );
        }
      });
    },
  },
});
</script>
