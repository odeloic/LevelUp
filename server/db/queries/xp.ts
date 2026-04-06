export const XP_VALUES = {
  daily:         5,
  weekly:        15,
  end_of_phase:  50,
  phase_unlock:  100,
  streak_7_days: 75,
} as const

export function calcCompletionXp(
  cadence: 'daily' | 'weekly' | 'end_of_phase',
  isDeliverable: number,
): number {
  if (cadence === 'end_of_phase') return XP_VALUES.end_of_phase
  return XP_VALUES[cadence] + (isDeliverable === 1 ? XP_VALUES.end_of_phase : 0)
}

export function calcStreakBonus(streakDays: number): number {
  return streakDays > 0 && streakDays % 7 === 0 ? XP_VALUES.streak_7_days : 0
}
