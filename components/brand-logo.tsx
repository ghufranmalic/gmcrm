"use client";

import Image from "next/image";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  size = 40
}: {
  className?: string;
  size?: number;
}) {
  return (
    <Image
      alt={`${brand.name} logo`}
      className={cn("object-contain", className)}
      height={size}
      priority
      src={brand.logo}
      width={size}
    />
  );
}
