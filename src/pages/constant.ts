export const PageSizes = {
  A0: {
    w: 841,
    h: 1189,
  },
  A1: {
    w: 594,
    h: 841,
  },
  A2: {
    w: 420,
    h: 594,
  },
  A3: {
    w: 297,
    h: 420,
  },
  A4: {
    w: 210,
    h: 297,
  },
};

export const Answer = '78ac00cf8aa4bce60d7f1113e32afb70';

export const DefaultTemplate = [
  '25*25',
  '30*30',
  '30*40',
  '40*40',
  '50*40',
  '110*50',
  '120*60',
  '130*70',
];

export const FontBasicColumns = [
  { text: '隶二', key: `FLS2` },
  { text: '隶书', key: 'LiSu2, LiSu' },
  { text: '魏碑体', key: `WeibeiSC-Bold2, 'Weibei SC'` },
  { text: '楷书', key: `KaiTi2, KaiTi` },
  // { text: '行书', key: `STXingkai, 'Xingkai  SC'` },
];

export const PageRectColumns: Array<{
  text: keyof typeof PageSizes;
  key: keyof typeof PageSizes;
}> = [
  { text: 'A4', key: `A4` },
  { text: 'A3', key: `A3` },
  { text: 'A2', key: `A2` },
  { text: 'A1', key: `A1` },
  { text: 'A0', key: `A0` },
];

export const ValidSize = PageRectColumns.map(({ key }) => key);
