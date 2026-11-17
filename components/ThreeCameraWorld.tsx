"use client";

import React from "react";
import { Nikon3DCamera } from "./Nikon3DCamera";

/**
 * ThreeCameraWorld component.
 * Replaced the legacy wireframe canvas with the photorealistic, backgroundless
 * Nikon DSLR camera with 3D perspective tracking and optical halo.
 */
export function ThreeCameraWorld() {
  return <Nikon3DCamera className="w-full h-full" showBadges={false} />;
}
