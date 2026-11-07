// Thin client for https://jsonplaceholder.org/posts.
//
// In the browser, requests go to /api, which the Vite dev server proxies to
// jsonplaceholder.org (the API sends no CORS headers). Set VITE_API_BASE_URL
// to point somewhere else.
//
// Note: jsonplaceholder.org is a read-only mock. It accepts POST/PUT/PATCH/
// DELETE with a 200, but it saves nothing and returns the original data.
// The UI applies changes to its own state (see postsReducer.js).

export const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? '/api';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const options = { method, headers: { Accept: 'application/json' } };
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await globalThis.fetch(`${API_BASE_URL}${path}`, options);
  } catch (err) {
    throw new ApiError(`Network error: ${err.message}`, 0);
  }

  if (!response.ok) {
    throw new ApiError(`${method} ${path} failed with status ${response.status}`, response.status);
  }

  // Unknown ids get a 301 redirect to the HTML homepage instead of a 404.
  const contentType = response.headers?.get?.('content-type') ?? '';
  if (response.redirected || !contentType.includes('application/json')) {
    throw new ApiError(`${method} ${path}: resource not found`, 404);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export function getPosts() {
  return request('/posts');
}

export function getPost(id) {
  return request(`/posts/${encodeURIComponent(id)}`);
}

export function createPost(post) {
  return request('/posts', { method: 'POST', body: post });
}

export function updatePost(id, post) {
  return request(`/posts/${encodeURIComponent(id)}`, { method: 'PUT', body: post });
}

export function patchPost(id, changes) {
  return request(`/posts/${encodeURIComponent(id)}`, { method: 'PATCH', body: changes });
}

export function deletePost(id) {
  return request(`/posts/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export const postsApi = { getPosts, getPost, createPost, updatePost, patchPost, deletePost };
