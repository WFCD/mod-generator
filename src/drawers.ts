import {
  Canvas,
  CanvasRenderingContext2D,
  createCanvas,
  loadImage,
} from "canvas";
import { flip } from "./utils.js";

export interface DrawPart {
  canvas: Canvas;
  context: CanvasRenderingContext2D;
  cornerLights: Buffer;
  sideLights: Buffer;
  bottom: Buffer;
}

export async function drawLegendary(part: DrawPart) {
  const context = part.context;

  context.drawImage(await loadImage(part.bottom), 0, 340);

  // side lights
  context.drawImage(await loadImage(part.sideLights), 238, 120);
  let flipped = await flip(await loadImage(part.sideLights), 16, 256);
  context.drawImage(await loadImage(flipped), 2, 120);

  // corner lights
  context.drawImage(await loadImage(part.cornerLights), 200, 380);
  flipped = await flip(await loadImage(part.cornerLights), 64, 64);
  context.drawImage(await loadImage(flipped), -5, 380);
}

export async function drawNonLegendary(part: DrawPart) {
  const context = part.context;

  context.drawImage(await loadImage(part.bottom), 0, 340);

  // side lights
  context.drawImage(await loadImage(part.sideLights), 238, 120);
  let flipped = await flip(await loadImage(part.sideLights), 16, 256);
  context.drawImage(await loadImage(flipped), 2, 120);

  // corner lights
  context.drawImage(await loadImage(part.cornerLights), 200, 375);
  flipped = await flip(await loadImage(part.cornerLights), 16, 256);
  context.drawImage(await loadImage(flipped), -5, 375);
}

export interface DrawText {
  context: CanvasRenderingContext2D;
  name: string;
  description: string;
  compatName: string | undefined;
}

export function drawText(drawText: DrawText) {
  const context = drawText.context;
  const x = 125;

  context.fillStyle = "white";
  context.textAlign = "center";
  context.font = "bold 20px Arial";
  context.fillText(drawText.name, x, 315);

  context.font = "12px Arial";
  context.fillText(drawText.description, x, 335);

  if (drawText.compatName) {
    context.font = "10px Arial";
    context.fillText(drawText.compatName, 125, 408);
  }
}

export async function drawImage(
  src: string,
  width: number,
  height: number,
): Promise<Buffer> {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");

  context.drawImage(await loadImage(src), 0, 0, width, height);

  return canvas.toBuffer();
}
