import { createCanvas, loadImage } from '@napi-rs/canvas';
import type { Mod } from '@wfcd/items';

import '@fontsource-variable/roboto';

import { backgroundImage, bottomImage, drawHeader, horizontalPad, shadeImage } from './drawers';
import { modRarityMap, titleFont } from './styling';
import {
  type CanvasOutput,
  exportCanvas,
  fetchHeader,
  getBackground,
  getFrame,
  getTier,
  registerFonts,
  textColor,
} from './utils';

export interface GenerateModProps {
  mod: Mod;
  rank?: number;
  setBonus?: number;
  image?: string;
  output?: CanvasOutput;
}

export const generateCollapsed = async (props: GenerateModProps): Promise<Buffer<ArrayBufferLike> | undefined> => {
  registerFonts();

  const { mod, output, rank, image } = props;
  const tier = getTier(mod);
  const isRiven = tier === modRarityMap.riven;

  const canvas = createCanvas(isRiven ? 292 : 256, 256);
  const context = canvas.getContext('2d');

  const { cornerLights, bottom, top } = await getFrame(tier);

  if (mod.imageName || image) {
    const thumb = await loadImage(image ?? `https://cdn.warframestat.us/img/${mod.imageName}`);
    const thumbWidth = canvas.width - horizontalPad * 2;
    const thumbHeight = top.height / 2 + bottom.height / 2;
    const shadedImage = await shadeImage(thumb);

    context.drawImage(shadedImage, top.width * 0.03, top.height * 0.3, thumbWidth, thumbHeight);
  }

  context.fillStyle = textColor(tier);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = titleFont;
  context.fillText(mod.name, canvas.width * 0.5, top.height);

  context.drawImage(top, 0, 0);

  if (mod.modSet) {
    const header = await fetchHeader(mod.modSet);
    context.drawImage(await drawHeader(header, tier), top.width * 0.35, 0, header.width * 0.6, header.height * 0.6);
  }

  const positionY = top.height * 0.5;
  if (bottom.width > canvas.width) {
    const newXPadding = horizontalPad * 5;
    const widthDiff = bottom.width - canvas.width - newXPadding;

    context.drawImage(
      await bottomImage({
        bottom,
        cornerLights,
        tier,
        max: mod.fusionLimit,
        rank,
      }),
      -widthDiff / 2,
      positionY
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
      0,
      positionY
    );
  }

  const outterCanvas = createCanvas(isRiven ? 292 : 256, isRiven ? 180 : 150);
  const outterContext = outterCanvas.getContext('2d');

  outterContext.drawImage(canvas, 0, 0);

  return exportCanvas(outterCanvas, output ?? { format: 'png' });
};

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
  registerFonts();

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
