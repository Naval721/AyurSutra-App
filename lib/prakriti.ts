import type { Dosha, DoshaScores } from '@/lib/types';

export interface PrakritiOption {
  dosha: Dosha;
  label: string;
}

export interface PrakritiQuestion {
  id: string;
  prompt: string;
  options: PrakritiOption[];
}

/** Guided Vata-Pitta-Kapha questionnaire used at signup and on review visits. */
export const PRAKRITI_QUESTIONS: PrakritiQuestion[] = [
  {
    id: 'q-build',
    prompt: 'How would you describe your body build?',
    options: [
      { dosha: 'vata', label: 'Thin, light, hard to gain weight' },
      { dosha: 'pitta', label: 'Medium, well proportioned, toned' },
      { dosha: 'kapha', label: 'Broad, solid, gains weight easily' },
    ],
  },
  {
    id: 'q-skin',
    prompt: 'Your skin usually feels…',
    options: [
      { dosha: 'vata', label: 'Dry, rough, cool to touch' },
      { dosha: 'pitta', label: 'Warm, sensitive, flushes easily' },
      { dosha: 'kapha', label: 'Soft, oily, thick and smooth' },
    ],
  },
  {
    id: 'q-appetite',
    prompt: 'How is your appetite?',
    options: [
      { dosha: 'vata', label: 'Irregular: I forget meals' },
      { dosha: 'pitta', label: 'Strong: I get irritable if I skip a meal' },
      { dosha: 'kapha', label: 'Steady but low: I can skip meals easily' },
    ],
  },
  {
    id: 'q-digestion',
    prompt: 'After eating, you most often feel…',
    options: [
      { dosha: 'vata', label: 'Gas or bloating' },
      { dosha: 'pitta', label: 'Acidity or burning' },
      { dosha: 'kapha', label: 'Heavy and sleepy' },
    ],
  },
  {
    id: 'q-bowel',
    prompt: 'Your bowel pattern is usually…',
    options: [
      { dosha: 'vata', label: 'Dry, irregular, sometimes constipated' },
      { dosha: 'pitta', label: 'Loose, frequent, urgent' },
      { dosha: 'kapha', label: 'Regular, heavy, slow' },
    ],
  },
  {
    id: 'q-sleep',
    prompt: 'How do you sleep?',
    options: [
      { dosha: 'vata', label: 'Light: I wake often' },
      { dosha: 'pitta', label: 'Moderate: I sleep less but deeply' },
      { dosha: 'kapha', label: 'Deep and long: hard to wake up' },
    ],
  },
  {
    id: 'q-weather',
    prompt: 'Which weather bothers you most?',
    options: [
      { dosha: 'vata', label: 'Cold, dry, windy days' },
      { dosha: 'pitta', label: 'Hot, humid afternoons' },
      { dosha: 'kapha', label: 'Damp, cool, overcast weather' },
    ],
  },
  {
    id: 'q-mind',
    prompt: 'Under stress, you tend to become…',
    options: [
      { dosha: 'vata', label: 'Anxious and restless' },
      { dosha: 'pitta', label: 'Irritable and sharp' },
      { dosha: 'kapha', label: 'Withdrawn and slow to act' },
    ],
  },
  {
    id: 'q-energy',
    prompt: 'Your energy through the day is…',
    options: [
      { dosha: 'vata', label: 'In bursts, then suddenly drained' },
      { dosha: 'pitta', label: 'Intense and focused' },
      { dosha: 'kapha', label: 'Slow to start but steady' },
    ],
  },
  {
    id: 'q-memory',
    prompt: 'How is your memory?',
    options: [
      { dosha: 'vata', label: 'Quick to learn, quick to forget' },
      { dosha: 'pitta', label: 'Sharp and accurate' },
      { dosha: 'kapha', label: 'Slow to learn but never forgets' },
    ],
  },
  {
    id: 'q-speech',
    prompt: 'Your way of speaking is…',
    options: [
      { dosha: 'vata', label: 'Fast, talkative, jumps topics' },
      { dosha: 'pitta', label: 'Clear, precise, persuasive' },
      { dosha: 'kapha', label: 'Slow, calm, measured' },
    ],
  },
  {
    id: 'q-activity',
    prompt: 'Your natural pace of movement is…',
    options: [
      { dosha: 'vata', label: 'Quick and fidgety' },
      { dosha: 'pitta', label: 'Purposeful and brisk' },
      { dosha: 'kapha', label: 'Graceful and unhurried' },
    ],
  },
];

export const DOSHA_SUMMARY: Record<Dosha, { headline: string; guidance: string }> = {
  vata: {
    headline: 'Air and space dominate your constitution.',
    guidance:
      'Keep meals warm, cooked and on schedule. Favour sweet, sour and salty tastes with good fats. Daily oil massage, early bedtime and gentle grounding routines settle Vata.',
  },
  pitta: {
    headline: 'Fire and water dominate your constitution.',
    guidance:
      'Avoid skipping meals and eating in a rush. Favour cooling, bitter and astringent foods, limit chilli, coffee and midday sun. Cooling pranayama and moderate exercise keep Pitta balanced.',
  },
  kapha: {
    headline: 'Earth and water dominate your constitution.',
    guidance:
      'Rise early, stay active and keep meals light and warm. Favour pungent, bitter and astringent tastes, reduce dairy, sugar and daytime sleep to keep Kapha moving.',
  },
};

export function emptyScores(): DoshaScores {
  return { vata: 0, pitta: 0, kapha: 0 };
}

export interface PrakritiResult {
  scores: DoshaScores;
  dominant: Dosha;
  constitution: string;
}

const LABEL: Record<Dosha, string> = { vata: 'Vata', pitta: 'Pitta', kapha: 'Kapha' };

/**
 * Turns questionnaire answers into a percentage split. When the second dosha is
 * within 12 points of the first, the constitution is reported as dual.
 */
export function scorePrakriti(answers: Record<string, Dosha>): PrakritiResult {
  const counts = emptyScores();
  for (const dosha of Object.values(answers)) counts[dosha] += 1;

  const total = counts.vata + counts.pitta + counts.kapha || 1;
  const raw: [Dosha, number][] = [
    ['vata', (counts.vata / total) * 100],
    ['pitta', (counts.pitta / total) * 100],
    ['kapha', (counts.kapha / total) * 100],
  ];

  const rounded = raw.map(([dosha, value]) => [dosha, Math.round(value)] as [Dosha, number]);
  const drift = 100 - rounded.reduce((sum, [, value]) => sum + value, 0);
  const sorted = [...rounded].sort((a, b) => b[1] - a[1]);
  sorted[0][1] += drift;

  const scores: DoshaScores = { vata: 0, pitta: 0, kapha: 0 };
  for (const [dosha, value] of sorted) scores[dosha] = value;

  const dominant = sorted[0][0];
  const constitution =
    sorted[2][1] >= sorted[0][1] - 12
      ? 'Vata-Pitta-Kapha (Tridoshic)'
      : sorted[1][1] >= sorted[0][1] - 12
        ? `${LABEL[dominant]}-${LABEL[sorted[1][0]]}`
        : LABEL[dominant];

  return { scores, dominant, constitution };
}
