import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { OnboardingWizard } from "@/app/OnboardingWizard";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getUserData } from "@/app/data";
import { BlobBackground } from "@/components/BlobBackground";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getChatGPTUser();
  if (!user) redirect("/login?returnTo=%2Fonboarding");
  const data = await getUserData({ userId: user.userId, email: user.email, displayName: user.displayName });
  if (data.profile?.onboardingCompleted) redirect("/");
  return <div style={{ minHeight: "100dvh", position: "relative", overflow: "hidden", background: "#F4F6FF" }}><BlobBackground /><div style={{ position: "relative", zIndex: 1 }}><OnboardingWizard en={(await cookies()).get("karta_lang")?.value === "en"} guest={user.userId.startsWith("guest:")} initialName={data.profile?.fullName || user.displayName} initialBirthDate={data.profile?.birthDate} initialGender={data.profile?.gender} initialCity={data.profile?.cityCurrent} initialRegion={data.profile?.regionCurrent} initialCountry={data.profile?.countryCurrent} initialCountryCode={data.profile?.countryCode} /></div></div>;
}
