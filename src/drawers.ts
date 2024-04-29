import { CanvasRenderingContext2D, createCanvas, loadImage } from "canvas";
import { flip, getBackground, getFrame, wrapText } from "./utils.js";

export async function drawLegendaryFrame(
  tier: string,
  width: number,
  height: number,
): Promise<Buffer> {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  const frame = await getFrame(tier);

  context.drawImage(frame.top, 0, 70);
  context.drawImage(frame.bottom, 0, 340);

  // side lights
  context.drawImage(frame.sideLights, 238, 120);
  let flipped = await flip(frame.sideLights, 16, 256);
  context.drawImage(await loadImage(flipped), 2, 120);

  // corner lights
  context.drawImage(frame.cornerLights, 200, 380);
  flipped = await flip(frame.cornerLights, 64, 64);
  context.drawImage(await loadImage(flipped), -5, 380);

  return canvas.toBuffer();
}

export async function drawFrame(
  tier: string,
  width: number,
  height: number,
): Promise<Buffer> {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  const frame = await getFrame(tier);

  context.drawImage(frame.top, 0, 70);
  context.drawImage(frame.bottom, 0, 340);

  // side lights
  context.drawImage(frame.sideLights, 238, 120);
  let flipped = await flip(frame.sideLights, 16, 256);
  context.drawImage(await loadImage(flipped), 2, 120);

  // corner lights
  context.drawImage(frame.cornerLights, 200, 375);
  flipped = await flip(frame.cornerLights, 16, 256);
  context.drawImage(await loadImage(flipped), -5, 375);

  return canvas.toBuffer();
}

export interface DrawBackground {
  tier: string;
  thumbnail: string | undefined;
  name: string;
  description: string;
  compatName: string | undefined;
}

export async function drawBackground(
  toDraw: DrawBackground,
  width: number,
  height: number,
): Promise<Buffer> {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  const surface = await getBackground(toDraw.tier);

  context.drawImage(surface.background, 0, 0);
  if (toDraw.thumbnail) {
    const thumb = `https://cdn.warframestat.us/img/${toDraw.thumbnail}`;
    context.drawImage(await loadImage(thumb), 10, 90, 239, 200);
  }

  context.drawImage(surface.backer, 205, 95);
  drawText(context, toDraw.name, toDraw.description, toDraw.compatName);

  return canvas.toBuffer();
}

export function drawText(
  context: CanvasRenderingContext2D,
  name: string,
  description: string | undefined,
  compatName: string | undefined,
) {
  const x = 125;

  context.fillStyle = "white";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "bold 20px Arial";
  context.fillText(name, x, 315);

  context.font = "12px Arial";
  if (description) {
    let start = 335;
    let lines = description.split("\n");

    for (const line of lines) {
      const texts = wrapText(context, line, 230);
      for (const text of texts) {
        context.fillText(text, x, start);
        start += 20;
      }
    }
  }

  if (compatName) {
    context.font = "10px Arial";
    context.fillText(compatName, 125, 408);
  }
}
