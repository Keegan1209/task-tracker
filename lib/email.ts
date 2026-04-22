import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'CMS Job Tracker <notifications@belooshaeb.resend.app>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Sent to dev(s) when AM creates a new job
export async function sendNewJobEmail({
  toEmail,
  toName,
  jobTitle,
  createdBy,
  priority,
  description,
}: {
  toEmail: string
  toName: string
  jobTitle: string
  createdBy: string
  priority: string
  description?: string | null
}) {
  const priorityLabel = priority === 'p1' ? '🔴 P1 Urgent' : priority === 'p2' ? '🟡 P2 Normal' : '⚪ P3 Low'

  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: `New job assigned: ${jobTitle}`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="font-size: 18px; font-weight: 600; color: #111; margin-bottom: 4px;">
          New job in your queue
        </h2>
        <p style="color: #666; font-size: 14px; margin-bottom: 24px;">
          ${createdBy} has added a job for you.
        </p>

        <div style="background: #f9f9f9; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="font-size: 16px; font-weight: 600; color: #111; margin: 0 0 8px;">${jobTitle}</p>
          <p style="font-size: 13px; color: #666; margin: 0 0 4px;">Priority: ${priorityLabel}</p>
          ${description ? `<p style="font-size: 13px; color: #444; margin: 8px 0 0;">${description}</p>` : ''}
        </div>

        <a href="${APP_URL}" style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: 500;">
          View job board →
        </a>

        <p style="color: #999; font-size: 12px; margin-top: 24px;">
          CMS Job Tracker · Ogilvy CMS Team
        </p>
      </div>
    `,
  })
}

// Sent to AM when dev marks a job done
export async function sendJobDoneEmail({
  toEmail,
  toName,
  jobTitle,
  completedBy,
}: {
  toEmail: string
  toName: string
  jobTitle: string
  completedBy: string
}) {
  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: `✅ Job completed: ${jobTitle}`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="font-size: 18px; font-weight: 600; color: #111; margin-bottom: 4px;">
          Job completed
        </h2>
        <p style="color: #666; font-size: 14px; margin-bottom: 24px;">
          ${completedBy} has marked a job as done.
        </p>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="font-size: 16px; font-weight: 600; color: #111; margin: 0;">✅ ${jobTitle}</p>
        </div>

        <a href="${APP_URL}" style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: 500;">
          View job board →
        </a>

        <p style="color: #999; font-size: 12px; margin-top: 24px;">
          CMS Job Tracker · Ogilvy CMS Team
        </p>
      </div>
    `,
  })
}

// Sent to dev(s) when a P1 fire alarm is raised
export async function sendFireAlarmEmail({
  toEmail,
  toName,
  jobTitle,
  raisedBy,
  description,
}: {
  toEmail: string
  toName: string
  jobTitle: string
  raisedBy: string
  description?: string | null
}) {
  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: `🚨 Urgent P1: ${jobTitle}`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <h2 style="font-size: 18px; font-weight: 700; color: #dc2626; margin: 0 0 8px;">
            🚨 Urgent P1 raised
          </h2>
          <p style="font-size: 16px; font-weight: 600; color: #111; margin: 0 0 8px;">${jobTitle}</p>
          <p style="font-size: 13px; color: #666; margin: 0 0 4px;">Raised by: ${raisedBy}</p>
          ${description ? `<p style="font-size: 13px; color: #444; margin: 8px 0 0;">${description}</p>` : ''}
        </div>

        <a href="${APP_URL}" style="display: inline-block; background: #dc2626; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: 600;">
          View job board →
        </a>

        <p style="color: #999; font-size: 12px; margin-top: 24px;">
          CMS Job Tracker · Ogilvy CMS Team
        </p>
      </div>
    `,
  })
}
