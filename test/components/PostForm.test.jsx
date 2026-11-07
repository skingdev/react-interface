import { expect } from 'chai';
import sinon from 'sinon';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PostForm, { validatePost } from '../../src/components/PostForm.jsx';
import { makePost } from '../helpers.js';

describe('<PostForm />', () => {
  it('shows validation errors and does not submit when required fields are empty', async () => {
    const onSubmit = sinon.spy();
    const user = userEvent.setup();
    render(<PostForm onSubmit={onSubmit} onCancel={() => {}} />);

    await user.click(screen.getByRole('button', { name: 'Create post' }));

    expect(screen.getByText('Title is required')).to.exist;
    expect(screen.getByText('Content is required')).to.exist;
    sinon.assert.notCalled(onSubmit);
  });

  it('submits trimmed values for a new post', async () => {
    const onSubmit = sinon.spy();
    const user = userEvent.setup();
    render(<PostForm onSubmit={onSubmit} onCancel={() => {}} />);

    await user.type(screen.getByLabelText('Title'), '  My title  ');
    await user.type(screen.getByLabelText('Content'), 'Body text');
    await user.type(screen.getByLabelText('Category'), 'news');
    await user.selectOptions(screen.getByLabelText('Status'), 'draft');
    await user.click(screen.getByRole('button', { name: 'Create post' }));

    sinon.assert.calledOnceWithExactly(onSubmit, {
      title: 'My title',
      content: 'Body text',
      category: 'news',
      status: 'draft',
    });
  });

  it('pre-fills fields when editing', () => {
    render(<PostForm initialValues={makePost({ id: 9, title: 'Existing' })} onSubmit={() => {}} onCancel={() => {}} />);

    expect(screen.getByRole('heading', { name: 'Edit post #9' })).to.exist;
    expect(screen.getByLabelText('Title').value).to.equal('Existing');
    expect(screen.getByRole('button', { name: 'Save changes' })).to.exist;
  });

  it('clears a field error once the user types in that field', async () => {
    const user = userEvent.setup();
    render(<PostForm onSubmit={() => {}} onCancel={() => {}} />);

    await user.click(screen.getByRole('button', { name: 'Create post' }));
    await user.type(screen.getByLabelText('Title'), 'x');

    expect(screen.queryByText('Title is required')).to.equal(null);
    expect(screen.getByText('Content is required')).to.exist;
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const onCancel = sinon.spy();
    const user = userEvent.setup();
    render(<PostForm onSubmit={() => {}} onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    sinon.assert.calledOnce(onCancel);
  });

  it('disables the buttons while submitting', () => {
    render(<PostForm onSubmit={() => {}} onCancel={() => {}} submitting />);

    expect(screen.getByRole('button', { name: 'Saving…' }).disabled).to.equal(true);
    expect(screen.getByRole('button', { name: 'Cancel' }).disabled).to.equal(true);
  });
});

describe('validatePost', () => {
  it('requires non-blank title and content', () => {
    expect(validatePost({ title: ' ', content: '' })).to.have.keys('title', 'content');
    expect(validatePost({ title: 'a', content: 'b' })).to.deep.equal({});
  });
});
