# iOS to web parity audit

Use the iOS app as the source of truth for screens, layout, controls, and behavior. Keep this matrix open until each user-visible control and state has been checked on a phone-sized viewport and the matching screen in iOS. A source-code match alone is not a visual verification.

## Screen and behavior coverage

| iOS surface | iOS reference | Web surface | Current audit state | Remaining evidence or gap |
|---|---|---|---|---|
| Sign in | `Karta/LoginView.swift` | `app/login/page.tsx`, `app/AppleWebSignInButton.tsx`, `app/GuestModeButton.tsx` | Partial | Compare layout and all states with iPhone; web Apple sign-in needs an Apple Web Services ID and return URL. |
| Registration | `Karta/RegisterView.swift` | `app/register/page.tsx`, `app/actions.ts` | Partial | Compare field order, validation/error states, and successful registration. |
| Onboarding | `Karta/OnboardingView.swift` | `app/OnboardingWizard.tsx`, `app/onboarding/page.tsx` | Partial | Guest sign-in control is implemented locally; compare all three steps, city history, and keyboard behavior against iOS. Publish after review. |
| Home and score | `Karta/HomeView.swift`, `Karta/ScoreDetailSheet.swift` | `app/(app)/page.tsx`, `app/ScoreDetails.tsx` | Partial | Check card nesting/overlays, facts, progress, all task states, score details, and navigation. |
| Vaccination passport | `Karta/VaccinationsView.swift` | `app/(app)/vaccinations/page.tsx`, `app/VaccinationHistory.tsx` | Partial | Check empty/filled/upcoming states, edit/delete/next dose, date precision, and narrow-width layout. |
| Vaccine recommendations and detail | `Karta/VaccinationsView.swift`, `Karta/VaccineCatalogDetailSheet.swift`, `Karta/MarkVaccineDoneSheet.swift` | `app/(app)/vaccinations/page.tsx`, `app/VaccineRecommendationSheet.tsx`, `app/AddVaccinationSheet.tsx` | Partial | Compare every detail, regional/endemic disclosure, brand suggestions, dose schedule, and save/cancel behavior. |
| Medications and daily tasks | `Karta/MedicationsView.swift`, `Karta/AddMedicationSheet.swift`, `Karta/MonitoringCard.swift` | `app/(app)/medications/page.tsx`, `app/MedicationSheet.tsx`, `app/MedicationSchedulePicker.tsx`, `app/tasks.ts` | Partial | Check daily/weekly/as-needed schedules, multiple time slots, taken/undo, edit/delete, course monitoring, and empty state. |
| Lab results | `Karta/AnalysesView.swift`, `Karta/AddLabResultSheet.swift`, `Karta/LabResult.swift` | `app/(app)/labs/page.tsx`, `app/LabResultForm.tsx`, `app/LabResultsList.tsx`, `app/LabResultSheet.tsx` | Partial | Check CRUD, markers/ranges, attachments, file open/remove, monitoring prefill, and long lists. |
| Profile and settings | `Karta/ProfileView.swift`, `Karta/EditProfileSheet.swift`, `Karta/CityHistorySheet.swift`, `Karta/CitySearchView.swift`, `Karta/ReminderSettingsSheet.swift` | `app/(app)/profile/page.tsx`, `app/ProfileScreen.tsx`, `app/CityPicker.tsx`, `app/ReminderSettings.tsx` | Partial | Compare every edit, city-history, reminder, sign-out, and delete-account state. iOS currently describes reminders as future push functionality. |
| PDF export | `Karta/PDFExporter.swift` | `app/(app)/export/page.tsx`, `app/api/export/pdf/route.ts`, `app/PdfExportControls.tsx` | Partial | Render and compare Russian/English full, vaccination-only, and medication-only PDFs, including page breaks and long values. |
| App icon and phone layout | `Karta/Assets.xcassets/AppIcon.appiconset`, native app screens | `app/manifest.ts`, `app/globals.css`, `app/(app)/layout.tsx` | Partial | Verify installed home-screen icon, iPhone safe areas, 320–430 px widths, no horizontal overflow, and no focus zoom. |

## Recent evidence

- Local production build passed before the latest onboarding and session-priority edits; rebuild before publishing them.
- At 320×844, local onboarding showed the guest sign-in link, card, input, and primary action without overlap.
- Production Site version 68 is live at `https://karta-health.lera-wt.chatgpt.site` (HTTP 200). It predates the latest local onboarding and session-priority edits.
- Local email/guest sessions now take precedence over ChatGPT identity headers in source; verify this on the deployed Sites runtime.

## Release criteria

- Every row above has phone-sized screenshots or direct interaction evidence against the corresponding iOS screen.
- Every control, modal, empty state, validation state, save, edit, delete, and navigation path has been exercised.
- PDF exports are rendered and compared to iOS for all three scopes and both languages.
- The reviewed commit is deployed and the live URL is checked after publication.
