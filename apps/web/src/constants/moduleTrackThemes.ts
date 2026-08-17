/**
 * Track themes for Learn modules.
 * Each track has a distinct look so users can tell them apart at a glance.
 */

export type TrackKey = 'entrepreneurship' | 'project_based' | 'online_class' | 'recording';

export interface TrackTheme {
  name: string;
  icon: string;
  sectionBg: string;
  badge: string;
  cardBorder: string;
  cardBorderHover: string;
  placeholderBg: string;
  progressBar: string;
  button: string;
  buttonHover: string;
  accentText: string;
  titleHover: string;
  lessonBorder: string;
  lessonBorderHover: string;
  lessonBgHover: string;
  heroGradient: string;
  sectionBorder: string;
  sectionAccent: string;
}

const defaultTheme: TrackTheme = {
  name: 'Module',
  icon: '📚',
  sectionBg: 'bg-gray-50',
  badge: 'bg-gray-100 text-gray-800 border-gray-200',
  cardBorder: 'border-gray-200',
  cardBorderHover: 'hover:border-gray-300',
  placeholderBg: 'bg-gray-100',
  progressBar: 'bg-gray-500',
  button: 'bg-gray-600',
  buttonHover: 'hover:bg-gray-700',
  accentText: 'text-gray-600',
  titleHover: 'group-hover:text-gray-700',
  lessonBorder: 'border-gray-200',
  lessonBorderHover: 'hover:border-gray-300',
  lessonBgHover: 'hover:bg-gray-50',
  heroGradient: 'from-gray-100 to-gray-50',
  sectionBorder: 'border-2 border-gray-300',
  sectionAccent: 'border-l-4 border-gray-400',
};

export const TRACK_THEMES: Record<TrackKey, TrackTheme> = {
  entrepreneurship: {
    name: 'Interactive Games',
    icon: '🎮',
    sectionBg: 'bg-gradient-to-br from-purple-50 via-white to-amber-50',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    cardBorder: 'border-purple-200',
    cardBorderHover: 'hover:border-purple-400',
    placeholderBg: 'bg-gradient-to-br from-purple-100 to-purple-50',
    progressBar: 'bg-purple-500',
    button: 'bg-purple-600',
    buttonHover: 'hover:bg-purple-700',
    accentText: 'text-purple-600',
    titleHover: 'group-hover:text-purple-600',
    lessonBorder: 'border-purple-200',
    lessonBorderHover: 'hover:border-purple-300',
    lessonBgHover: 'hover:bg-purple-50',
    heroGradient: 'from-purple-100 via-purple-50 to-amber-50',
    sectionBorder: 'border-2 border-purple-300',
    sectionAccent: 'border-l-4 border-purple-500',
  },
  project_based: {
    name: 'Project Based',
    icon: '🔨',
    sectionBg: 'bg-gradient-to-br from-green-50 via-white to-emerald-50',
    badge: 'bg-green-100 text-green-800 border-green-200',
    cardBorder: 'border-green-200',
    cardBorderHover: 'hover:border-green-400',
    placeholderBg: 'bg-gradient-to-br from-green-100 to-emerald-50',
    progressBar: 'bg-green-500',
    button: 'bg-green-600',
    buttonHover: 'hover:bg-green-700',
    accentText: 'text-green-600',
    titleHover: 'group-hover:text-green-600',
    lessonBorder: 'border-green-200',
    lessonBorderHover: 'hover:border-green-300',
    lessonBgHover: 'hover:bg-green-50',
    heroGradient: 'from-green-100 via-emerald-50 to-teal-50',
    sectionBorder: 'border-2 border-green-300',
    sectionAccent: 'border-l-4 border-green-500',
  },
  online_class: {
    name: 'Online Class',
    icon: '💻',
    sectionBg: 'bg-gradient-to-br from-cyan-50 via-white to-blue-50',
    badge: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    cardBorder: 'border-cyan-200',
    cardBorderHover: 'hover:border-cyan-400',
    placeholderBg: 'bg-gradient-to-br from-cyan-100 to-blue-50',
    progressBar: 'bg-cyan-500',
    button: 'bg-cyan-600',
    buttonHover: 'hover:bg-cyan-700',
    accentText: 'text-cyan-600',
    titleHover: 'group-hover:text-cyan-600',
    lessonBorder: 'border-cyan-200',
    lessonBorderHover: 'hover:border-cyan-300',
    lessonBgHover: 'hover:bg-cyan-50',
    heroGradient: 'from-cyan-100 via-blue-50 to-sky-50',
    sectionBorder: 'border-2 border-cyan-300',
    sectionAccent: 'border-l-4 border-cyan-500',
  },
  recording: {
    name: 'Recording',
    icon: '🎥',
    sectionBg: 'bg-gradient-to-br from-red-50 via-white to-rose-50',
    badge: 'bg-red-100 text-red-800 border-red-200',
    cardBorder: 'border-red-200',
    cardBorderHover: 'hover:border-red-400',
    placeholderBg: 'bg-gradient-to-br from-red-100 to-rose-50',
    progressBar: 'bg-red-500',
    button: 'bg-red-600',
    buttonHover: 'hover:bg-red-700',
    accentText: 'text-red-600',
    titleHover: 'group-hover:text-red-600',
    lessonBorder: 'border-red-200',
    lessonBorderHover: 'hover:border-red-300',
    lessonBgHover: 'hover:bg-red-50',
    heroGradient: 'from-red-100 via-rose-50 to-pink-50',
    sectionBorder: 'border-2 border-red-300',
    sectionAccent: 'border-l-4 border-red-500',
  },
};

export const CATEGORY_ORDER: TrackKey[] = [
  'entrepreneurship',
  'project_based',
  'online_class',
  'recording',
];

export function getTrackTheme(track: string): TrackTheme {
  if (track in TRACK_THEMES) {
    return TRACK_THEMES[track as TrackKey];
  }
  return defaultTheme;
}

/** Theme presets by key for admin-created learning tracks (from DB theme_key). */
export type ThemeKey = 'gray' | 'purple' | 'green' | 'cyan' | 'red' | 'indigo';

export const THEME_PRESETS: Record<ThemeKey, TrackTheme> = {
  gray: defaultTheme,
  purple: TRACK_THEMES.entrepreneurship,
  green: TRACK_THEMES.project_based,
  cyan: TRACK_THEMES.online_class,
  red: TRACK_THEMES.recording,
  indigo: {
    name: 'Video',
    icon: '🎬',
    sectionBg: 'bg-gradient-to-br from-indigo-50 via-white to-violet-50',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    cardBorder: 'border-indigo-200',
    cardBorderHover: 'hover:border-indigo-400',
    placeholderBg: 'bg-gradient-to-br from-indigo-100 to-violet-50',
    progressBar: 'bg-indigo-500',
    button: 'bg-indigo-600',
    buttonHover: 'hover:bg-indigo-700',
    accentText: 'text-indigo-600',
    titleHover: 'group-hover:text-indigo-600',
    lessonBorder: 'border-indigo-200',
    lessonBorderHover: 'hover:border-indigo-300',
    lessonBgHover: 'hover:bg-indigo-50',
    heroGradient: 'from-indigo-100 via-violet-50 to-purple-50',
    sectionBorder: 'border-2 border-indigo-300',
    sectionAccent: 'border-l-4 border-indigo-500',
  },
};

export function getThemeForKey(theme_key: string): TrackTheme {
  if (theme_key in THEME_PRESETS) {
    return THEME_PRESETS[theme_key as ThemeKey];
  }
  return defaultTheme;
}