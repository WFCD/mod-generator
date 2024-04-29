import {
  CanvasRenderingContext2D,
  createCanvas,
  Image,
  loadImage,
} from "canvas";
import * as path from "path";
import { LevelStat } from "warframe-items";

const assetPath = path.join(".", "assets", "modFrames");

type RarityType = {
  [key: string]: string;
};

export const modRarityMap: RarityType = {
  common: "Bronze",
  uncommon: "Silver",
  rare: "Gold",
  legendary: "Legendary",
  riven: "Omega",
};

export async function flip(
  frame: Image,
  width: number,
  height: number,
): Promise<Buffer> {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d")!;

  context.translate(width, 0);
  context.scale(-1, 1);
  // @ts-ignore
  context.drawImage(frame, 0, 0);

  return canvas.toBuffer();
}

export interface ModFrame {
  top: Image;
  sideLights: Image;
  bottom: Image;
  cornerLights: Image;
}

export async function getFrame(tier: string): Promise<ModFrame> {
  return {
    cornerLights: await loadImage(
      path.join(assetPath, `${tier}CornerLights.png`),
    ),
    bottom: await loadImage(path.join(assetPath, `${tier}FrameBottom.png`)),
    top: await loadImage(path.join(assetPath, `${tier}FrameTop.png`)),
    sideLights: await loadImage(path.join(assetPath, `${tier}SideLight.png`)),
  };
}

// backer is drawn under the frame and over the thumbnail.
// So we want to draw at the same time we draw the background
export interface ModBackground {
  background: Image;
  backer: Image;
  lowerTab: Image;
}

export async function getBackground(tier: string): Promise<ModBackground> {
  const isRiven = tier === "Omega";

  const background = isRiven
    ? path.join(assetPath, `LegendaryBackground.png`)
    : path.join(assetPath, `${tier}Background.png`);

  const backer = isRiven
    ? path.join(assetPath, `RivenTopRightBacker.png`)
    : path.join(assetPath, `${tier}TopRightBacker.png`);

  const lowerTab = isRiven
    ? path.join(assetPath, "RivenLowerTab.png")
    : path.join(assetPath, `${tier}LowerTab.png`);

  return {
    background: await loadImage(background),
    backer: await loadImage(backer),
    lowerTab: await loadImage(lowerTab),
  };
}

export function modDescription(
  description: string | undefined,
  levelStats: LevelStat[] | undefined,
  rank: number,
): string | undefined {
  if (description && description.length !== 0) return description;

  if (levelStats) {
    const stats = levelStats[rank].stats;

    let desc = "";
    for (let i = 0; i < stats.length; i++) {
      desc = desc.concat(`${stats[i]} \n`);
    }

    return desc;
  }
}

export function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(" ");
  let currentLine = "";
  const lines = [];

  for (const word of words) {
    const testLine = currentLine + " " + word;
    const testLineWidth = context.measureText(testLine).width;

    if (testLineWidth > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  lines.push(currentLine);
  return lines;
}
