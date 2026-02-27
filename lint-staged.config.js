export default {
  "*.ts": [
    "biome check --write",
    () => "tsc -p tsconfig.json --noEmit",
    () => "npm test"
  ],
  "**/*.{json,yaml,yml,md},!package*.json": [
    "prettier --write"
  ],
  "package*.json": [
    "biome format --write",
    "npm -q --no-progress dedupe"
  ]
}