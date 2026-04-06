import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import SEO, { ArticleSchema } from '../components/SEO';
import { getPost } from '../services/api';
import { FaArrowLeft } from 'react-icons/fa';
import './Blog.css';

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getPost(slug)
      .then(res => setPost(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="blog-loading" style={{ padding: '100px 0' }}>Loading...</div>;
  if (!post) return (
    <div className="blog-empty" style={{ padding: '100px 24px' }}>
      <h2>Post Not Found</h2>
      <p>The article you're looking for doesn't exist.</p>
      <Link to="/blog" className="btn btn--primary">Back to Blog</Link>
    </div>
  );

  return (
    <>
      <SEO
        title={post.meta_title || post.title}
        description={post.meta_description || post.excerpt}
        canonical={`/blog/${post.slug}`}
        type="article"
        article={{ publishedAt: post.created_at, updatedAt: post.updated_at }}
      />
      <ArticleSchema
        title={post.title}
        description={post.excerpt}
        url={`/blog/${post.slug}`}
        image={post.featured_image}
        publishedAt={post.created_at}
        updatedAt={post.updated_at}
      />

      <article className="blog-post">
        <div className="container blog-post__container">
          <Link to="/blog" className="blog-post__back">
            <FaArrowLeft /> Back to Blog
          </Link>

          {post.category && (
            <span className="blog-card__category">{post.category.name}</span>
          )}
          <h1>{post.title}</h1>
          <div className="blog-post__meta">
            <time>{new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
            {post.tags && <span className="blog-post__tags">{post.tags}</span>}
          </div>

          {post.featured_image && (
            <img src={post.featured_image} alt={post.title} className="blog-post__image" loading="lazy" />
          )}

          <div className="blog-post__content" dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>
      </article>
    </>
  );
}
