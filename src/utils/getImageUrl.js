const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL;

export const getImageUrl = (src) => {
    if (!src || typeof src !== "string") return "";
    if (/^https?:\/\//i.test(src)) return src;

    const cleanPath = src.replace(/^\/+/, "");
    return `${IMAGE_BASE_URL}/${cleanPath}`;
};