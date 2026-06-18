import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Avtolink.uz",
    short_name: "Avtolink",
    description: "Uzbekistonda EV va REEV mashinalarni AI yordamida topish platformasi",
    start_url: "/",
    display: "standalone",
    background_color: "#F5F6F7",
    theme_color: "#08746F",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  };
}
