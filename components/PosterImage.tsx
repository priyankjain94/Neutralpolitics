import Image from "next/image";
import { posterDimensions } from "@/lib/image-size";

export function PosterImage({
  src,
  alt,
  priority = false,
  variant = "frame",
}: {
  src: string;
  alt: string;
  priority?: boolean;
  variant?: "frame" | "thumb";
}) {
  const { width, height } = posterDimensions(src);
  const thumb = variant === "thumb";
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      sizes={thumb ? "84px" : "(min-width: 960px) 640px, 100vw"}
      style={{
        width: thumb ? 84 : "100%",
        height: "auto",
        objectFit: "contain",
        background: "#fff",
      }}
    />
  );
}
