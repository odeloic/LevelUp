export function gentleReminder(daysInactive: number): { subject: string; html: string } {
  return {
    subject: `Hey — it's been ${daysInactive} days`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
        <h2 style="font-size: 18px; font-weight: 600; color: #18181b;">Hey, how's it going?</h2>
        <p style="font-size: 14px; color: #52525b; line-height: 1.6;">
          It's been <strong>${daysInactive} days</strong> since your last check-in on LevelUp.
          No pressure — just a gentle nudge to keep the momentum going when you're ready.
        </p>
        <p style="font-size: 14px; color: #52525b; line-height: 1.6;">
          Even logging one small thing counts. You've got this.
        </p>
        <p style="font-size: 12px; color: #a1a1aa; margin-top: 24px;">— LevelUp</p>
      </div>
    `,
  }
}

export function urgentReminder(daysInactive: number): { subject: string; html: string } {
  return {
    subject: `${daysInactive} days without a check-in — everything okay?`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
        <h2 style="font-size: 18px; font-weight: 600; color: #18181b;">Umm, not nice!</h2>
        <p style="font-size: 14px; color: #52525b; line-height: 1.6;">
          It's been <strong>${daysInactive} days</strong> since you last checked in.
          Life happens — but your roadmap is still waiting for you.
        </p>
        <p style="font-size: 14px; color: #52525b; line-height: 1.6;">
          Pick one small task and log it. That's all it takes to get back on track.
        </p>
        <p style="font-size: 12px; color: #a1a1aa; margin-top: 24px;">— LevelUp</p>
      </div>
    `,
  }
}
