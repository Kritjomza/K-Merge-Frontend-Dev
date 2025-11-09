import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaBookmark, FaRegBookmark, FaUsers } from 'react-icons/fa';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { apiGet } from '../lib/api';
import type { WorkDetail, PublicProfile } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import './WorkView.css';

type SaveSummary = { saved: boolean; total: number };

export default function WorkView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<WorkDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const [saveState, setSaveState] = useState<{ saved: boolean; total: number; busy: boolean; error: string | null }>({
    saved: false,
    total: 0,
    busy: false,
    error: null,
  });
  const [authorProfile, setAuthorProfile] = useState<PublicProfile | null>(null);
  const [authorLoading, setAuthorLoading] = useState(false);
  const [authorError, setAuthorError] = useState<string | null>(null);

  useEffect(() => {
    setActive(0);
    setData(null);
    setError(null);
    setSaveState({ saved: false, total: 0, busy: false, error: null });
    setAuthorProfile(null);
    setAuthorError(null);
    setAuthorLoading(false);
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const work = await apiGet<WorkDetail>(`/works/${id}`);
        if (!cancelled) setData(work);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load work');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    setSaveState(prev => ({
      ...prev,
      total: typeof data?.saveCount === 'number' ? data.saveCount : prev.total,
    }));
  }, [data?.saveCount]);

  useEffect(() => {
    let cancelled = false;
    if (!data?.authorId) {
      setAuthorProfile(null);
      setAuthorError(null);
      setAuthorLoading(false);
      return;
    }
    if (data.authorProfile) {
      setAuthorProfile(data.authorProfile);
      setAuthorError(null);
      setAuthorLoading(false);
      return;
    }
    setAuthorLoading(true);
    setAuthorError(null);
    (async () => {
      try {
        const profile = await apiGet<PublicProfile>(`/auth/profile/public/${data.authorId}`);
        if (!cancelled) setAuthorProfile(profile || null);
      } catch (err: any) {
        if (!cancelled) {
          setAuthorProfile(null);
          setAuthorError(err?.message ?? 'Unable to load creator');
        }
      } finally {
        if (!cancelled) setAuthorLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [data?.authorId, data?.authorProfile]);

  useEffect(() => {
    if (!user) {
      setSaveState(prev => ({ ...prev, saved: false }));
      return;
    }
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const summary = await apiGet<SaveSummary>(`/works/${id}/save`);
        if (!cancelled) {
          setSaveState(prev => ({
            ...prev,
            saved: summary.saved,
            total: summary.total ?? prev.total,
          }));
        }
      } catch {
        if (!cancelled) {
          setSaveState(prev => ({ ...prev, saved: false }));
        }
      }
    })();
    return () => { cancelled = true; };
  }, [id, user]);

  const hero = useMemo(() => {
    if (data?.media?.length) return data.media[active]?.fileurl || data.thumbnail || '';
    return data?.thumbnail || '';
  }, [data, active]);

  const mediaCount = data?.media?.length ?? 0;
  const statusLabel = data?.status
    ? data.status.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())
    : 'Draft';
  const updatedAt = data?.publishedAt || data?.updatedAt || (data as any)?.created_at;
  const formattedDate = updatedAt ? new Date(updatedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }) : '—';
  const tagList = data?.tags || [];
  const highlightTag = tagList[0]?.name || 'Featured Work';
  const description = data?.description?.trim() ? data.description : 'This project has no description yet.';
  const formattedSaveTotal = new Intl.NumberFormat().format(saveState.total);
  const authorFallbackName = 'KMUTT Creator';
  const authorName = authorProfile?.displayName || authorFallbackName;
  const profileId = authorProfile?.userID || data?.authorId;
  const authorLocation = authorProfile?.location || 'KMUTT, Thailand';
  const authorJoined = authorProfile?.created_at
    ? new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(new Date(authorProfile.created_at))
    : null;
  const authorBio = authorProfile?.bio?.trim() ? authorProfile.bio : null;
  const authorContact = authorProfile?.contact?.trim() || '';
  const authorAvatar = authorProfile?.avatarUrl
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=F59E0B&color=fff`;

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const goPrevMedia = () => {
    if (!mediaCount) return;
    setActive(prev => (prev - 1 + mediaCount) % mediaCount);
  };

  const goNextMedia = () => {
    if (!mediaCount) return;
    setActive(prev => (prev + 1) % mediaCount);
  };

  const toggleSave = async () => {
    if (!id) return;
    if (!user) {
      navigate('/login');
      return;
    }
    setSaveState(prev => ({ ...prev, busy: true, error: null }));
    try {
      const method = saveState.saved ? 'DELETE' : 'POST';
      const res = await fetch(`/works/${id}/save`, {
        method,
        credentials: 'include',
      });
      if (res.status === 401) {
        navigate('/login');
        return;
      }
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Unable to update saved state');
      }
      const payload = await res.json();
      setSaveState(prev => ({
        saved: typeof payload.saved === 'boolean' ? payload.saved : !prev.saved,
        total: typeof payload.total === 'number' ? payload.total : prev.total,
        busy: false,
        error: null,
      }));
    } catch (err: any) {
      setSaveState(prev => ({
        ...prev,
        busy: false,
        error: err?.message || 'Unable to update saved state',
      }));
    }
  };

  return (
    <>
      <Navbar />
      <main className="wv">
        {loading && (
          <section className="wv-shell" aria-hidden="true">
            <div className="wv-layout">
              <div className="wv-card wv-card--ghost">
                <div className="wv-skeleton hero" />
                <div className="wv-skeleton rail" />
              </div>
              <div className="wv-card wv-card--ghost">
                <div className="wv-skeleton badge" />
                <div className="wv-skeleton title" />
                <div className="wv-skeleton text" />
                <div className="wv-skeleton text short" />
              </div>
            </div>
          </section>
        )}

        {error && !loading && (
          <div className="wv-error" role="alert">
            {error}
          </div>
        )}

        {data && (
          <section className="wv-shell" aria-labelledby="work-title">
            <div className="wv-top">
              <button type="button" className="wv-back" onClick={goBack}>
                <FaArrowLeft aria-hidden="true" />
                Back
              </button>
              <span className="wv-tagline">Spotlight</span>
            </div>

            <div className="wv-layout">
              <div className="wv-card wv-gallery">
                <div className="wv-hero-frame">
                  {hero ? (
                    <img src={hero} alt={data.media?.[active]?.alttext || data.title} />
                  ) : (
                    <div className="wv-blank" />
                  )}
                  {mediaCount > 0 && (
                    <span className="wv-hero-badge">
                      {active + 1}/{mediaCount}
                    </span>
                  )}
                  {mediaCount > 1 && (
                    <>
                      <button
                        type="button"
                        className="wv-hero-nav prev"
                        aria-label="Previous image"
                        onClick={goPrevMedia}
                      >
                        <FiChevronLeft />
                      </button>
                      <button
                        type="button"
                        className="wv-hero-nav next"
                        aria-label="Next image"
                        onClick={goNextMedia}
                      >
                        <FiChevronRight />
                      </button>
                    </>
                  )}
                </div>

                {mediaCount > 1 && (
                  <div className="wv-media-grid" role="list">
                    {data.media!.map((m, i) => (
                      <button
                        key={m.id || m.fileurl}
                        type="button"
                        onClick={() => setActive(i)}
                        className={`wv-thumb ${i === active ? 'is-active' : ''}`}
                        aria-label={`Show shot ${i + 1}`}
                        aria-pressed={i === active}
                      >
                        <img src={m.fileurl} alt={m.alttext || `shot ${i + 1}`} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="wv-card wv-panel">
                <div className="wv-panel__header">
                  <div>
                    <p className="wv-eyebrow">{highlightTag}</p>
                    <h1 id="work-title" className="wv-title">{data.title}</h1>
                  </div>
                  <button
                    type="button"
                    className={`wv-save ${saveState.saved ? 'is-active' : ''}`}
                    onClick={toggleSave}
                    disabled={saveState.busy}
                  >
                    {saveState.saved ? <FaBookmark aria-hidden="true" /> : <FaRegBookmark aria-hidden="true" />}
                    <span>{saveState.saved ? 'Saved' : 'Save work'}</span>
                  </button>
                </div>

                <div className="wv-save-meta">
                  <FaUsers aria-hidden="true" />
                  <span>{formattedSaveTotal} {saveState.total === 1 ? 'creative' : 'creatives'} saved this</span>
                </div>
                {saveState.error && <p className="wv-save-error">{saveState.error}</p>}

                <div className="wv-chips">
                  {tagList.length ? (
                    tagList.map(tag => (
                      <span key={tag.tagId ?? tag.name} className="wv-chip">{tag.name}</span>
                    ))
                  ) : (
                    <span className="wv-chip muted">No tags yet</span>
                  )}
                </div>

                <article className="wv-desc">
                  {description}
                </article>

                <div className="wv-stats" role="list">
                  <div className="wv-stat" role="listitem">
                    <span className="wv-stat__label">Status</span>
                    <span className="wv-stat__value">{statusLabel}</span>
                  </div>
                  <div className="wv-stat" role="listitem">
                    <span className="wv-stat__label">Shots</span>
                    <span className="wv-stat__value">{mediaCount}</span>
                  </div>
                  <div className="wv-stat" role="listitem">
                    <span className="wv-stat__label">Updated</span>
                    <span className="wv-stat__value">{formattedDate}</span>
                  </div>
                </div>

                <div className="wv-actions">
                  <Link to="/" className="wv-action wv-action--primary">Explore more</Link>
                  <Link to="/profile#saved" className="wv-action">Go to saved</Link>
                </div>

                <div className="wv-author" aria-live="polite">
                  <div className="wv-author__info">
                    <div className="wv-author__avatar" aria-hidden={authorLoading}>
                      {authorLoading ? (
                        <span className="wv-author__avatar-skel" />
                      ) : (
                        <img
                          src={authorAvatar}
                          alt={`Avatar of ${authorName}`}
                          onError={(e) => {
                            const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=F59E0B&color=fff`;
                            if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                          }}
                        />
                      )}
                    </div>
                    <div>
                      <p className="wv-author__eyebrow">Posted by</p>
                      <h3 className="wv-author__name">{authorLoading ? 'Loading creator…' : authorName}</h3>
                      <div className="wv-author__badges">
                        <span className="wv-author__badge">{authorLocation}</span>
                        {authorJoined && <span className="wv-author__badge">Joined {authorJoined}</span>}
                      </div>
                      {authorBio && <p className="wv-author__bio">{authorBio}</p>}
                      {authorContact && (
                        <p className="wv-author__contact">Contact: <span>{authorContact}</span></p>
                      )}
                      {authorError && <p className="wv-author__error">{authorError}</p>}
                    </div>
                  </div>
                  <div className="wv-author__actions">
                    {profileId && (
                      <Link className="wv-author__cta" to={`/creators/${profileId}`}>
                        View profile
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
