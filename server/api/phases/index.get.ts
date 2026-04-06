import { getActivePhases, getUnlockedPhases } from '../../db/queries/phases'
import { success } from '../../utils/response'
import { handleError } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const { all } = getQuery(event)
    const data = all === 'true' ? await getActivePhases() : await getUnlockedPhases()
    return success(data)
  } catch (err) {
    handleError(err)
  }
})
