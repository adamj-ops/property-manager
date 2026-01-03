import { createAPIFileRoute } from '@tanstack/start/api'

import { geocodeAddress } from '~/server/places'

export const APIRoute = createAPIFileRoute('/api/places/geocode')({
  GET: async ({ request }) => {
    const url = new URL(request.url)
    const address = url.searchParams.get('address') ?? ''

    if (!address) {
      return new Response(JSON.stringify({ error: 'address is required' }), { status: 400 })
    }

    try {
      const result = await geocodeAddress(address)
      if (!result) {
        return new Response(JSON.stringify({ error: 'Address not found' }), { status: 404 })
      }
      return Response.json({ result })
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Geocode failed' }), { status: 500 })
    }
  },
})
