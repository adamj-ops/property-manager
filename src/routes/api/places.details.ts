import { createAPIFileRoute } from '@tanstack/start/api'

import { placeDetails } from '~/server/places'

export const APIRoute = createAPIFileRoute('/api/places/details')({
  GET: async ({ request }) => {
    const url = new URL(request.url)
    const placeId = url.searchParams.get('placeId') ?? ''

    if (!placeId) {
      return new Response(JSON.stringify({ error: 'placeId is required' }), { status: 400 })
    }

    try {
      const details = await placeDetails(placeId)
      if (!details) {
        return new Response(JSON.stringify({ error: 'Place not found' }), { status: 404 })
      }
      return Response.json({ details })
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Places details failed' }), { status: 500 })
    }
  },
})
