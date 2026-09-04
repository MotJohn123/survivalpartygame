import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Survival Party",
    short_name: "Survival Party",
    description: "Víkendová výprava pro přátele.",
    start_url: "/game",
    display: "standalone",
    background_color: "#173d2b",
    theme_color: "#173d2b",
    lang: "cs",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }, { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }],
  };
}
