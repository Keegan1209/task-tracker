# WIP: Email Notifications

**Status:** Partially implemented, tabled for later

## What's Built

- `lib/email.ts` — Resend integration with three email templates:
  - `sendNewJobEmail()` — sent to dev when AM creates a job
  - `sendJobDoneEmail()` — sent to AM when dev marks done
  - `sendFireAlarmEmail()` — sent to dev(s) on P1 fire alarm
- API routes wired to trigger emails on job creation and completion
- Resend API key configured in `.env.local`
- FROM address: `notifications@belooshaeb.resend.app`

## What's Missing

- Email delivery testing — not verified end-to-end
- Error handling if Resend fails (currently logs but doesn't alert user)
- Email preferences per user (opt-out, digest mode, etc.)

## To Resume

1. Test email delivery by creating a job as AM assigned to Keegan
2. Check Resend dashboard → Emails for delivery status
3. Verify email lands in `keegan.frank@ogilvy.co.za` inbox
4. Test "job done" email by marking a job complete as Keegan
5. Add error handling/retry logic if needed

## Notes

- Using Resend free tier (3,000 emails/month)
- `onboarding@resend.dev` only sends to account owner — switched to `@belooshaeb.resend.app` subdomain for unrestricted sending
- Emails pull recipient address from `users.email` column in DB
