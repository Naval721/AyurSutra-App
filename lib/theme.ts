import type { Dosha } from '@/lib/types';

/**
 * Hex mirrors of the custom --color-* utilities declared in global.css.
 * Use these only where a value is passed to a native prop that cannot resolve
 * Uniwind classNames (icon colors, navigation tints, StatusBar).
 */
export const DOSHA_HEX: Record<Dosha, string> = {
  vata: '#6f7fd0',
  pitta: '#d4703a',
  kapha: '#3f9c92',
};

export const DOSHA_SOFT_HEX: Record<Dosha, string> = {
  vata: '#e6e8fa',
  pitta: '#fae5da',
  kapha: '#dcf1ee',
};

export const BRAND_HEX = {
  bark: '#4a3b2c',
  barkSoft: '#6b5843',
  saffron: '#dd8c2d',
  saffronSoft: '#fbe6c8',
  turmeric: '#efb135',
  cream: '#faf3e7',
} as const;

export const DOSHA_LABEL: Record<Dosha, string> = {
  vata: 'Vata',
  pitta: 'Pitta',
  kapha: 'Kapha',
};

export const DOSHA_ELEMENT: Record<Dosha, string> = {
  vata: 'Air + Ether',
  pitta: 'Fire + Water',
  kapha: 'Earth + Water',
};

/** Tailwind/Uniwind class fragments per dosha, for className usage. */
export const DOSHA_CLASS: Record<Dosha, { text: string; bg: string; softBg: string }> = {
  vata: { text: 'text-vata', bg: 'bg-vata', softBg: 'bg-vata-soft' },
  pitta: { text: 'text-pitta', bg: 'bg-pitta', softBg: 'bg-pitta-soft' },
  kapha: { text: 'text-kapha', bg: 'bg-kapha', softBg: 'bg-kapha-soft' },
};
