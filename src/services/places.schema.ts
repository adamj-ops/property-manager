import { z } from 'zod'

export const autocompletePredictionSchema = z.object({
  description: z.string(),
  placeId: z.string(),
  mainText: z.string(),
  secondaryText: z.string().optional(),
})

export type AutocompletePrediction = z.infer<typeof autocompletePredictionSchema>

export const placeDetailsSchema = z.object({
  placeId: z.string(),
  formattedAddress: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  addressComponents: z.array(
    z.object({
      longText: z.string(),
      shortText: z.string(),
      types: z.array(z.string()),
    }),
  ),
})

export type PlaceDetails = z.infer<typeof placeDetailsSchema>

export const geocodeResultSchema = z.object({
  formattedAddress: z.string(),
  latitude: z.number(),
  longitude: z.number(),
})

export type GeocodeResult = z.infer<typeof geocodeResultSchema>
