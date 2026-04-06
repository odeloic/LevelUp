import { getTracks } from '../../db/queries/tracks'
import { success } from '../../utils/response'
import { handleError } from '../../utils/errors'

export default defineEventHandler(async () => {
  try {
    return success(await getTracks())
  } catch (err) {
    handleError(err)
  }
})
