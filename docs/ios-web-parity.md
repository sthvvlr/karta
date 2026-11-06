# iOS to web parity audit

Use the iOS app as the source of truth for screens, layout, controls, and behavior. Keep this matrix open until each user-visible control and state has been checked on a phone-sized viewport and the matching screen in iOS. A source-code match alone is not a visual verification.

## Screen and behavior coverage

| iOS surface | iOS reference | Web surface | Current audit state | Remaining evidence or gap |
|---|---|---|---|---|
| Sign in | `Karta/LoginView.swift` | `app/login/page.tsx`, `app/AppleWebSignInButton.tsx`, `app/GuestModeButton.tsx` | Partial | Compare layout and all states with iPhone; web Apple sign-in cannot be activated until an Apple Web Services ID and return URL are configured. |
| Registration | `Karta/RegisterView.swift` | `app/register/page.tsx`, `app/actions.ts` | Flow verified; visual pending | Web registration succeeds and return flow was exercised with a temporary local account; compare error and loading states with iOS. Registration layout now follows native close/header/glass-card structure. |
| Onboarding | `Karta/OnboardingView.swift` | `app/OnboardingWizard.tsx`, `app/onboarding/page.tsx` | Flow verified; visual pending | All three steps saved name, gender, current city, and city history on a temporary local account; verify optional birth date, keyboard behavior, and direct iOS comparison. |
| Home and score | `Karta/HomeView.swift`, `Karta/ScoreDetailSheet.swift` | `app/(app)/page.tsx`, `app/ScoreDetails.tsx` | Source-reviewed; visual pending | Nested fact/score/export card now follows iOS structure; verify screenshots, task states, score details, and navigation on iPhone. |
| Vaccination passport | `Karta/VaccinationsView.swift` | `app/(app)/vaccinations/page.tsx`, `app/VaccinationHistory.tsx` | Partial | Empty-name validation now stays open and matches iOS; source review covered record/upcoming CRUD and next-dose controls. Compare all populated states, date precision, and narrow-width layout visually. |
| Vaccine recommendations and detail | `Karta/VaccinationsView.swift`, `Karta/VaccineCatalogDetailSheet.swift`, `Karta/MarkVaccineDoneSheet.swift` | `app/(app)/vaccinations/page.tsx`, `app/VaccineRecommendationSheet.tsx`, `app/AddVaccinationSheet.tsx` | Partial | Compare every detail, regional/endemic disclosure, brand suggestions, dose schedule, and save/cancel behavior. |
| Medications and daily tasks | `Karta/MedicationsView.swift`, `Karta/AddMedicationSheet.swift`, `Karta/MonitoringCard.swift` | `app/(app)/medications/page.tsx`, `app/MedicationSheet.tsx`, `app/MedicationSchedulePicker.tsx`, `app/tasks.ts` | Partial | Source review covered time sections, shared taken state, edit/delete, and course reminders; check all schedules, empty state, and modals visually. |
| Lab results | `Karta/AnalysesView.swift`, `Karta/AddLabResultSheet.swift`, `Karta/LabResult.swift` | `app/(app)/labs/page.tsx`, `app/LabResultForm.tsx`, `app/LabResultsList.tsx`, `app/LabResultSheet.tsx` | Partial | Empty state now uses the native labelled add action; check CRUD, markers/ranges, attachments, file open/remove, monitoring prefill, and long lists. |
| Profile and settings | `Karta/ProfileView.swift`, `Karta/EditProfileSheet.swift`, `Karta/CityHistorySheet.swift`, `Karta/CitySearchView.swift`, `Karta/ReminderSettingsSheet.swift` | `app/(app)/profile/page.tsx`, `app/ProfileScreen.tsx`, `app/CityPicker.tsx`, `app/ReminderSettings.tsx` | Partial | Compare every edit, city-history, reminder, sign-out, and delete-account state. iOS currently describes reminders as future push functionality. |
| PDF export | `Karta/PDFExporter.swift` | `app/(app)/export/page.tsx`, `app/api/export/pdf/route.ts`, `app/PdfExportControls.tsx` | Partial | Render and compare Russian/English full, vaccination-only, and medication-only PDFs, including page breaks and long values. |
| App icon and phone layout | `Karta/Assets.xcassets/AppIcon.appiconset`, native app screens | `app/manifest.ts`, `app/globals.css`, `app/(app)/layout.tsx` | Partial | Verify installed home-screen icon, iPhone safe areas, 320–430 px widths, no horizontal overflow, and no focus zoom. |

## Recent evidence

- Production Site version 76 is live at `https://karta-health.lera-wt.chatgpt.site`; the Sites deployment completed successfully. Unauthenticated app routes redirect to sign-in.
- Versions 72–74 align the home card hierarchy and the top insets on home, vaccination, medication, lab, and profile screens with the iOS source. Production builds passed before deployment.
- A synthetic profile was used for local phone-sized screenshots of home, vaccination passport/detail/recommendation detail, medication and lab empty states, and profile edit/reminder/city-history sheets. The lab empty-state action was corrected. Blank vaccination submit was exercised and now shows an inline error without closing the form. Direct paired iOS screenshots and remaining states are still pending.
- Registration and the three-step onboarding flow were completed with a temporary account in local Wrangler D1; profile and city-history values were verified, then that account was removed with the app's delete-data flow. The registration screen is now styled to follow the native composition.
- At 320×844, local onboarding showed the guest sign-in link, card, input, and primary action without overlap.
- Guest-to-email sign-in was exercised with a synthetic local profile; its pre-existing vaccination record remained visible afterward.
- All six Russian/English full, vaccination-only, and medication-only PDFs downloaded as A4, one-page files from the current local source. Their layout was visually reviewed; a large multi-page dataset remains unverified.
- A month/year record exports as `May 2025` in English and `Май 2025` in Russian, even when the stored note was originally Russian.
- Live unauthenticated `/onboarding` redirects to `/login` with the requested onboarding return path.

## Release criteria

- Every row above has phone-sized screenshots or direct interaction evidence against the corresponding iOS screen.
- Every control, modal, empty state, validation state, save, edit, delete, and navigation path has been exercised.
- PDF exports are rendered and compared to iOS for all three scopes and both languages.
- The reviewed commit is deployed and the live URL is checked after publication.
