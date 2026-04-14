import './PageLoader.css';

export default function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="page-loader">
      <div className="page-loader__spinner" aria-hidden="true" />
      <p className="page-loader__label">{label}</p>
    </div>
  );
}
