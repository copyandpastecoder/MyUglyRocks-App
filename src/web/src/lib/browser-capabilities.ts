export interface BrowserCapabilities {
  screenWidth: number;
  screenHeight: number;
  supportsWebP: boolean;
  supportsAvif: boolean;
  timezone: string;
  language: string;
  referrerDomain: string | null;
}

let cachedCapabilities: BrowserCapabilities | null = null;

export async function detectBrowserCapabilities(): Promise<BrowserCapabilities> {
  // Return cached result if available
  if (cachedCapabilities) {
    return cachedCapabilities;
  }

  const [supportsWebP, supportsAvif] = await Promise.all([
    checkWebPSupport(),
    checkAvifSupport(),
  ]);

  cachedCapabilities = {
    screenWidth: typeof window !== 'undefined' ? window.screen.width : 0,
    screenHeight: typeof window !== 'undefined' ? window.screen.height : 0,
    supportsWebP,
    supportsAvif,
    timezone: getTimezone(),
    language: typeof navigator !== 'undefined' ? navigator.language : 'en-US',
    referrerDomain: getReferrerDomain(),
  };

  return cachedCapabilities;
}

function getTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

function getReferrerDomain(): string | null {
  if (typeof document === 'undefined' || !document.referrer) {
    return null;
  }

  try {
    const url = new URL(document.referrer);
    return url.hostname;
  } catch {
    return null;
  }
}

async function checkWebPSupport(): Promise<boolean> {
  if (typeof document === 'undefined') {
    return false;
  }

  try {
    const canvas = document.createElement('canvas');
    if (canvas.getContext && canvas.getContext('2d')) {
      return canvas.toDataURL('image/webp').startsWith('data:image/webp');
    }
  } catch {
    // Fall through to return false
  }
  return false;
}

async function checkAvifSupport(): Promise<boolean> {
  if (typeof document === 'undefined') {
    return false;
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(false), 1000); // 1 second timeout

    const img = new Image();
    img.onload = () => {
      clearTimeout(timeout);
      resolve(true);
    };
    img.onerror = () => {
      clearTimeout(timeout);
      resolve(false);
    };
    // 1x1 AVIF image (base64)
    img.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKBzgABc0WkCLfkf8A';
  });
}

// Clear cache (useful for testing or when user logs out)
export function clearCapabilitiesCache(): void {
  cachedCapabilities = null;
}
