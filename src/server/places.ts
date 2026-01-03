import { logger } from '~/libs/logger'

const PLACES_BASE = 'https://maps.googleapis.com/maps/api/place'
const GEOCODE_BASE = 'https://maps.googleapis.com/maps/api/geocode'

interface AutocompletePrediction {
  description: string
  placeId: string
  mainText: string
  secondaryText?: string
}

interface PlaceDetails {
  placeId: string
  formattedAddress: string
  latitude: number
  longitude: number
  addressComponents: {
    longText: string
    shortText: string
    types: string[]
  }[]
}

interface GeocodeResult {
  formattedAddress: string
  latitude: number
  longitude: number
}

function getApiKey() {
  const key = process.env.GOOGLE_PLACES_API_KEY

  if (!key) {
    throw new Error('GOOGLE_PLACES_API_KEY is not set')
  }

  return key
}

async function fetchJson<T>(url: string) {
  const response = await fetch(url)
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Places API error (${response.status}): ${text}`)
  }
  return response.json() as Promise<T>
}

async function placesAutocomplete(input: string, sessionToken?: string): Promise<AutocompletePrediction[]> {
  const key = getApiKey()
  const params = new URLSearchParams({
    input,
    key,
    sessiontoken: sessionToken ?? crypto.randomUUID(),
    types: 'address',
  })

  const url = `${PLACES_BASE}/autocomplete/json?${params.toString()}`

  const data = await fetchJson<{
    status: string
    predictions: Array<{
      description: string
      place_id: string
      structured_formatting: { main_text: string; secondary_text?: string }
    }>
    error_message?: string
  }>(url)

  if (data.status !== 'OK') {
    logger.warn('Places autocomplete returned non-OK status', { status: data.status, error: data.error_message })
    return []
  }

  return data.predictions.map((prediction) => ({
    description: prediction.description,
    placeId: prediction.place_id,
    mainText: prediction.structured_formatting.main_text,
    secondaryText: prediction.structured_formatting.secondary_text,
  }))
}

async function placeDetails(placeId: string): Promise<PlaceDetails | null> {
  const key = getApiKey()
  const params = new URLSearchParams({
    placeid: placeId,
    key,
    fields: 'formatted_address,geometry,address_component,place_id',
  })

  const url = `${PLACES_BASE}/details/json?${params.toString()}`

  const data = await fetchJson<{
    status: string
    result?: {
      place_id: string
      formatted_address: string
      geometry?: { location: { lat: number; lng: number } }
      address_components?: Array<{ long_name: string; short_name: string; types: string[] }>
    }
    error_message?: string
  }>(url)

  if (data.status !== 'OK' || !data.result || !data.result.geometry) {
    logger.warn('Places details returned non-OK status', { status: data.status, error: data.error_message })
    return null
  }

  const { result } = data
  return {
    placeId: result.place_id,
    formattedAddress: result.formatted_address,
    latitude: result.geometry.location.lat,
    longitude: result.geometry.location.lng,
    addressComponents:
      result.address_components?.map((component) => ({
        longText: component.long_name,
        shortText: component.short_name,
        types: component.types,
      })) ?? [],
  }
}

async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const key = getApiKey()
  const params = new URLSearchParams({
    address,
    key,
  })

  const url = `${GEOCODE_BASE}/json?${params.toString()}`

  const data = await fetchJson<{
    status: string
    results: Array<{
      formatted_address: string
      geometry: { location: { lat: number; lng: number } }
    }>
    error_message?: string
  }>(url)

  if (data.status !== 'OK' || !data.results.length) {
    logger.warn('Geocode returned non-OK status', { status: data.status, error: data.error_message })
    return null
  }

  const first = data.results[0]
  return {
    formattedAddress: first.formatted_address,
    latitude: first.geometry.location.lat,
    longitude: first.geometry.location.lng,
  }
}

export { geocodeAddress, placeDetails, placesAutocomplete }
export type { AutocompletePrediction, GeocodeResult, PlaceDetails }
