import { createAPIFileRoute } from '@tanstack/start/api'

import { placesAutocomplete } from '~/server/places'

export const APIRoute = createAPIFileRoute('/api/places/autocomplete')({
  GET: async ({ request }) => {
    const url = new URL(request.url)
    const input = url.searchParams.get('input') ?? ''
    const sessionToken = url.searchParams.get('sessionToken') ?? undefined

    if (!input) {
      return new Response(JSON.stringify({ error: 'input is required' }), { status: 400 })
    }

    try {
      const predictions = await placesAutocomplete(input, sessionToken)
      return Response.json({ predictions })
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Places autocomplete failed' }), { status: 500 })
    }
  },
})
