import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/generator.ts'],
  copy: [
    { from: './genesis-assets/modFrames', to: 'dist/genesis-assets/' },
    { from: './genesis-assets/img/polarities', to: 'dist/genesis-assets/img/' },
  ],
  dts: true,
});
