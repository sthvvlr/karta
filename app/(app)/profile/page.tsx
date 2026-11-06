import { cookies } from "next/headers";
import { ProfileScreen } from "@/app/ProfileScreen";
import { chatGPTSignOutPath, getChatGPTUser } from "@/app/chatgpt-auth";
import { getUserData } from "@/app/data";
import { getDb } from "@/db";
import { profileLocations } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const en = (await cookies()).get("karta_lang")?.value === "en";
  const user = await getChatGPTUser();
  if (!user) return <div style={{ padding: 24, color: "#1A2050" }}>{en ? "Sign in to Karta to open your profile." : "Войдите в Karta, чтобы открыть профиль."}</div>;
  const data = await getUserData({ userId: user.userId, email: user.email, displayName: user.displayName });
  const locations = await getDb().select().from(profileLocations).where(eq(profileLocations.userId, user.userId)).orderBy(asc(profileLocations.isCurrent), asc(profileLocations.fromYear));
  const profile = data.profile;
  return <ProfileScreen
    profile={{
      fullName: profile?.fullName || null,
      birthDate: profile?.birthDate || null,
      gender: profile?.gender || null,
      cityCurrent: profile?.cityCurrent || null,
      regionCurrent: profile?.regionCurrent || null,
      countryCurrent: profile?.countryCurrent || null,
      countryCode: profile?.countryCode || null,
      remindersEnabled: profile?.remindersEnabled ?? true,
      remindersMorning: profile?.remindersMorning || "08:00",
      remindersEvening: profile?.remindersEvening || "21:00",
    }}
    locations={locations.map(({ id, city, country, region, fromYear, toYear, isCurrent }) => ({ id, city, country, region, fromYear, toYear, isCurrent }))}
    displayName={user.displayName}
    email={user.email}
    userId={user.userId}
    chatSignOutUrl={chatGPTSignOutPath("/")}
    en={en}
  />;
}
