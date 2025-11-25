import { getLocalImageSource } from "./localImages";
import { API_URL } from "../api/client";

export function getRemoteImageUrl(image?: string | null) {
  if (!image) return null;
  if (image.startsWith("http")) return image;
  return `${API_URL}/images/${image}`;
}

// Return string URL for remote images (legacy helper)
export function getImageUrl(image?: string | null) {
  return getRemoteImageUrl(image);
}

export function resolveImageSource(image?: string | null) {
  const localSrc = getLocalImageSource(image);
  if (localSrc) return localSrc;

  const remoteUri = getRemoteImageUrl(image);
  return remoteUri ? { uri: remoteUri } : null;
}
