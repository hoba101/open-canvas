export type ThemeId = 'midnight' | 'rose' | 'contrast';

export interface ThemePalette {
  id: ThemeId;
  name: string;
  emoji: string;
  // Canvas
  canvasBg: string;
  dotColor: string;
  // Panels / glass surfaces
  panelBg: string;
  panelBorder: string;
  panelShadow: string;
  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  // Nodes
  nodeBg: string;
  nodeBorder: string;
  nodeSelectedRing: string;
  nodeSelectedShadow: string;
  // Inputs
  inputBg: string;
  inputText: string;
  inputPlaceholder: string;
  // Buttons / accents
  accent: string;
  accentHover: string;
  accentText: string;
  // Edges
  edgeStroke: string;
  // Danger
  danger: string;
  dangerHover: string;
  // Modal overlay
  overlayBg: string;
  modalBg: string;
  modalBorder: string;
  // React Flow colorMode
  rfColorMode: 'dark' | 'light';
}

export const themes: Record<ThemeId, ThemePalette> = {
  midnight: {
    id: 'midnight',
    name: 'Midnight Cyber',
    emoji: '🌙',
    canvasBg: '#0f172a',
    dotColor: '#1e3a5f',
    panelBg: 'rgba(15, 23, 42, 0.85)',
    panelBorder: 'rgba(56, 189, 248, 0.2)',
    panelShadow: '0 8px 32px rgba(0,0,0,0.5)',
    textPrimary: '#f1f5f9',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    nodeBg: 'rgba(15, 23, 42, 0.80)',
    nodeBorder: 'rgba(56, 189, 248, 0.25)',
    nodeSelectedRing: '#38bdf8',
    nodeSelectedShadow: '0 0 20px rgba(56, 189, 248, 0.3)',
    inputBg: 'rgba(30, 41, 59, 0.9)',
    inputText: '#e2e8f0',
    inputPlaceholder: '#64748b',
    accent: '#38bdf8',
    accentHover: '#0ea5e9',
    accentText: '#0f172a',
    edgeStroke: '#38bdf8',
    danger: '#f43f5e',
    dangerHover: '#e11d48',
    overlayBg: 'rgba(0, 0, 0, 0.6)',
    modalBg: '#1e293b',
    modalBorder: 'rgba(56, 189, 248, 0.2)',
    rfColorMode: 'dark',
  },
  rose: {
    id: 'rose',
    name: 'Soft Rose',
    emoji: '🌸',
    canvasBg: '#fdf2f8',
    dotColor: '#f9a8d4',
    panelBg: 'rgba(255, 255, 255, 0.88)',
    panelBorder: 'rgba(244, 114, 182, 0.25)',
    panelShadow: '0 8px 32px rgba(244, 114, 182, 0.12)',
    textPrimary: '#4a1942',
    textSecondary: '#9d4c8a',
    textMuted: '#c084a0',
    nodeBg: 'rgba(255, 255, 255, 0.75)',
    nodeBorder: 'rgba(244, 114, 182, 0.3)',
    nodeSelectedRing: '#ec4899',
    nodeSelectedShadow: '0 0 20px rgba(236, 72, 153, 0.25)',
    inputBg: 'rgba(253, 242, 248, 0.95)',
    inputText: '#4a1942',
    inputPlaceholder: '#d4a0c0',
    accent: '#ec4899',
    accentHover: '#db2777',
    accentText: '#ffffff',
    edgeStroke: '#f472b6',
    danger: '#e11d48',
    dangerHover: '#be123c',
    overlayBg: 'rgba(77, 25, 66, 0.4)',
    modalBg: '#ffffff',
    modalBorder: 'rgba(244, 114, 182, 0.3)',
    rfColorMode: 'light',
  },
  contrast: {
    id: 'contrast',
    name: 'High Contrast',
    emoji: '⚡',
    canvasBg: '#000000',
    dotColor: '#333333',
    panelBg: 'rgba(20, 20, 20, 0.92)',
    panelBorder: 'rgba(255, 255, 255, 0.15)',
    panelShadow: '0 8px 32px rgba(0,0,0,0.8)',
    textPrimary: '#ffffff',
    textSecondary: '#d4d4d4',
    textMuted: '#a3a3a3',
    nodeBg: 'rgba(23, 23, 23, 0.90)',
    nodeBorder: 'rgba(255, 255, 255, 0.2)',
    nodeSelectedRing: '#fbbf24',
    nodeSelectedShadow: '0 0 20px rgba(251, 191, 36, 0.4)',
    inputBg: 'rgba(38, 38, 38, 0.95)',
    inputText: '#ffffff',
    inputPlaceholder: '#737373',
    accent: '#fbbf24',
    accentHover: '#f59e0b',
    accentText: '#000000',
    edgeStroke: '#fbbf24',
    danger: '#ef4444',
    dangerHover: '#dc2626',
    overlayBg: 'rgba(0, 0, 0, 0.75)',
    modalBg: '#171717',
    modalBorder: 'rgba(251, 191, 36, 0.2)',
    rfColorMode: 'dark',
  },
};
