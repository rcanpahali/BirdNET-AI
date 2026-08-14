export interface Coordinates {
  lat: number;
  lon: number;
}

// Bad Vilbel, near Frankfurt am Main -- used only in dev builds (see below).
const DEV_LOCATION_CENTER: Coordinates = { lat: 50.1833, lon: 8.7458 };
const DEV_LOCATION_JITTER_DEGREES = 0.08; // ~a Frankfurt-to-Bad-Vilbel-sized spread

function jitteredDevLocation(): Coordinates {
  return {
    lat: DEV_LOCATION_CENTER.lat + (Math.random() - 0.5) * 2 * DEV_LOCATION_JITTER_DEGREES,
    lon: DEV_LOCATION_CENTER.lon + (Math.random() - 0.5) * 2 * DEV_LOCATION_JITTER_DEGREES,
  };
}

/**
 * Resolves the device's current position, or `null` if geolocation is
 * unsupported, denied, or times out. Never rejects -- callers should treat
 * `null` as "leave location empty" rather than an error to surface.
 *
 * When `VITE_USE_MOCK_LOCATION=true` (set in `.env.development`, never in
 * test/production) this returns a randomized point near Bad Vilbel/Frankfurt
 * instead of the real device position -- testing from one fixed location
 * would otherwise pin every recording to the same spot, making the map
 * page useless to look at during local development.
 */
export function requestCurrentPosition(timeoutMs = 8000): Promise<Coordinates | null> {
  if (import.meta.env.VITE_USE_MOCK_LOCATION === 'true') {
    return Promise.resolve(jitteredDevLocation());
  }

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
