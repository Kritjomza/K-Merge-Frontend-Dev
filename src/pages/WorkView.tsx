import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaBookmark, FaRegBookmark, FaUsers, FaFlag } from 'react-icons/fa';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { apiGet } from '../lib/api';
import type { WorkDetail, PublicProfile } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { supabaseInsert } from '../lib/supabase';
import './WorkView.css';

const REPORT_OPTIONS = [
  { value: 'spam', label: 'สแปม (Spam)' },
  { value: 'inappropriate', label: 'เนื้อหาไม่เหมาะสม / 18+' },
  { value: 'copyright', label: 'ละเมิดลิขสิทธิ์' },
  { value: 'hate', label: 'ภาษาหยาบคาย / Hate Speech' },
  { value: 'fake', label: 'ข้อมูลปลอม' },
];

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
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReasons, setReportReasons] = useState<string[]>([]);
  const [reportDetails, setReportDetails] = useState('');
  const [reportState, setReportState] = useState<{ submitting: boolean; success: boolean; error: string | null }>({
    submitting: false,
    success: false,
    error: null,
  });

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

  const resetReportState = () => {
    setReportReasons([]);
    setReportDetails('');
    setReportState({ submitting: false, success: false, error: null });
  };

  const closeReportModal = () => {
    setReportOpen(false);
    resetReportState();
  };

  const openReportModal = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setReportOpen(true);
    setReportState(prev => ({ ...prev, success: false, error: null }));
  };

  const toggleReason = (value: string) => {
    setReportReasons(prev => (prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]));
  };

  const handleReportSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    const workId = data?.workId || id;
    if (!workId) {
      setReportState(prev => ({ ...prev, error: 'ไม่พบรหัสผลงานสำหรับการรายงาน' }));
      return;
    }
    if (reportReasons.length === 0) {
      setReportState(prev => ({ ...prev, error: 'กรุณาเลือกเหตุผลอย่างน้อย 1 ข้อ' }));
      return;
    }
    setReportState({ submitting: true, success: false, error: null });
    try {
      const reasonText = reportReasons
        .map(value => REPORT_OPTIONS.find(option => option.value === value)?.label || value)
        .join(', ');
      await supabaseInsert('Report', {
        workId,
        reporterId: user.id,
        reason: reasonText,
        details: reportDetails.trim() || null,
        status: 'pending',
        reportedAt: new Date().toISOString(),
      });
      setReportState({ submitting: false, success: true, error: null });
      setTimeout(() => {
        closeReportModal();
      }, 1600);
    } catch (err: any) {
      setReportState({
        submitting: false,
        success: false,
        error: err?.message || 'ไม่สามารถส่งรายงานได้',
      });
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
            <div className="wv-header">
              <button type="button" className="wv-back" onClick={goBack}>
                <FaArrowLeft aria-hidden="true" />
                Back
              </button>
              <span className="wv-status-pill">{statusLabel}</span>
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

              <div className="wv-card wv-info">
                <div className="wv-info__header">
                  <div className="wv-title-block">
                    <h1 id="work-title" className="wv-title">{data.title}</h1>
                    <div className="wv-meta-grid">
                      <p>{formattedDate}</p>
                      {/* <p>{mediaCount} {mediaCount === 1 ? 'shot' : 'shots'}</p> */}
                      <div className="wv-info__statline">
                        <FaUsers aria-hidden="true" />
                        <span>{formattedSaveTotal} {saveState.total === 1 ? 'person' : 'people'} bookmarked this</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="wv-cta-row">
                  <button
                    type="button"
                    className={`wv-save ${saveState.saved ? 'is-active' : ''}`}
                    onClick={toggleSave}
                    disabled={saveState.busy}
                  >
                    {saveState.saved ? <FaBookmark aria-hidden="true" /> : <FaRegBookmark aria-hidden="true" />}
                    <span>{saveState.saved ? 'Saved' : 'Save this work'}</span>
                  </button>
                  <button
                      type="button"
                      className="wv-report"
                      onClick={openReportModal}
                      aria-label="Report work"
                    >
                      <FaFlag aria-hidden="true" />
                    </button>
                </div>
                {saveState.error && <p className="wv-save-error">{saveState.error}</p>}

                <article className="wv-desc">
                  {description}
                </article>

                <div className="wv-chip-rail">
                  {tagList.length ? (
                    tagList.map(tag => (
                      <span key={tag.tagId ?? tag.name} className="wv-chip">{tag.name}</span>
                    ))
                  ) : (
                    <span className="wv-chip muted">No tags yet</span>
                  )}
                </div>

                <div className="wv-metrics" role="list">
                  <div className="wv-metric" role="listitem">
                    <span>Status</span>
                    <strong>{statusLabel}</strong>
                  </div>
                  <div className="wv-metric" role="listitem">
                    <span>Shots</span>
                    <strong>{mediaCount}</strong>
                  </div>
                  <div className="wv-metric" role="listitem">
                    <span>Updated</span>
                    <strong>{formattedDate}</strong>
                  </div>
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
                      <p className="wv-author__eyebrow">Creator</p>
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
      {reportOpen && (
        <div className="wv-report-layer" role="dialog" aria-modal="true" aria-labelledby="wv-report-title">
          <div className="wv-report-modal">
            <div className="wv-report-modal__head">
              <div>
                <p className="wv-eyebrow">Safety</p>
                <h2 id="wv-report-title">Report this work</h2>
                <p>เลือกเหตุผลที่เข้าข่ายและบอกเราเพิ่มเติมหากต้องการ</p>
              </div>
              <button type="button" className="wv-report-close" onClick={closeReportModal} aria-label="Close report form">×</button>
            </div>
            <form className="wv-report-form" onSubmit={handleReportSubmit}>
              <fieldset disabled={reportState.submitting}>
                <legend className="sr-only">Report reasons</legend>
                <div className="wv-report-options">
                  {REPORT_OPTIONS.map(option => {
                    const checked = reportReasons.includes(option.value);
                    return (
                      <label key={option.value} className={`wv-report-option ${checked ? 'is-active' : ''}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleReason(option.value)}
                          value={option.value}
                        />
                        <span>{option.label}</span>
                      </label>
                    );
                  })}
                </div>
                <label className="wv-report-textarea">
                  <span>รายละเอียดเพิ่มเติม (ไม่บังคับ)</span>
                  <textarea
                    rows={3}
                    value={reportDetails}
                    onChange={e => setReportDetails(e.target.value)}
                    placeholder="อธิบายว่ามีส่วนไหนผิดกฎหรือไม่สุภาพ"
                  />
                </label>
              </fieldset>
              {reportState.error && <p className="wv-report-error">{reportState.error}</p>}
              {reportState.success && <p className="wv-report-success">ส่งรายงานแล้ว ขอบคุณที่ช่วยดูแลคอมมูนิตี้</p>}
              <div className="wv-report-actions">
                <button type="button" className="wv-report-btn ghost" onClick={closeReportModal} disabled={reportState.submitting}>
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="wv-report-btn primary"
                  disabled={reportState.submitting || reportReasons.length === 0}
                >
                  {reportState.submitting ? 'กำลังส่ง…' : 'ส่งรายงาน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
