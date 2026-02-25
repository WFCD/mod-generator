export const titleFont = '400 20px "Roboto"';
export const descriptionFont = '12px "Roboto"';
export const compatNameFont = '500 16px "Roboto"';

type UniquenameType = {
  [key: string]: string;
};

export const modRarityMap: UniquenameType = {
  common: 'Bronze',
  uncommon: 'Silver',
  rare: 'Gold',
  legendary: 'Legendary',
  riven: 'Omega',
};

export const tierColor: UniquenameType = {
  Bronze: '#CA9A87',
  Silver: '#FFFFFF',
  Gold: '#FAE7BE',
  Omega: '#AC83D5',
};
