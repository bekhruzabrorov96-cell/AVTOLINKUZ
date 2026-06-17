import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Avtolink.uz",
    short_name: "Avtolink",
    description: "Uzbekistonda avtomobil sotish va xarid qilish platformasi",
    start_url: "/",
    display: "standalone",
    background_color: "#F5F6F7",
    theme_color: "#0B7A75",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  };
}
