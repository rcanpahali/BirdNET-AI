import { afterEach, describe, expect, it } from 'vitest';
import { requestCurrentPosition } from './geolocation';

describe('requestCurrentPosition', () => {
  afterEach(() => {
    // @ts-expect-error -- test-only cleanup of a property jsdom doesn't define by default
    delete navigator.geolocation;
  });

  it('resolves with coordinates when the device grants permission', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: (success: PositionCallback) => {
          success({
            coords: { latitude: 50.18, longitude: 8.74 },
          } as GeolocationPosition);
        },
      },
    });

    await expect(requestCurrentPosition()).resolves.toEqual({ lat: 50.18, lon: 8.74 });
  });

  it('resolves with null when permission is denied', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: (_success: PositionCallback, error: PositionErrorCallback) => {
          error({ code: 1, message: 'User denied Geolocation' } as GeolocationPositionError);
        },
      },
    });

    await expect(requestCurrentPosition()).resolves.toBeNull();
  });

  it('resolves with null when the browser has no geolocation support', async () => {
    // @ts-expect-error -- simulating an unsupported browser
    delete navigator.geolocation;

    await expect(requestCurrentPosition()).resolves.toBeNull();
  });
});
