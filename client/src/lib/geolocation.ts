export interface Coordinates {
  lat: number;
  lon: number;
}

/**
 * Resolves the device's current position, or `null` if geolocation is
 * unsupported, denied, or times out. Never rejects -- callers should treat
 * `null` as "leave location empty" rather than an error to surface.
 */
export function requestCurrentPosition(timeoutMs = 8000): Promise<Coordinates | null> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lon: position.coords.longitude }),
      () => resolve(null),
      { timeout: timeoutMs }
    );
  });
}
