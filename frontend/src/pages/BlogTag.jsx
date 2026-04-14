import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import SEO from '../components/SEO';
import { getPosts, getTag } from '../services/api';
import { FaArrowLeft } from 'react-icons/fa';
import './Blog.css';

export default function BlogTag() {
  const { slug } = useParams();
  const [tag, setTag] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    Promise.all([
      getTag(slug).then(res => setTag(res.data)),
      getPosts({ tag: slug }).then(res => setPosts(res.data?.results || res.data)),
    ])
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="blog-loading" style={{ padding: '100px 0' }}>Loading...</div>;

  if (notFound || !tag) return (
    <div className="blog-empty" style={{ padding: '100px 24px' }}>
      <h2>Tag Not Found</h2>
      <p>No posts found for this tag.</p>
      <Link to="/blog" className="btn btn--primary">Back to Blog</Link>
    </div>
  );

  const pageTitle = `${tag.name} — SEO & AI Automation Articles | Kastriot Tanaj`;
  const pageDescription = tag.description
    || `Articles tagged ${tag.name} — SEO tips, AI automation insights, and digital marketing strategies for NYC businesses by Kastriot Tanaj.`;

  return (
    <>
      <SEO
        title={pageTitle}
        description={pageDescription}
        canonical={`/blog/tag/${tag.slug}`}
      />

      <section className="page-hero">
        <div className="container">
          <Link to="/blog" className="blog-post__back">
            <FaArrowLeft /> Back to Blog
          </Link>
          <h1>Posts tagged <span style={{ color: '#2563eb' }}>#{tag.name}</span></h1>
          {tag.description && <p>{tag.description}</p>}
        </div>
      </section>

      <section className="section">
        <div className="container">
          {posts.length > 0 ? (
            <div className="blog-grid">
              {posts.map(post => (
                <Link to={`/blog/${post.slug}`} key={post.id} className="blog-card">
                  {post.featured_image && (
                    <div className="blog-card__image">
                      <img src={post.featured_image} alt={post.title} loading="lazy" />
                    </div>
                  )}
                  <div className="blog-card__content">
                    {post.category && (
                      <span className="blog-card__category">{post.category.name}</span>
                    )}
                    <h2>{post.title}</h2>
                    <p>{post.excerpt}</p>
                    <time>{new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="blog-empty">
              <h2>No posts yet</h2>
              <p>No articles are tagged with #{tag.name} yet. Check back soon.</p>
              <Link to="/blog" className="btn btn--primary">Browse all articles</Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
