import { getXpHistory } from '../../db/queries/xp'
import { success } from '../../utils/response'
import { handleError } from '../../utils/errors'

export default defineEventHandler(async () => {
  try {
    return success(await getXpHistory())
  } catch (err) {
    handleError(err)
  }
})
