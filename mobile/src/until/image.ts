// mobile/src/until/image.ts
import { getLocalImageSource } from "./localImages";

export const API_URL = "https://hangry-backend.onrender.com";

// Trả về URI string (cho remote) hoặc null (nếu không có)
export function getRemoteImageUrl(image?: string | null) {
  if (!image) return null;
  if (image.startsWith("http")) return image;
  return `${API_URL}/images/${image}`;
}

// Trả về source cho <Image />:
// - Nếu có local asset: trả require(...)
// - Nếu không: trả { uri: remoteUrl } hoặc null
export function resolveImageSource(image?: string | null) {
  const localSrc = getLocalImageSource(image);
  if (localSrc) return localSrc;

  const remoteUri = getRemoteImageUrl(image);
  return remoteUri ? { uri: remoteUri } : null;
}
