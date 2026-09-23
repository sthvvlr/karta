import { NextResponse } from "next/server";
import localCities from "../../cities_directory.json";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() || "";
  if (query.length < 2) return NextResponse.json({ cities: [] });

  const normalizedQuery = query.toLocaleLowerCase("ru");
  const localMatches = localCities
    .filter((item) => [item.city, item.region, item.country].some((value) => value.toLocaleLowerCase("ru").includes(normalizedQuery)))
    .slice(0, 8)
    .map((item, index) => ({ ...item, id: `local-${index}-${item.city}`, label: [item.city, item.region, item.country].filter(Boolean).join(", ") }));

  const upstream = new URL("https://nominatim.openstreetmap.org/search");
  upstream.searchParams.set("q", query);
  upstream.searchParams.set("format", "jsonv2");
  upstream.searchParams.set("addressdetails", "1");
  upstream.searchParams.set("namedetails", "1");
  upstream.searchParams.set("featuretype", "city");
  upstream.searchParams.set("limit", "8");
  upstream.searchParams.set("accept-language", "ru,en");

  try {
    const response = await fetch(upstream, {
      headers: { "User-Agent": "Karta-health-site/1.0 (city directory)" },
      cf: { cacheTtl: 3600, cacheEverything: true },
    });
    if (!response.ok) return NextResponse.json({ cities: localMatches }, { status: 200 });
    const raw = await response.json() as Array<{ place_id: number; display_name: string; address?: Record<string, string> }>;
    const cities = raw.map((item) => {
      const address = item.address || {};
      const city = address.city || address.town || address.municipality || address.village || item.display_name.split(",")[0];
      const region = address.state || address.region || address.province || "";
      const country = address.country || "";
      const countryCode = address.country_code?.toUpperCase() || "";
      return { id: String(item.place_id), city, region, country, countryCode, label: [city, region, country].filter(Boolean).join(", ") };
    });
    const merged = [...localMatches, ...cities.filter((city) => !localMatches.some((item) => item.city === city.city && item.countryCode === city.countryCode))].slice(0, 8);
    return NextResponse.json({ cities: merged }, { headers: { "Cache-Control": "public, max-age=300" } });
  } catch {
    return NextResponse.json({ cities: localMatches }, { status: 200 });
  }
}
