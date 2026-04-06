import { UpdateUserStateBody } from '../../schemas/user'
import { updateUserState } from '../../db/queries/user'
import { success } from '../../utils/response'
import { handleError } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const body = UpdateUserStateBody.parse(await readBody(event))
    return success(await updateUserState(body))
  } catch (err) {
    handleError(err)
  }
})
