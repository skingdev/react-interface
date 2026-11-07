import { expect } from 'chai';
import sinon from 'sinon';
import {
  API_BASE_URL,
  ApiError,
  createPost,
  deletePost,
  getPost,
  getPosts,
  patchPost,
  updatePost,
} from '../../src/api/postsApi.js';
import { jsonResponse, makePost } from '../helpers.js';

describe('postsApi', () => {
  let fetchStub;

  beforeEach(() => {
    fetchStub = sinon.stub(globalThis, 'fetch');
  });

  it('uses /api as the default base URL (proxied by Vite)', () => {
    expect(API_BASE_URL).to.equal('/api');
  });

  describe('getPosts', () => {
    it('GETs /posts and returns the parsed list', async () => {
      const posts = [makePost({ id: 1 }), makePost({ id: 2 })];
      fetchStub.resolves(jsonResponse(posts));

      const result = await getPosts();

      expect(result).to.deep.equal(posts);
      sinon.assert.calledOnce(fetchStub);
      const [url, options] = fetchStub.firstCall.args;
      expect(url).to.equal('/api/posts');
      expect(options.method).to.equal('GET');
      expect(options).to.not.have.property('body');
    });
  });

  describe('getPost', () => {
    it('GETs a single post by id', async () => {
      fetchStub.resolves(jsonResponse(makePost({ id: 7 })));

      const result = await getPost(7);

      expect(result.id).to.equal(7);
      sinon.assert.calledWith(fetchStub, '/api/posts/7', sinon.match({ method: 'GET' }));
    });

    it('encodes the id in the URL', async () => {
      fetchStub.resolves(jsonResponse({}));
      await getPost('a/b');
      expect(fetchStub.firstCall.args[0]).to.equal('/api/posts/a%2Fb');
    });
  });

  describe('createPost', () => {
    it('POSTs a JSON body to /posts', async () => {
      const input = { title: 'Hello', content: 'World' };
      fetchStub.resolves(jsonResponse({ id: 101, ...input }));

      const result = await createPost(input);

      expect(result).to.include({ id: 101, title: 'Hello' });
      const [url, options] = fetchStub.firstCall.args;
      expect(url).to.equal('/api/posts');
      expect(options.method).to.equal('POST');
      expect(options.headers['Content-Type']).to.equal('application/json');
      expect(JSON.parse(options.body)).to.deep.equal(input);
    });
  });

  describe('updatePost', () => {
    it('PUTs the post to /posts/:id', async () => {
      const post = makePost({ id: 3, title: 'Changed' });
      fetchStub.resolves(jsonResponse(post));

      await updatePost(3, post);

      const [url, options] = fetchStub.firstCall.args;
      expect(url).to.equal('/api/posts/3');
      expect(options.method).to.equal('PUT');
      expect(JSON.parse(options.body)).to.deep.equal(post);
    });
  });

  describe('patchPost', () => {
    it('PATCHes only the changed fields', async () => {
      fetchStub.resolves(jsonResponse(makePost({ id: 4 })));

      await patchPost(4, { title: 'Only title' });

      const [url, options] = fetchStub.firstCall.args;
      expect(url).to.equal('/api/posts/4');
      expect(options.method).to.equal('PATCH');
      expect(JSON.parse(options.body)).to.deep.equal({ title: 'Only title' });
    });
  });

  describe('deletePost', () => {
    it('sends DELETE to /posts/:id', async () => {
      fetchStub.resolves(jsonResponse(makePost({ id: 5 })));

      await deletePost(5);

      sinon.assert.calledWith(fetchStub, '/api/posts/5', sinon.match({ method: 'DELETE' }));
    });

    it('returns null when the response body is empty', async () => {
      fetchStub.resolves(jsonResponse(''));
      expect(await deletePost(5)).to.equal(null);
    });
  });

  describe('error handling', () => {
    it('throws ApiError with the status for non-2xx responses', async () => {
      fetchStub.resolves(jsonResponse({}, { status: 500 }));

      const err = await getPosts().catch((e) => e);

      expect(err).to.be.instanceOf(ApiError);
      expect(err.status).to.equal(500);
      expect(err.message).to.match(/GET \/posts failed with status 500/);
    });

    it('throws ApiError with status 0 when the network fails', async () => {
      fetchStub.rejects(new TypeError('Failed to fetch'));

      const err = await getPosts().catch((e) => e);

      expect(err).to.be.instanceOf(ApiError);
      expect(err.status).to.equal(0);
      expect(err.message).to.include('Failed to fetch');
    });

    it('treats a redirect to the HTML homepage as not found', async () => {
      // jsonplaceholder.org answers unknown ids with a 301 to "/".
      fetchStub.resolves(
        jsonResponse('<!doctype html>', { redirected: true, contentType: 'text/html; charset=utf-8' }),
      );

      const err = await updatePost(999, {}).catch((e) => e);

      expect(err).to.be.instanceOf(ApiError);
      expect(err.status).to.equal(404);
      expect(err.message).to.include('not found');
    });
  });
});
