export async function sendEmail(opts: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set, skipping email send')
    return
  }

  try {
    await $fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        from: 'LevelUp <onboarding@resend.dev>',
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      },
    })
    console.log(`[email] Sent "${opts.subject}" to ${opts.to}`)
  } catch (err) {
    console.error(`[email] Failed to send:`, err)
    throw err
  }
}
