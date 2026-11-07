// Pure state transitions for the posts screen. Because jsonplaceholder.org
// does not save writes, the local state is what the user sees after a
// create, update, or delete.

export const initialState = {
  posts: [],
  status: 'idle', // 'idle' | 'loading' | 'ready' | 'error'
  error: null,
};

export function nextId(posts) {
  return posts.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0) + 1;
}

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function postsReducer(state, action) {
  switch (action.type) {
    case 'load/start':
      return { ...state, status: 'loading', error: null };
    case 'load/success':
      return { ...state, status: 'ready', posts: action.posts, error: null };
    case 'load/failure':
      return { ...state, status: 'error', error: action.error };
    case 'post/created':
      return { ...state, posts: [action.post, ...state.posts], error: null };
    case 'post/updated':
      return {
        ...state,
        posts: state.posts.map((p) => (p.id === action.post.id ? { ...p, ...action.post } : p)),
        error: null,
      };
    case 'post/deleted':
      return { ...state, posts: state.posts.filter((p) => p.id !== action.id), error: null };
    case 'error':
      return { ...state, error: action.error };
    case 'error/dismiss':
      return { ...state, error: null };
    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}
