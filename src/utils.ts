import { createCanvas, Image } from "canvas";
import * as fs from "fs";
import * as path from "path";

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

interface ModFrameParts {
  background: Buffer;
  cornerLights: Buffer;
  bottom: Buffer;
  top: Buffer;
  tab: Buffer;
  sideLights: Buffer;
  backer: Buffer;
}

export function getFrameParts(tier: string): ModFrameParts {
  const isRiven = tier === "Omega";
  const rivenbackground = fs.readFileSync(
    path.join(assetPath, `LegendaryBackground.png`),
  );
  const rivenLowerTab = fs.readFileSync(
    path.join(assetPath, `RivenLowerTab.png`),
  );
  const rivenTopRightBacker = fs.readFileSync(
    path.join(assetPath, `RivenTopRightBacker.png`),
  );

  const parts: ModFrameParts = {
    background: isRiven ? rivenbackground : fs.readFileSync(
      path.join(assetPath, `${tier}Background.png`),
    ),
    cornerLights: fs.readFileSync(
      path.join(assetPath, `${tier}CornerLights.png`),
    ),
    bottom: fs.readFileSync(path.join(assetPath, `${tier}FrameBottom.png`)),
    top: fs.readFileSync(path.join(assetPath, `${tier}FrameTop.png`)),
    tab: isRiven
      ? rivenLowerTab
      : fs.readFileSync(path.join(assetPath, `${tier}LowerTab.png`)),
    sideLights: fs.readFileSync(path.join(assetPath, `${tier}SideLight.png`)),
    backer: isRiven
      ? rivenTopRightBacker
      : fs.readFileSync(path.join(assetPath, `${tier}TopRightBacker.png`)),
  };

  return parts;
}

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
