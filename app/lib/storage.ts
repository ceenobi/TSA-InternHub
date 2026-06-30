const isBrowser =
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export const safeGetItem = (key: string) => {
  if (!isBrowser) return null;
  try {
    return localStorage.getItem(key);
  } catch (error: any) {
    if (import.meta.env.DEV) {
      console.warn(
        `localStorage access denied for key "${key}":`,
        error.message,
      );
    }
    return null;
  }
};

export const safeSetItem = (key: string, value: string) => {
  if (!isBrowser) return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error: any) {
    if (import.meta.env.DEV) {
      console.warn(
        `localStorage access denied for key "${key}":`,
        error.message,
      );
    }
    return false;
  }
};

export const safeRemoveItem = (key: string) => {
  if (!isBrowser) return false;
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error: any) {
    if (import.meta.env.DEV) {
      console.warn(
        `localStorage access denied for key "${key}":`,
        error.message,
      );
    }
    return false;
  }
};