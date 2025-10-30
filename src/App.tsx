import React, { useEffect, useMemo, useState } from "react";
import Masonry from "react-masonry-css";
import { AnimatePresence, motion } from "framer-motion";
import { FiChevronLeft, FiChevronRight, FiTag, FiX, FiImage, FiSearch } from "react-icons/fi";
import { Link } from "react-router-dom";
import { apiGet, type WorkListItem } from "./lib/api";
import "./App.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
// no page-level Navbar here; other pages handle their own layout

type Post = {
  id: string;
  title: string;
  image: string;
  tags: string[];
};

type Tag = string;

const breakpointColumns = {
  default: 5,
  1200: 4,
  900: 3,
  600: 2,
  400: 1,
};

const POSTS_PER_PAGE = 12;

export default function App() {
  const [activeTag, setActiveTag] = useState<Tag | null>(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [works, setWorks] = useState<WorkListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const list = await apiGet<WorkListItem[]>("/works");
        if (!cancelled) setWorks(list || []);
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const allPosts: Post[] = useMemo(() => {
    return (works || []).map((w, i) => ({
      id: String((w as any).workId ?? (w as any).id ?? i),
      title: w.title,
      image: w.thumbnail || "https://images.unsplash.com/photo-1528372444006-1bfc81acab02?q=80&w=1200&auto=format&fit=crop",
      tags: (w.tags || []).map((t) => t.name),
    }));
  }, [works]);

  const tagPool: string[] = useMemo(() => {
    const set = new Set<string>();
    allPosts.forEach((p) => p.tags.forEach((t) => set.add(t)));
    if (set.size === 0) return ["Website", "Art", "Cars", "Tech", "Nature", "Animals"];
    return Array.from(set).sort();
  }, [allPosts]);

  const filtered = useMemo(() => {
    let data = allPosts;
    if (activeTag) data = data.filter((p) => p.tags.includes(activeTag));
    const q = query.trim().toLowerCase();
    if (q) data = data.filter((p) => p.title.toLowerCase().includes(q));
    return data;
  }, [allPosts, activeTag, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / POSTS_PER_PAGE));
  const clampedPage = Math.min(page, totalPages);
  const start = (clampedPage - 1) * POSTS_PER_PAGE;
  const end = start + POSTS_PER_PAGE;
  const current = filtered.slice(start, end);

  const handleSelectTag = (tag: Tag) => {
    setActiveTag((prev) => (prev === tag ? null : tag));
    setPage(1);
  };

  const resetTag = () => {
    setActiveTag(null);
    setPage(1);
  };

  const key = `${activeTag ?? "all"}-${clampedPage}-${query}`;

  return (
    <>
      <Navbar />
      <div className="km-wrap">
        {/* Hero - orange/white inside container */}
        <section className="km-hero" aria-labelledby="hero-title">
          <div className="km-hero__inner fade-in-up">
            <h1 id="hero-title" className="km-hero__title">K-Merge Creative Hub</h1>
            <p className="km-hero__subtitle">Explore KMUTT students' works in a clean orange/white Masonry layout.</p>
            <form className="km-search" onSubmit={(e) => e.preventDefault()} role="search" aria-label="Search works">
              <input
                className="km-search__input"
                placeholder="Search works..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                aria-label="Search"
              />
              <button className="km-search__btn" type="submit"><FiSearch /> Search</button>
            </form>
          </div>
        </section>

        <header className="km-section">
          <div className="km-section__head">
            <div>
              <h1 className="km-section__title">Explore Creative Posts</h1>
              <p className="km-section__sub">Browse by tag and paginate through a modern masonry grid.</p>
            </div>
            <div className="km-controls">
              <button
                className="km-filterbtn"
                onClick={resetTag}
                aria-label="Clear filter"
                disabled={!activeTag}
              >
                <FiX /> Clear
              </button>
            </div>
          </div>

          <div className="km-chips km-chips--compact" role="tablist" aria-label="Tags">
            {tagPool.map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={activeTag === t}
                className={`km-chip km-chip--compact ${activeTag === t ? "is-active" : ""}`}
                onClick={() => handleSelectTag(t)}
              >
                <FiTag className="km-chip__check" />
                {t}
              </button>
            ))}
          </div>
        </header>

        <main>
          <AnimatePresence mode="wait">
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              {loading ? (
                <div className="km-empty">
                  <div className="km-empty__icon"><FiImage /></div>
                  <h3 className="km-empty__title">Loading works…</h3>
                  <p className="km-empty__text">Fetching from Supabase-backed API</p>
                </div>
              ) : error ? (
                <div className="km-empty">
                  <div className="km-empty__icon"><FiImage /></div>
                  <h3 className="km-empty__title">Failed to load</h3>
                  <p className="km-empty__text">{error}</p>
                </div>
              ) : current.length === 0 ? (
                <div className="km-empty">
                  <div className="km-empty__icon"><FiImage /></div>
                  <h3 className="km-empty__title">No results</h3>
                  <p className="km-empty__text">Try clearing filters or choosing another tag.</p>
                  <div className="km-empty__actions">
                    <button className="km-btn km-btn--minimal" onClick={resetTag}>
                      Reset Filters
                    </button>
                  </div>
                </div>
              ) : (
                <Masonry
                  breakpointCols={breakpointColumns}
                  className="km-masonry-grid"
                  columnClassName="km-masonry-grid__column"
                >
                  {current.map((post) => (
                    <article key={post.id} className="km-card km-card--hover">
                      <Link to={`/works/${post.id}`} className="km-card__media" aria-label={post.title}>
                        <img
                          src={post.image}
                          alt={post.title}
                          className="km-card__img"
                          loading="lazy"
                        />
                      </Link>
                      <div className="km-card__body">
                        <h3 className="km-card__title" title={post.title}>
                          {post.title}
                        </h3>
                        <div className="km-card__tags">
                          {post.tags.map((tg) => (
                            <button
                              key={tg}
                              className={`km-tag ${activeTag === tg ? "is-on" : ""}`}
                              onClick={() => handleSelectTag(tg as Tag)}
                              aria-label={`Filter by ${tg}`}
                            >
                              {tg}
                            </button>
                          ))}
                        </div>
                      </div>
                    </article>
                  ))}
                </Masonry>
              )}
            </motion.div>
          </AnimatePresence>

          <nav className="km-pager" aria-label="Pagination">
            <button
              className="km-iconbtn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={clampedPage <= 1}
              aria-label="Previous page"
            >
              <FiChevronLeft />
            </button>
            <div className="km-pager__info">
              Page {clampedPage} of {totalPages}
            </div>
            <button
              className="km-iconbtn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={clampedPage >= totalPages}
              aria-label="Next page"
            >
              <FiChevronRight />
            </button>
          </nav>
        </main>
      </div>
      <Footer />
    </>
  );
}
