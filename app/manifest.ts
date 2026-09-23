import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Karta — карта здоровья",
    short_name: "Karta",
    description: "Прививки, лекарства и анализы в одном месте.",
    start_url: "/",
    display: "standalone",
    background_color: "#F4F6FF",
    theme_color: "#5C7CFA",
    lang: "ru",
    icons: [{ src: "/karta-icon.png", sizes: "1024x1024", type: "image/png", purpose: "any maskable" }],
  };
}
