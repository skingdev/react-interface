import { expect } from 'chai';
import sinon from 'sinon';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App.jsx';
import { makePost } from './helpers.js';

function makeApi(posts = [makePost({ id: 1, title: 'Alpha' }), makePost({ id: 2, title: 'Beta' })]) {
  return {
    getPosts: sinon.stub().resolves(posts),
    getPost: sinon.stub().resolves(posts[0]),
    createPost: sinon.stub().resolves(posts),
    updatePost: sinon.stub().callsFake(async (_id, post) => post),
    patchPost: sinon.stub().resolves({}),
    deletePost: sinon.stub().resolves({}),
  };
}

async function renderApp(api = makeApi(), confirm = sinon.stub().returns(true)) {
  const user = userEvent.setup();
  render(<App api={api} confirm={confirm} />);
  await screen.findByRole('list', { name: 'Posts' });
  return { api, confirm, user };
}

const titles = () => screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);

describe('<App />', () => {
  describe('read', () => {
    it('shows a loading message, then the posts', async () => {
      const api = makeApi();
      render(<App api={api} />);

      expect(screen.getByText('Loading posts…')).to.exist;
      await screen.findByRole('list', { name: 'Posts' });
      expect(titles()).to.deep.equal(['Alpha', 'Beta']);
      expect(screen.getByText('Showing 2 of 2 posts')).to.exist;
      sinon.assert.calledOnce(api.getPosts);
    });

    it('shows an error when loading fails', async () => {
      const api = makeApi();
      api.getPosts.rejects(new Error('Network error: offline'));
      render(<App api={api} />);

      expect((await screen.findByRole('alert')).textContent).to.include('Network error: offline');
    });

    it('fetches again when Reload is clicked', async () => {
      const { api, user } = await renderApp();
      await user.click(screen.getByRole('button', { name: 'Reload' }));
      await waitFor(() => sinon.assert.calledTwice(api.getPosts));
    });

    it('filters posts by the search query', async () => {
      const { user } = await renderApp();
      await user.type(screen.getByRole('searchbox', { name: 'Search posts' }), 'bet');
      expect(titles()).to.deep.equal(['Beta']);
      expect(screen.getByText('Showing 1 of 2 posts')).to.exist;
    });
  });

  describe('create', () => {
    it('POSTs the new post and adds it to the top of the list', async () => {
      const { api, user } = await renderApp();

      await user.click(screen.getByRole('button', { name: 'New post' }));
      await user.type(screen.getByLabelText('Title'), 'Gamma');
      await user.type(screen.getByLabelText('Content'), 'Third post');
      await user.click(screen.getByRole('button', { name: 'Create post' }));

      await waitFor(() => expect(titles()).to.deep.equal(['Gamma', 'Alpha', 'Beta']));
      sinon.assert.calledOnceWithExactly(api.createPost, {
        title: 'Gamma',
        content: 'Third post',
        category: '',
        status: 'published',
      });
      const card = screen.getByRole('listitem', { name: 'Gamma' });
      expect(within(card).getByText('#3')).to.exist;
      expect(within(card).getByText('local')).to.exist;
      expect(screen.queryByRole('form', { name: 'New post' })).to.equal(null);
    });

    it('keeps the form open and shows the error when the request fails', async () => {
      const api = makeApi();
      api.createPost.rejects(new Error('POST /posts failed with status 500'));
      const { user } = await renderApp(api);

      await user.click(screen.getByRole('button', { name: 'New post' }));
      await user.type(screen.getByLabelText('Title'), 'Gamma');
      await user.type(screen.getByLabelText('Content'), 'Body');
      await user.click(screen.getByRole('button', { name: 'Create post' }));

      expect((await screen.findByRole('alert')).textContent).to.include('status 500');
      expect(screen.getByRole('form', { name: 'New post' })).to.exist;
      expect(titles()).to.deep.equal(['Alpha', 'Beta']);
    });
  });

  describe('update', () => {
    it('PUTs the edited post and updates it in the list', async () => {
      const { api, user } = await renderApp();

      const alpha = screen.getByRole('listitem', { name: 'Alpha' });
      await user.click(within(alpha).getByRole('button', { name: 'Edit' }));
      const title = screen.getByLabelText('Title');
      await user.clear(title);
      await user.type(title, 'Alpha v2');
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      await waitFor(() => expect(titles()).to.deep.equal(['Alpha v2', 'Beta']));
      sinon.assert.calledOnce(api.updatePost);
      const [id, body] = api.updatePost.firstCall.args;
      expect(id).to.equal(1);
      expect(body).to.include({ id: 1, title: 'Alpha v2', content: 'Post content 1' });
    });

    it('does not call the API when editing a post that only exists locally', async () => {
      const { api, user } = await renderApp(makeApi([makePost({ id: 101, title: 'Local', isLocal: true })]));

      await user.click(screen.getByRole('button', { name: 'Edit' }));
      await user.type(screen.getByLabelText('Title'), '!');
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      await waitFor(() => expect(titles()).to.deep.equal(['Local!']));
      sinon.assert.notCalled(api.updatePost);
    });
  });

  describe('delete', () => {
    it('asks for confirmation, sends DELETE, and removes the post', async () => {
      const { api, confirm, user } = await renderApp();

      const beta = screen.getByRole('listitem', { name: 'Beta' });
      await user.click(within(beta).getByRole('button', { name: 'Delete' }));

      await waitFor(() => expect(titles()).to.deep.equal(['Alpha']));
      sinon.assert.calledOnceWithMatch(confirm, sinon.match('Delete post #2'));
      sinon.assert.calledOnceWithExactly(api.deletePost, 2);
    });

    it('does nothing when the user cancels the confirmation', async () => {
      const { api, user } = await renderApp(makeApi(), sinon.stub().returns(false));

      await user.click(within(screen.getByRole('listitem', { name: 'Beta' })).getByRole('button', { name: 'Delete' }));

      sinon.assert.notCalled(api.deletePost);
      expect(titles()).to.deep.equal(['Alpha', 'Beta']);
    });

    it('keeps the post and shows an error when DELETE fails', async () => {
      const api = makeApi();
      api.deletePost.rejects(new Error('DELETE /posts/2 failed with status 503'));
      const { user } = await renderApp(api);

      await user.click(within(screen.getByRole('listitem', { name: 'Beta' })).getByRole('button', { name: 'Delete' }));

      expect((await screen.findByRole('alert')).textContent).to.include('status 503');
      expect(titles()).to.deep.equal(['Alpha', 'Beta']);
    });

    it('dismisses the error banner', async () => {
      const api = makeApi();
      api.deletePost.rejects(new Error('fail'));
      const { user } = await renderApp(api);

      await user.click(within(screen.getByRole('listitem', { name: 'Beta' })).getByRole('button', { name: 'Delete' }));
      await screen.findByRole('alert');
      await user.click(screen.getByRole('button', { name: 'Dismiss error' }));

      expect(screen.queryByRole('alert')).to.equal(null);
    });
  });
});
