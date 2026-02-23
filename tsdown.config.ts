import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/generator.ts'],
  copy: ['./assets/fonts', './genesis-assets/modFrames', './genesis-assets/img/polarities'],
  dts: true,
});
