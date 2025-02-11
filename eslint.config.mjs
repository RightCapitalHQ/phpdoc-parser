import rcPreset from '@rightcapital/eslint-config';

const { defineConfig } = rcPreset.utils;

export default defineConfig(...rcPreset.configs.recommended);
