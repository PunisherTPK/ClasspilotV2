# ClassPilot

ClassPilot is an offline-first Android app for teachers and small teaching institutes. It keeps institute, class, student, enrolment, session, attendance, fee, payment, and teaching-hour records on the device. There is no required account, hosted backend, or cloud sync. The app is built with Expo SDK 57.

## Start the app

```sh
npm install
npx expo install --fix
npx expo start
```

Open the QR code in Expo Go. The new backup, file picker, sharing, and PDF export flows use Expo SDK 57 modules included in Expo Go. Native face/fingerprint availability depends on the device.

## Current workflows

- Create institutes and independent classes; reuse student profiles across class enrolments.
- Keep unmarked attendance pending, cancel sessions without counting absences, and correct saved registers.
- Set one weekly class schedule and generate sessions on a rolling 30-day window. Add extra and cover-up sessions; cover-ups require an explicit replacement or separate billing choice.
- Record monthly, custom-period, daily, and hourly fee obligations. Daily billable dates and hourly student billable hours are entered manually. Currency precision follows the currency code; overlapping periods for one enrolment are blocked.
- Record partial payments against an obligation in its currency, edit or delete payments with confirmation, and keep local correction history for financial changes.
- Record actual institute teaching duration when marking an institute session held. Reports exclude cancelled sessions and do not calculate commission or teacher pay.
- Export a filtered institute report as CSV or PDF. CSV includes attendance, fee and payment rows, and actual teaching-hour records; PDF includes attendance, currency-separated fee totals, and teaching hours.
- Create and share a full versioned backup, then validate a selected backup before the user confirms full restore.
- Optional biometric app lock; it restricts app access but does not encrypt local records or backup files.

Fresh installs start empty. Existing local records from the previous app version are retained and migrated when the new data format is first saved. Records remain on the device and are not uploaded.

## Product decisions used

You approved the PRD's recommended defaults for its open financial decisions: prevent overlapping fee obligations, use currency-specific precision, and make cover-up replacement versus separate billing explicit. Financial obligations are stored as fixed historical amounts, and payments cannot be allocated across currencies or beyond an obligation's remaining amount.

## Remaining PRD work

This is still an implementation stage, not a release-complete app. It does not yet provide class-level billing defaults and student fee overrides, automatic monthly obligation generation, multi-obligation payment allocation, timetable version history, every requested report filter, or a full Android compatibility/release validation. These are not represented as complete in the UI or product copy. Review the current implementation against the PRD you supplied before treating it as ready for paid distribution.
