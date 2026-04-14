/**
 * Alert Color System - Single source of truth
 */

export const ALERT_COLORS = {
  GREEN: {
    stroke: '#10B981',
    text: '#6EE7B7',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.2)',
  },
  YELLOW: {
    stroke: '#F59E0B',
    text: '#FCD34D',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
  },
  ORANGE: {
    stroke: '#F97316',
    text: '#FDBA74',
    bg: 'rgba(249,115,22,0.08)',
    border: 'rgba(249,115,22,0.2)',
  },
  RED: {
    stroke: '#EF4444',
    text: '#FCA5A5',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.2)',
  },
};

export type AlertLevel = keyof typeof ALERT_COLORS;

export function scoreToLevel(score: number): AlertLevel {
  if (score >= 71) return 'RED';
  if (score >= 46) return 'ORANGE';
  if (score >= 21) return 'YELLOW';
  return 'GREEN';
}
