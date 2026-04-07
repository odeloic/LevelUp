import { getUserState, updateUserState } from '../../db/queries/user'
import { sendEmail } from '../../utils/email'
import { gentleReminder, urgentReminder } from '../../utils/reminder-emails'
import { success } from '../../utils/response'
import { handleError, AppError, ErrorCode } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    // Vercel cron sends Authorization: Bearer <CRON_SECRET>
    const secret = process.env.CRON_SECRET
    if (secret) {
      const auth = getHeader(event, 'authorization')
      if (auth !== `Bearer ${secret}`) {
        throw new AppError(ErrorCode.INVALID_PARAMS, 'Unauthorized', 401)
      }
    }

    const emailTo = process.env.REMINDER_EMAIL_TO
    if (!emailTo) {
      return success({ action: 'skipped', reason: 'REMINDER_EMAIL_TO not set' })
    }

    const user = await getUserState()

    if (!user.lastActiveDate) {
      return success({ action: 'skipped', reason: 'no activity yet' })
    }

    const daysInactive = Math.floor(
      (Date.now() - new Date(user.lastActiveDate).getTime()) / 86_400_000,
    )

    if (daysInactive < 3) {
      if (user.reminderLevel > 0) {
        await updateUserState({ reminderLevel: 0 })
      }
      return success({ action: 'none', daysInactive })
    }

    if (daysInactive >= 7 && user.reminderLevel < 2) {
      const email = urgentReminder(daysInactive)
      await sendEmail({ to: emailTo, ...email })
      await updateUserState({ reminderLevel: 2 })
      return success({ action: 'sent_urgent', daysInactive })
    }

    if (daysInactive >= 3 && user.reminderLevel < 1) {
      const email = gentleReminder(daysInactive)
      await sendEmail({ to: emailTo, ...email })
      await updateUserState({ reminderLevel: 1 })
      return success({ action: 'sent_gentle', daysInactive })
    }

    return success({ action: 'already_reminded', daysInactive, level: user.reminderLevel })
  } catch (err) {
    handleError(err)
  }
})
