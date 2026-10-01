type AppleClaims = {
  iss?: string;
  aud?: string | string[];
  exp?: number;
  sub?: string;
  email?: string;
};

function decodePart(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(normalized);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function decodeJson<T>(value: string): T {
  return JSON.parse(new TextDecoder().decode(decodePart(value))) as T;
}

export async function verifyAppleIdentityToken(identityToken: string): Promise<Required<Pick<AppleClaims, "sub">> & AppleClaims> {
  const parts = identityToken.split(".");
  if (parts.length !== 3) throw new Error("Invalid Apple identity token");
  const header = decodeJson<{ alg?: string; kid?: string }>(parts[0]);
  const claims = decodeJson<AppleClaims>(parts[1]);
  if (header.alg !== "ES256" || !header.kid || !claims.sub) throw new Error("Invalid Apple identity token");
  if (claims.iss !== "https://appleid.apple.com") throw new Error("Invalid Apple identity token issuer");
  const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!audience.includes("com.astakhova.karta")) throw new Error("Invalid Apple identity token audience");
  if (!claims.exp || claims.exp <= Math.floor(Date.now() / 1000)) throw new Error("Apple identity token expired");

  const keysResponse = await fetch("https://appleid.apple.com/auth/keys", { cf: { cacheTtl: 3600, cacheEverything: true } });
  if (!keysResponse.ok) throw new Error("Apple keys unavailable");
  const keys = await keysResponse.json() as { keys?: Array<JsonWebKey & { kid?: string }> };
  const jwk = keys.keys?.find((key) => key.kid === header.kid);
  if (!jwk) throw new Error("Apple signing key not found");
  const publicKey = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
  const valid = await crypto.subtle.verify(
    { name: "ECDSA", hash: "SHA-256" },
    publicKey,
    decodePart(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  );
  if (!valid) throw new Error("Invalid Apple identity token signature");
  return claims as Required<Pick<AppleClaims, "sub">> & AppleClaims;
}

