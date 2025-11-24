import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Masonry from "react-masonry-css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { apiGet } from "../lib/api";
import { supabaseRest } from "../lib/supabase";
import type { PublicProfile, WorkListItem } from "../lib/api";
import "./creator-profile.css";

type RouteParams = {
  userId?: string;
};

const masonryBreakpoints = {
  default: 4,
  1400: 3,
  1024: 2,
  640: 1,
};

export default function CreatorProfile() {
  const { userId } = useParams<RouteParams>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [works, setWorks] = useState<WorkListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [joinedDate, setJoinedDate] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await apiGet<{ profile: PublicProfile | null; works: WorkListItem[] }>(`/works/author/${userId}`);

        // Fetch created_at from users table
        let createdAt = null;
        try {
          const userRows = await supabaseRest<{ created_at: string }[]>("users", {
            searchParams: {
              select: "created_at",
              id: `eq.${userId}`,
            },
          });
          if (userRows && userRows.length > 0) {
            createdAt = userRows[0].created_at;
          }
        } catch (err) {
          console.error("Failed to fetch user created_at", err);
        }

        if (!cancelled) {
          setProfile(res.profile || null);
          setWorks(res.works || []);
          setJoinedDate(createdAt || res.profile?.created_at || null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setProfile(null);
          setWorks([]);
          setError(err?.message || "Unable to load creator");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    if (!userId) navigate("/");
  }, [userId, navigate]);

  const displayName = profile?.displayName || "KMUTT Creator";
  const location = profile?.location || "KMUTT, Thailand";
  const bio = profile?.bio?.trim() || "This creator has not written a bio yet.";
  const joined = joinedDate
    ? new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(new Date(joinedDate))
    : null;
  const contactLabel = profile?.contact?.trim() || "";
  const contactHref = useMemo(() => {
    if (!contactLabel) return null;
    if (/^https?:\/\//i.test(contactLabel)) return contactLabel;
    if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactLabel)) return `mailto:${contactLabel}`;
    if (/^\+?\d[\d\s-]+$/.test(contactLabel)) return `tel:${contactLabel.replace(/[^\d+]/g, "")}`;
    return null;
  }, [contactLabel]);
  const avatarUrl = profile?.avatarUrl
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=F59E0B&color=fff`;

  const topTags = useMemo(() => {
    const freq = new Map<string, number>();
    works.forEach((work) => {
      (work.tags || []).forEach((tag) => {
        freq.set(tag.name, (freq.get(tag.name) || 0) + 1);
      });
    });
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);
  }, [works]);

  const describeWorkMeta = (work: WorkListItem) => {
    const ts = work.updatedAt || (work as any).updated_at || work.created_at || work.publishedAt;
    if (!ts) return "Published work";
    const formatted = new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short" }).format(new Date(ts));
    return `Published ${formatted}`;
  };

  const renderContact = () => {
    if (!contactLabel) return null;
    if (contactHref) {
      return (
        <a className="creator-card__contact" href={contactHref} target="_blank" rel="noreferrer">
          {contactLabel}
        </a>
      );
    }
    return <span className="creator-card__contact">{contactLabel}</span>;
  };

  const heroState = (() => {
    if (loading) return "loading";
    if (error) return "error";
    return "ready";
  })();

  return (
    <>
      <Navbar />
      <main className="creator">
        <section className="creator-hero">
          <div className="creator-hero__inner">
            <button className="creator-hero__back" onClick={() => navigate(-1)}>
              Back
            </button>
            <div className="creator-card" aria-live="polite">
              {heroState === "loading" ? (
                <div className="creator-card__skeleton">
                  <span className="creator-skel avatar" />
                  <span className="creator-skel line" />
                  <span className="creator-skel line short" />
                  <span className="creator-skel line" />
                </div>
              ) : heroState === "error" ? (
                <div className="creator-card__empty">
                  <p>{error}</p>
                  <Link to="/" className="creator-hero__cta">Back to explore</Link>
                </div>
              ) : (
                <>
                  <div className="creator-card__bio">
                    <div className="creator-card__avatar">
                      <img
                        src={avatarUrl}
                        alt={`${displayName} avatar`}
                        onError={(e) => {
                          const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=F59E0B&color=fff`;
                          if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                        }}
                      />
                    </div>
                    <div>
                      <p className="creator-card__eyebrow">Creative Profile</p>
                      <h1 className="creator-card__title">{displayName}</h1>
                      <p className="creator-card__subtitle">{location}</p>
                      <p className="creator-card__text">{bio}</p>
                      <div className="creator-card__chips">
                        {topTags.length ? topTags.map((tag) => (
                          <span key={tag} className="creator-chip">{tag}</span>
                        )) : <span className="creator-chip muted">No tags yet</span>}
                      </div>
                      {renderContact()}
                    </div>
                  </div>
                  <div className="creator-card__stats">
                    <div>
                      <span className="creator-stat__label">Posts</span>
                      <strong className="creator-stat__value">{works.length}</strong>
                    </div>
                    <div>
                      <span className="creator-stat__label">Location</span>
                      <strong className="creator-stat__value">{location}</strong>
                    </div>
                    <div>
                      <span className="creator-stat__label">Joined</span>
                      <strong className="creator-stat__value">{joined || "—"}</strong>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="creator-gallery">
          <div className="creator-gallery__inner">
            <div className="creator-gallery__head">
              <div>
                <h2>All works</h2>
                <p>Handpicked creations from {displayName}.</p>
              </div>
              <div className="creator-gallery__meta">
                <span>{works.length} published posts</span>
                {topTags.length > 0 && (
                  <span>Top tags: {topTags.join(", ")}</span>
                )}
              </div>
            </div>

            {loading ? (
              <div className="creator-empty">Loading works…</div>
            ) : error ? (
              <div className="creator-empty" role="alert">{error}</div>
            ) : works.length === 0 ? (
              <div className="creator-empty">
                <h3>No posts yet</h3>
                <p>When {displayName} shares a project it will appear here.</p>
              </div>
            ) : (
              <Masonry
                breakpointCols={masonryBreakpoints}
                className="creator-masonry"
                columnClassName="creator-masonry__col"
              >
                {works.map((work, index) => {
                  const wid = (work as any).workId || (work as any).id || `${work.title}-${index}`;
                  const thumb = work.thumbnail;
                  const desc = work.description?.trim() || "No description provided.";
                  return (
                    <article key={wid} className="creator-work fade-in-up">
                      <Link to={`/works/${wid}`} className="creator-work__thumb" aria-label={`View ${work.title}`}>
                        {thumb ? <img src={thumb} alt="" /> : <div className="creator-work__thumb-fallback" />}
                      </Link>
                      <div className="creator-work__body">
                        <div className="creator-work__tags">
                          {(work.tags || []).slice(0, 3).map((tag) => (
                            <span key={tag.tagId || tag.name} className="creator-chip">{tag.name}</span>
                          ))}
                        </div>
                        <h3 className="creator-work__title">{work.title}</h3>
                        <p className="creator-work__text">{desc}</p>
                        <div className="creator-work__meta">
                          <span>{describeWorkMeta(work)}</span>
                          <Link to={`/works/${wid}`} className="creator-work__cta">View</Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </Masonry>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
