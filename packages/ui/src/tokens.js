// Design tokens from .claude/references/trello.com-DESIGN.md
export const color = {
  navyDeep: '#091E42',
  navyMedium: '#172B4D',
  navyLight: '#505F79',
  blue: '#1868DB',
  blueBright: '#357DE8',
  blueDark: '#1558BC',
  purple: '#A855F7',
  cyan: '#06B6D4',
  danger: '#C9372C',
  success: '#4C6B1F',
  errorBg: '#FFF5F4',
  white: '#FFFFFF',
  offWhite: '#F1F2F4',
  lightGray: '#DCDFE4',
  border: '#DDDEE1',
  mediumGray: '#A9ABAF',
  darkGray: '#505258',
  primaryBadgeBg: '#E0ECFF',
};

export const space = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  base: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '52px',
  xxxl: '60px',
  max: '76px',
};

export const radius = {
  badge: '2px',
  base: '4px',
  primary: '4.8px',
  large: '8px',
  pill: '50px',
};

export const shadow = {
  subtle: 'rgba(9, 30, 66, 0.13) 0px 1px 1px 0px',
  base: 'rgba(9, 30, 66, 0.15) 0px 8px 16px 0px',
  hover: 'rgba(9, 30, 66, 0.20) 0px 12px 24px 0px',
  modal: 'rgba(9, 30, 66, 0.47) 0px 8px 16px 0px',
  dropdown: 'rgba(9, 30, 66, 0.25) 0px 4px 12px 0px',
};

export const font = {
  display: "'Charlie Display', Georgia, 'Times New Roman', serif",
  text: "'Charlie Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  mono: "Menlo, Monaco, 'Courier New', monospace",
};

export const focusRing = `0px 0px 0px 3px rgba(24, 104, 219, 0.15)`;

export const breakpoint = {
  mobile: '767px',
  tablet: '1023px',
  desktop: '1279px',
};

// Curated palette for board backgrounds and label chips.
export const boardBackgrounds = [
  'linear-gradient(135deg, #1868DB 0%, #0747A6 100%)',
  'linear-gradient(135deg, #A855F7 0%, #6D28D9 100%)',
  'linear-gradient(135deg, #06B6D4 0%, #0E7490 100%)',
  'linear-gradient(135deg, #0EA47A 0%, #086650 100%)',
  'linear-gradient(135deg, #E8590C 0%, #BD3A00 100%)',
  'linear-gradient(135deg, #C9372C 0%, #8E1A12 100%)',
  'linear-gradient(135deg, #172B4D 0%, #091E42 100%)',
  'linear-gradient(135deg, #F2994A 0%, #DB6F26 100%)',
];

export const labelColors = {
  green: '#4BCE97',
  yellow: '#F5CD47',
  orange: '#FEA362',
  red: '#F87168',
  purple: '#9F8FEF',
  blue: '#579DFF',
  sky: '#6CC3E0',
  lime: '#94C748',
  pink: '#E774BB',
  gray: '#8590A2',
};
