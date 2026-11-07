export default function PostList({ posts, onEdit, onDelete, busyId = null }) {
  if (posts.length === 0) {
    return <p className="empty">No posts found.</p>;
  }

  return (
    <ul className="post-list" aria-label="Posts">
      {posts.map((post) => (
        <li key={post.id} className="post-card" aria-label={post.title}>
          <div className="post-meta">
            <span>#{post.id}</span>
            {post.category && <span className="tag">{post.category}</span>}
            <span className={`tag status-${post.status}`}>{post.status}</span>
            {post.isLocal && <span className="tag local" title="Exists only in this browser session">local</span>}
          </div>
          <h3>{post.title}</h3>
          <p className="post-content">{post.content}</p>
          {post.updatedAt && <p className="post-date">Updated {post.updatedAt}</p>}
          <div className="actions">
            <button type="button" onClick={() => onEdit(post)} disabled={busyId === post.id}>
              Edit
            </button>
            <button
              type="button"
              className="danger"
              onClick={() => onDelete(post)}
              disabled={busyId === post.id}
            >
              {busyId === post.id ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
