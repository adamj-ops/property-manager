import { z } from 'zod'

import {
  autocompletePredictionSchema,
  geocodeResultSchema,
  placeDetailsSchema,
} from '~/services/places.schema'

const predictionsResponse = z.object({
  predictions: z.array(autocompletePredictionSchema),
})

const detailsResponse = z.object({
  details: placeDetailsSchema,
})

const geocodeResponse = z.object({
  result: geocodeResultSchema,
})

async function getJson<T>(url: string, schema: z.ZodSchema<T>): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Request failed: ${res.status} ${text}`)
  }
  const json = await res.json()
  return schema.parse(json)
}

export async function fetchPlacePredictions(input: string, sessionToken?: string) {
  const params = new URLSearchParams({ input })
  if (sessionToken) params.set('sessionToken', sessionToken)
  const url = `/api/places/autocomplete?${params.toString()}`
  const data = await getJson(url, predictionsResponse)
  return data.predictions
}

export async function fetchPlaceDetails(placeId: string) {
  const params = new URLSearchParams({ placeId })
  const url = `/api/places/details?${params.toString()}`
  const data = await getJson(url, detailsResponse)
  return data.details
}

export async function fetchGeocode(address: string) {
  const params = new URLSearchParams({ address })
  const url = `/api/places/geocode?${params.toString()}`
  const data = await getJson(url, geocodeResponse)
  return data.result
}
