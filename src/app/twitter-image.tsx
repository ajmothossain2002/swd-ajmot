import { ImageResponse } from "next/og";
import { SocialPreview } from "@/components/seo/social-preview";

export const alt = "Ajmot Hossain, Full-Stack Developer building business-critical web applications";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(<SocialPreview />, size);
}
