import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSearchParams } from 'react-router-dom'
function PostDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams()

  const highlightedComment =
  searchParams.get('comment')

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);

  useEffect(() => {
  fetch(`/api/posts/${id}`)
    .then((res) => res.json())
    .then((data) => setPost(data))
    .catch(console.error);

  fetch(`/api/posts/${id}/comments`)
    .then((res) => res.json())
    .then((data) => setComments(data))
    .catch(console.error);
}, [id]);

  useEffect(() => {
    if (highlightedComment && comments.length > 0) {
      const element = document.getElementById(
        `comment-${highlightedComment}`
    );

    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }
}, [highlightedComment, comments]);

  if (!post) {
    return <div>Loading...</div>;
  }

  return (
    <div
      className="glass-panel"
      style={{
        maxWidth: "800px",
        margin: "2rem auto",
        padding: "2rem"
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem"
        }}
      >
        <img
          src={post.author.avatarUrl}
          alt=""
          style={{
            width: 50,
            height: 50,
            borderRadius: "50%"
          }}
        />

        <div>
          <h3>@{post.author.username}</h3>
        </div>
      </div>

      <p
        style={{
          marginTop: "1.5rem",
          lineHeight: "1.7"
        }}
      >
        {post.text}
      </p>

      <div
        style={{
          marginTop: "1rem",
          color: "var(--text-muted)"
        }}
      >
        ❤️ {post.likes?.length || 0} Likes
      </div>
      
<div style={{ marginTop: '2rem' }}>
  <h3>Comments</h3>

  {comments.length === 0 ? (
    <p>No comments yet</p>
  ) : (
    comments.map((comment) => (
      <div
        key={comment._id}
        id={`comment-${comment._id}`}
        style={{
          padding: '1rem',
          marginTop: '1rem',
          borderRadius: '10px',

          background:
            highlightedComment === comment._id
              ? 'rgba(255,255,0,0.15)'
              : 'rgba(255,255,255,0.05)',

          border:
            highlightedComment === comment._id
              ? '2px solid gold'
              : '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <strong>
          @{comment.author?.username}
        </strong>

        <p>{comment.text}</p>
      </div>
    ))
  )}
</div>
{/* END OF ADDED SECTION */}

    </div>
  );
}

export default PostDetailPage;