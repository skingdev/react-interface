import { useState } from 'react';

const EMPTY = { title: '', content: '', category: '', status: 'published' };

export function validatePost(values) {
  const errors = {};
  if (!values.title.trim()) errors.title = 'Title is required';
  if (!values.content.trim()) errors.content = 'Content is required';
  return errors;
}

export default function PostForm({ initialValues, onSubmit, onCancel, submitting = false }) {
  const [values, setValues] = useState(() => ({ ...EMPTY, ...pick(initialValues) }));
  const [errors, setErrors] = useState({});
  const isEdit = Boolean(initialValues?.id);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const found = validatePost(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    onSubmit({
      title: values.title.trim(),
      content: values.content.trim(),
      category: values.category.trim(),
      status: values.status,
    });
  }

  return (
    <form className="post-form" onSubmit={handleSubmit} aria-label={isEdit ? 'Edit post' : 'New post'} noValidate>
      <h2>{isEdit ? `Edit post #${initialValues.id}` : 'New post'}</h2>

      <label htmlFor="post-title">Title</label>
      <input
        id="post-title"
        name="title"
        value={values.title}
        onChange={handleChange}
        aria-invalid={Boolean(errors.title)}
      />
      {errors.title && <p className="field-error" role="alert">{errors.title}</p>}

      <label htmlFor="post-content">Content</label>
      <textarea
        id="post-content"
        name="content"
        rows={6}
        value={values.content}
        onChange={handleChange}
        aria-invalid={Boolean(errors.content)}
      />
      {errors.content && <p className="field-error" role="alert">{errors.content}</p>}

      <div className="row">
        <div>
          <label htmlFor="post-category">Category</label>
          <input id="post-category" name="category" value={values.category} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="post-status">Status</label>
          <select id="post-status" name="status" value={values.status} onChange={handleChange}>
            <option value="published">published</option>
            <option value="draft">draft</option>
          </select>
        </div>
      </div>

      <div className="actions">
        <button type="submit" className="primary" disabled={submitting}>
          {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create post'}
        </button>
        <button type="button" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function pick(post) {
  if (!post) return {};
  const { title = '', content = '', category = '', status = 'published' } = post;
  return { title, content, category, status };
}
