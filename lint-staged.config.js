export default {
  "*.ts": [
    "biome check --write",
    "prettier --write",
    () => "tsc -p tsconfig.json --noEmit",
    () => "npm test"
  ],
  "**/*.{json,yaml,yml,md},!package*.json": [
    "prettier --write"
  ],
  "package*.json": [
    "prettier --write",
    "npm -q --no-progress dedupe"
  ]
}