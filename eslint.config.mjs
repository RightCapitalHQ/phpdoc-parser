import rcPreset from '@rightcapital/eslint-config';

const { config } = rcPreset.utils;

export default config(...rcPreset.configs.recommended);
