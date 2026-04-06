import { PhaseIdParam } from '../../../schemas/params'
import { isPhaseUnlocked } from '../../../db/queries/phases'
import { getTasksForPhase } from '../../../db/queries/tasks'
import { success } from '../../../utils/response'
import { handleError, AppError, ErrorCode } from '../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const params = PhaseIdParam.parse(getRouterParams(event))

    if (!(await isPhaseUnlocked(params.id))) {
      throw new AppError(ErrorCode.PHASE_LOCKED, `Phase ${params.id} is locked`, 403)
    }

    return success(await getTasksForPhase(params.id))
  } catch (err) {
    handleError(err)
  }
})
