// Builds a minimal object shaped like a fetch Response.
export function jsonResponse(body, { status = 200, redirected = false, contentType = 'application/json' } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    redirected,
    headers: { get: (name) => (name.toLowerCase() === 'content-type' ? contentType : null) },
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  };
}

export function makePost(overrides = {}) {
  const id = overrides.id ?? 1;
  return {
    id,
    slug: `post-${id}`,
    title: `Post title ${id}`,
    content: `Post content ${id}`,
    category: 'lorem',
    status: 'published',
    publishedAt: '04/02/2023 13:25:21',
    updatedAt: '14/03/2023 17:22:20',
    userId: 1,
    ...overrides,
  };
}
