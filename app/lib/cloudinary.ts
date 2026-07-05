const CLOUDINARY_REGEX = /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)/;

export function getOptimizedImageUrl(
  url: string | undefined | null,
  width: number,
  height?: number,
): string | undefined {
  if (!url) return undefined;

  const match = url.match(CLOUDINARY_REGEX);
  if (!match) return url;

  const base = match[1];
  const rest = url.slice(base.length);
  const h = height ?? width;
  const transform = `w_${width},h_${h},c_fill,q_auto,f_webp`;
  return `${base}${transform}/${rest}`;
}
