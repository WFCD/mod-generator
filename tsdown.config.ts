import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/generator.ts'],
  copy: ['./genesis-assets/modFrames', './genesis-assets/img/polarities'],
  dts: true,
});
