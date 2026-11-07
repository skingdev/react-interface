import { expect } from 'chai';
import { initialState, nextId, postsReducer, slugify } from '../../src/state/postsReducer.js';
import { makePost } from '../helpers.js';

describe('postsReducer', () => {
  const loaded = { ...initialState, status: 'ready', posts: [makePost({ id: 1 }), makePost({ id: 2 })] };

  it('sets loading on load/start and clears errors', () => {
    const state = postsReducer({ ...initialState, error: 'old' }, { type: 'load/start' });
    expect(state.status).to.equal('loading');
    expect(state.error).to.equal(null);
  });

  it('stores posts on load/success', () => {
    const posts = [makePost()];
    const state = postsReducer(initialState, { type: 'load/success', posts });
    expect(state).to.deep.equal({ posts, status: 'ready', error: null });
  });

  it('stores the error on load/failure', () => {
    const state = postsReducer(initialState, { type: 'load/failure', error: 'boom' });
    expect(state.status).to.equal('error');
    expect(state.error).to.equal('boom');
  });

  it('adds a new post to the front on post/created', () => {
    const post = makePost({ id: 3 });
    const state = postsReducer(loaded, { type: 'post/created', post });
    expect(state.posts.map((p) => p.id)).to.deep.equal([3, 1, 2]);
  });

  it('merges changes into the matching post on post/updated', () => {
    const state = postsReducer(loaded, { type: 'post/updated', post: { id: 2, title: 'New title' } });
    expect(state.posts[1]).to.include({ id: 2, title: 'New title', content: 'Post content 2' });
    expect(state.posts[0]).to.equal(loaded.posts[0]);
  });

  it('removes the post on post/deleted', () => {
    const state = postsReducer(loaded, { type: 'post/deleted', id: 1 });
    expect(state.posts.map((p) => p.id)).to.deep.equal([2]);
  });

  it('does not mutate the previous state', () => {
    const before = structuredClone(loaded);
    postsReducer(loaded, { type: 'post/deleted', id: 1 });
    postsReducer(loaded, { type: 'post/updated', post: { id: 1, title: 'x' } });
    expect(loaded).to.deep.equal(before);
  });

  it('sets and dismisses an error', () => {
    const withError = postsReducer(loaded, { type: 'error', error: 'nope' });
    expect(withError.error).to.equal('nope');
    expect(withError.posts).to.equal(loaded.posts);
    expect(postsReducer(withError, { type: 'error/dismiss' }).error).to.equal(null);
  });

  it('throws on an unknown action', () => {
    expect(() => postsReducer(initialState, { type: 'nope' })).to.throw('Unknown action type: nope');
  });
});

describe('nextId', () => {
  it('returns one more than the highest id', () => {
    expect(nextId([{ id: 4 }, { id: 100 }, { id: 7 }])).to.equal(101);
  });

  it('returns 1 for an empty list', () => {
    expect(nextId([])).to.equal(1);
  });
});

describe('slugify', () => {
  it('lowercases and hyphenates text', () => {
    expect(slugify('  Hello, World! 2026 ')).to.equal('hello-world-2026');
  });
});
