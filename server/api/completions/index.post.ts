import { LogCompletionBody } from '../../schemas/completions'
import { logCompletion } from '../../db/queries/completions'
import { getTaskById } from '../../db/queries/tasks'
import { isPhaseUnlocked, getChildPhaseUnlockStates } from '../../db/queries/phases'
import { getUserState, updateUserState, nextStreak } from '../../db/queries/user'
import { calcCompletionXp, calcStreakBonus, XP_VALUES } from '../../db/queries/xp'
import { success } from '../../utils/response'
import { handleError, AppError, ErrorCode } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const body = LogCompletionBody.parse(await readBody(event))

    const task = await getTaskById(body.taskId)

    if (!(await isPhaseUnlocked(task.phaseId))) {
      throw new AppError(ErrorCode.PHASE_LOCKED, `Phase ${task.phaseId} is locked`, 403)
    }

    // Snapshot child phase unlock states before logging completion
    const beforeStates = await getChildPhaseUnlockStates(task.phaseId)

    const completion = await logCompletion(body)

    // Calculate XP
    const user = await getUserState()
    const newStreak = nextStreak(user.streakDays, user.lastActiveDate)
    let xpDelta = calcCompletionXp(
      task.cadence as 'daily' | 'weekly' | 'end_of_phase',
      task.isDeliverable,
    )
    xpDelta += calcStreakBonus(newStreak)

    // Award phase unlock XP for any newly unlocked child phases
    const afterStates = await getChildPhaseUnlockStates(task.phaseId)
    const newlyUnlocked = afterStates.filter(
      (after) => after.unlocked && !beforeStates.find((b) => b.phaseId === after.phaseId)?.unlocked,
    )
    xpDelta += newlyUnlocked.length * XP_VALUES.phase_unlock

    const updatedUser = await updateUserState({
      xp:             user.xp + xpDelta,
      streakDays:     newStreak,
      lastActiveDate: new Date().toISOString().slice(0, 10),
    })

    return success({ completion, xpAwarded: xpDelta, user: updatedUser })
  } catch (err) {
    handleError(err)
  }
})
