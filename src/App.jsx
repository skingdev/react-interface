import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { postsApi } from './api/postsApi.js';
import { initialState, nextId, postsReducer, slugify } from './state/postsReducer.js';
import { formatDate } from './utils/formatDate.js';
import PostForm from './components/PostForm.jsx';
import PostList from './components/PostList.jsx';

// `api` and `confirm` can be swapped out, so tests can pass Sinon stubs.
export default function App({ api = postsApi, confirm = (msg) => window.confirm(msg) }) {
  const [state, dispatch] = useReducer(postsReducer, initialState);
  const [editing, setEditing] = useState(null); // null = form closed, {} = new, post = edit
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    dispatch({ type: 'load/start' });
    try {
      const posts = await api.getPosts();
      dispatch({ type: 'load/success', posts });
    } catch (err) {
      dispatch({ type: 'load/failure', error: err.message });
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const visiblePosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return state.posts;
    return state.posts.filter(
      (p) => p.title?.toLowerCase().includes(q) || p.content?.toLowerCase().includes(q),
    );
  }, [state.posts, query]);

  async function handleSave(values) {
    setSaving(true);
    try {
      const now = formatDate();
      if (editing?.id) {
        const updated = { ...editing, ...values, updatedAt: now };
        // Posts created in this session do not exist on the server.
        if (!editing.isLocal) await api.updatePost(editing.id, updated);
        dispatch({ type: 'post/updated', post: updated });
      } else {
        await api.createPost(values);
        // The mock API does not return the new record, so build it here.
        const post = {
          ...values,
          id: nextId(state.posts),
          slug: slugify(values.title),
          userId: 1,
          publishedAt: now,
          updatedAt: now,
          isLocal: true,
        };
        dispatch({ type: 'post/created', post });
      }
      setEditing(null);
    } catch (err) {
      dispatch({ type: 'error', error: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(post) {
    if (!confirm(`Delete post #${post.id} "${post.title}"?`)) return;
    setBusyId(post.id);
    try {
      if (!post.isLocal) await api.deletePost(post.id);
      dispatch({ type: 'post/deleted', id: post.id });
      if (editing?.id === post.id) setEditing(null);
    } catch (err) {
      dispatch({ type: 'error', error: err.message });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Posts Manager</h1>
        <p className="subtitle">
          CRUD client for <a href="https://jsonplaceholder.org/">jsonplaceholder.org</a>. The API is a mock, so
          changes last only until you reload the page.
        </p>
      </header>

      {state.error && (
        <div className="banner error" role="alert">
          <span>{state.error}</span>
          <button type="button" onClick={() => dispatch({ type: 'error/dismiss' })} aria-label="Dismiss error">
            ×
          </button>
        </div>
      )}

      <div className="toolbar">
        <input
          type="search"
          placeholder="Search posts…"
          aria-label="Search posts"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="button" onClick={load} disabled={state.status === 'loading'}>
          Reload
        </button>
        <button type="button" className="primary" onClick={() => setEditing({})} disabled={editing !== null}>
          New post
        </button>
      </div>

      {editing !== null && (
        <PostForm
          key={editing.id ?? 'new'}
          initialValues={editing}
          onSubmit={handleSave}
          onCancel={() => setEditing(null)}
          submitting={saving}
        />
      )}

      {state.status === 'loading' && <p className="status">Loading posts…</p>}
      {state.status === 'ready' && (
        <>
          <p className="status">
            Showing {visiblePosts.length} of {state.posts.length} posts
          </p>
          <PostList posts={visiblePosts} onEdit={setEditing} onDelete={handleDelete} busyId={busyId} />
        </>
      )}
    </div>
  );
}
