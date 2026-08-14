import axios from 'axios';
import { config } from '../config';
import { logger } from '../logger';

interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
}

interface NominatimReverseResponse {
  address?: NominatimAddress;
}

/**
 * Best-effort reverse geocode -- a slow or failed lookup should never block
 * saving the analysis itself, so every failure mode resolves to `null`
 * rather than throwing.
 */
export async function reverseGeocodeCity(lat: number, lon: number): Promise<string | null> {
  try {
    const response = await axios.get<NominatimReverseResponse>(`${config.geocodingApiUrl}/reverse`, {
      params: { lat, lon, format: 'jsonv2' },
      timeout: config.geocodingTimeoutMs,
      // Nominatim's usage policy requires a valid identifying User-Agent.
      headers: { 'User-Agent': 'BirdNET-FieldStation/1.0' },
    });

    const address = response.data.address;
    return address?.city ?? address?.town ?? address?.village ?? address?.municipality ?? address?.county ?? null;
  } catch (error) {
    logger.warn({ error, lat, lon }, 'Reverse geocoding failed; continuing without a city name');
    return null;
  }
}
