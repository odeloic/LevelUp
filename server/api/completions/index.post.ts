import { LogCompletionBody } from '../../schemas/completions'
import { logCompletion } from '../../db/queries/completions'
import { getTaskById } from '../../db/queries/tasks'
import { isPhaseUnlocked, getChildPhaseUnlockStates } from '../../db/queries/phases'
import { getUserState, updateUserState, nextStreak } from '../../db/queries/user'
import { calcCompletionXp, calcStreakBonus, logXpEvent, XP_VALUES } from '../../db/queries/xp'
import { success } from '../../utils/response'
import { handleError, AppError, ErrorCode } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const body = LogCompletionBody.parse(await readBody(event))

    const task = await getTaskById(body.taskId)

    if (!(await isPhaseUnlocked(task.phaseId))) {
      throw new AppError(ErrorCode.PHASE_LOCKED, `Phase ${task.phaseId} is locked`, 403)
    }

    const beforeStates = await getChildPhaseUnlockStates(task.phaseId)
    const completion = await logCompletion(body)

    const user = await getUserState()
    const newStreak = nextStreak(user.streakDays, user.lastActiveDate)
    const completionXp = calcCompletionXp(
      task.cadence as 'daily' | 'weekly' | 'end_of_phase',
      task.isDeliverable,
    )
    const streakBonus = calcStreakBonus(newStreak)

    const afterStates = await getChildPhaseUnlockStates(task.phaseId)
    const newlyUnlocked = afterStates.filter(
      (after) => after.unlocked && !beforeStates.find((b) => b.phaseId === after.phaseId)?.unlocked,
    )

    const xpDelta = completionXp + streakBonus + newlyUnlocked.length * XP_VALUES.phase_unlock

    const completionEventType = (task.isDeliverable === 1 ? 'deliverable' : task.cadence) as
      'daily' | 'weekly' | 'end_of_phase' | 'deliverable'

    await Promise.all([
      logXpEvent({ eventType: completionEventType, amount: completionXp, taskId: task.id }),
      streakBonus > 0
        ? logXpEvent({ eventType: 'streak_7_days', amount: streakBonus })
        : Promise.resolve(),
      ...newlyUnlocked.map((u) =>
        logXpEvent({ eventType: 'phase_unlock', amount: XP_VALUES.phase_unlock, phaseId: u.phaseId }),
      ),
      updateUserState({
        xp:             user.xp + xpDelta,
        streakDays:     newStreak,
        lastActiveDate: new Date().toISOString().slice(0, 10),
      }),
    ])

    const updatedUser = await getUserState()

    return success({
      completion,
      xpAwarded:             xpDelta,
      newlyUnlockedPhaseIds: newlyUnlocked.map((p) => p.phaseId),
      user:                  updatedUser,
    })
  } catch (err) {
    handleError(err)
  }
})
