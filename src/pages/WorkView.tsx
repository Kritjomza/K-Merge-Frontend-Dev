import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { apiGet } from '../lib/api';
import type { WorkDetail } from '../lib/api';
import './WorkView.css';

export default function WorkView() {
  const { id } = useParams();
  const [data, setData] = useState<WorkDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const work = await apiGet<WorkDetail>(`/works/${id}`);
        if (!cancelled) setData(work);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const hero = useMemo(() => {
    if (data?.media?.length) return data.media[active]?.fileurl || data.thumbnail || '';
    return data?.thumbnail || '';
  }, [data, active]);

  return (
    <>
      <Navbar />
      <main className="wv">
        {loading && (
          <section className="wv-wrap">
            <div className="wv-skeleton" />
            <div className="wv-side">
              <div className="wv-side__skeleton" />
              <div className="wv-side__skeleton sm" />
            </div>
          </section>
        )}
        {error && <div className="wv-error">Error: {error}</div>}
        {data && (
          <section className="wv-wrap" aria-labelledby="work-title">
            <div className="wv-main">
              <div className="wv-hero">
                {hero ? (
                  <img src={hero} alt={data.title} />
                ) : (
                  <div className="wv-blank" />
                )}
              </div>

              {!!data.media?.length && (
                <div className="wv-thumbs" role="list">
                  {data.media.map((m, i) => (
                    <button
                      key={m.fileurl}
                      onClick={() => setActive(i)}
                      className={`wv-thumb ${i===active ? 'is-active' : ''}`}
                      aria-label={`Image ${i+1}`}
                    >
                      <img src={m.fileurl} alt={m.alttext || `image ${i+1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <aside className="wv-side">
              <div className="wv-breadcrumb">
                <Link to="/" className="wv-link">Home</Link>
                <span className="wv-sep">/</span>
                <span>Work</span>
              </div>

              <h1 id="work-title" className="wv-title">{data.title}</h1>

              <div className="wv-tags" aria-label="tags">
                {(data.tags||[]).map(t => (
                  <span key={t.tagId} className="wv-tag">{t.name}</span>
                ))}
              </div>

              <article className="wv-desc">
                {data.description || 'No description provided.'}
              </article>

              <div className="wv-actions">
                <Link to="/" className="wv-btn">Back to Home</Link>
              </div>
            </aside>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}

