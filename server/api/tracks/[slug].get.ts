import { getTrackBySlug } from '../../db/queries/tracks'
import { success } from '../../utils/response'
import { handleError } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const slug = getRouterParam(event, 'slug')!
    return success(await getTrackBySlug(slug))
  } catch (err) {
    handleError(err)
  }
})
