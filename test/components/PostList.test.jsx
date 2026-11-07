import { expect } from 'chai';
import sinon from 'sinon';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PostList from '../../src/components/PostList.jsx';
import { makePost } from '../helpers.js';

describe('<PostList />', () => {
  const posts = [makePost({ id: 1, title: 'First' }), makePost({ id: 2, title: 'Second', isLocal: true })];

  it('renders a message when there are no posts', () => {
    render(<PostList posts={[]} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByText('No posts found.')).to.exist;
  });

  it('renders one item per post', () => {
    render(<PostList posts={posts} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getAllByRole('listitem')).to.have.length(2);
    expect(screen.getByRole('heading', { name: 'First' })).to.exist;
  });

  it('marks local-only posts', () => {
    render(<PostList posts={posts} onEdit={() => {}} onDelete={() => {}} />);
    expect(within(screen.getByRole('listitem', { name: 'Second' })).getByText('local')).to.exist;
    expect(within(screen.getByRole('listitem', { name: 'First' })).queryByText('local')).to.equal(null);
  });

  it('calls onEdit and onDelete with the clicked post', async () => {
    const onEdit = sinon.spy();
    const onDelete = sinon.spy();
    const user = userEvent.setup();
    render(<PostList posts={posts} onEdit={onEdit} onDelete={onDelete} />);

    const second = screen.getByRole('listitem', { name: 'Second' });
    await user.click(within(second).getByRole('button', { name: 'Edit' }));
    await user.click(within(second).getByRole('button', { name: 'Delete' }));

    sinon.assert.calledOnceWithExactly(onEdit, posts[1]);
    sinon.assert.calledOnceWithExactly(onDelete, posts[1]);
  });

  it('disables the buttons of the busy post', () => {
    render(<PostList posts={posts} onEdit={() => {}} onDelete={() => {}} busyId={1} />);
    const first = screen.getByRole('listitem', { name: 'First' });
    expect(within(first).getByRole('button', { name: 'Deleting…' }).disabled).to.equal(true);
    expect(within(first).getByRole('button', { name: 'Edit' }).disabled).to.equal(true);
  });
});
