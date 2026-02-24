import { createCanvas } from '@napi-rs/canvas';
import type { Mod } from 'warframe-items';

import { backgroundImage, bottomImage, drawHeader, horizontalPad } from './drawers';
import { modRarityMap } from './styling';
import { type CanvasOutput, exportCanvas, fetchHeader, getBackground, getFrame, getTier, registerFonts } from './utils';

export interface GenerateModProps {
  mod: Mod;
  rank?: number;
  setBonus?: number;
  image?: string;
  output?: CanvasOutput;
}
/**
 * Generates a complete mod image
 *
 * Supported types:
 *  - common
 *  - uncommon
 *  - gold
 *  - primed
 *  - rivens
 *  - mod sets
 *
 * None supported mod types will default to using common as it's frame
 *
 * Notes:
 *  - Archon mods will use the gold mod frame
 * @param {GenerateModProps} props Properties to use when creating mod image
 * @returns {Promise<Buffer<ArrayBufferLike> | undefined>}
 */
const generate = async (props: GenerateModProps): Promise<Buffer<ArrayBufferLike> | undefined> => {
  // All values here should be percentages based on the background size and NOT on the canvas size.
  // The reason for this is that special mod pieces have a bigger width then the base 256 width of the background,
  // so the canvas has to be big enough to keep those parts in view.
  const { mod, output, rank, setBonus, image } = props;
  const tier = getTier(mod);
  const isRiven = tier === modRarityMap.riven;

  const canvas = createCanvas(isRiven ? 292 : 256, 512);
  const context = canvas.getContext('2d');

  const { background, backer, lowerTab } = await getBackground(tier);
  const { cornerLights, bottom, top, sideLights } = await getFrame(tier);

  const centerX = (canvas.width - background.width) / 2;
  const centerY = (canvas.height - background.height) / 2;

  registerFonts();

  const backgroundGen = await backgroundImage({
    background,
    sideLights,
    backer,
    lowerTab,
    bottom: { width: bottom.width, height: bottom.height },
    mod,
    rank,
    setBonus,
    image,
  });
  context.drawImage(backgroundGen, centerX, centerY);

  const topFrameHeight = background.height * 0.14;
  if (top.width > background.width) {
    const newXPadding = horizontalPad * 6;
    const widthDiff = top.width - background.width - newXPadding;
    context.drawImage(top, -widthDiff / 2, topFrameHeight);
  } else {
    context.drawImage(top, centerX, topFrameHeight);
  }

  if (mod.modSet) {
    const header = await fetchHeader(mod.modSet);

    context.drawImage(
      await drawHeader(header, tier),
      background.width * 0.3,
      background.height * 0.13,
      header.width * 0.8,
      header.height * 0.8
    );
  }

  if (bottom.width > background.width) {
    const newXPadding = horizontalPad * 5;
    const widthDiff = bottom.width - background.width - newXPadding;
    context.drawImage(
      await bottomImage({
        bottom,
        cornerLights,
        tier,
        max: mod.fusionLimit,
        rank,
      }),
      -widthDiff / 2,
      background.height * 0.65
    );
  } else {
    context.drawImage(
      await bottomImage({
        bottom,
        cornerLights,
        tier,
        max: mod.fusionLimit,
        rank,
      }),
      centerX,
      background.height * 0.65
    );
  }

  const outterCanvas = createCanvas(isRiven ? 292 : 256, 380);
  const outterContext = outterCanvas.getContext('2d');

  outterContext.drawImage(canvas, (outterCanvas.width - canvas.width) / 2, (outterCanvas.height - canvas.height) / 2);

  return exportCanvas(outterCanvas, output ?? { format: 'png' });
};

export default generate;
