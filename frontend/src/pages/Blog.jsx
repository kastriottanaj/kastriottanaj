import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { getPosts, getCategories } from '../services/api';
import './Blog.css';

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategories().then(res => setCategories(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = activeCategory ? { category: activeCategory } : {};
    getPosts(params)
      .then(res => setPosts(res.data?.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeCategory]);

  return (
    <>
      <SEO
        title="SEO Blog"
        description="Read expert SEO tips, AI automation insights, and digital marketing strategies from Kastriot Tanaj. Stay ahead in the New York SEO landscape."
        canonical="/blog"
      />

      <section className="page-hero">
        <div className="container">
          <h1>SEO Blog</h1>
          <p>Insights, strategies, and tips on SEO, AI automation, and digital marketing</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {categories.length > 0 && (
            <div className="blog-filters">
              <button
                className={`blog-filter ${!activeCategory ? 'blog-filter--active' : ''}`}
                onClick={() => setActiveCategory('')}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat.slug}
                  className={`blog-filter ${activeCategory === cat.slug ? 'blog-filter--active' : ''}`}
                  onClick={() => setActiveCategory(cat.slug)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="blog-loading">Loading posts...</div>
          ) : posts.length > 0 ? (
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
              <h2>Coming Soon</h2>
              <p>I'm working on new SEO insights and strategies. Check back soon for articles on ranking in New York, AI-powered SEO, and more.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
