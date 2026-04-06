import { getUserState } from '../../db/queries/user'
import { success } from '../../utils/response'
import { handleError } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    return success(await getUserState())
  } catch (err) {
    handleError(err)
  }
})
