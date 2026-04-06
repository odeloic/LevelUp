import { PhaseIdParam } from '../../../schemas/params'
import { getResourcesForPhase } from '../../../db/queries/resources'
import { success } from '../../../utils/response'
import { handleError } from '../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const { id } = PhaseIdParam.parse(getRouterParams(event))
    return success(await getResourcesForPhase(id))
  } catch (err) {
    handleError(err)
  }
})
