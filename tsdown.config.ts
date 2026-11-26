import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/generator.ts'],
  copy: [
    { from: './genesis-assets/img/mod_assets', to: 'dist/genesis-assets/img/' },
    { from: './genesis-assets/img/polarities', to: 'dist/genesis-assets/img/' },
  ],
  dts: true,
});
