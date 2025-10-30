import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "./App.css";

type Chip = string;

type Card = {
  id: string | number;
  title: string;
  body: string;
  tags: Chip[];
  thumb?: string | null;
};

export default function App() {
  const navigate = useNavigate();
  const [realCards, setRealCards] = useState<Card[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/works', { credentials: 'include' });
        if (!res.ok) throw new Error(await res.text());
        const works = await res.json();
        const cards: Card[] = (works || []).map((w: any) => ({
          id: w.workId || w.id,
          title: w.title,
          body: w.description || '',
          tags: (w.tags || []).map((t: any) => t.name),
          thumb: w.thumbnail || null,
        }));
        setRealCards(cards);
      } catch (e) {
        // ignore errors in splash page
      }
    })();
  }, []);
  // Dynamic tag pool from loaded works
  const TAGS: Chip[] = useMemo(() => {
    const set = new Set<string>();
    realCards.forEach((c) => c.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [realCards]);

  // ===== UI state =====
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<Chip>>(new Set());
  const [sort, setSort] = useState<"popular" | "newest" | "featured">("popular");

  // Toggle เลือก/ยกเลิกแท็ก
  const toggleTag = (tag: Chip) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  };

  const clearAll = () => setSelected(new Set());

  // ===== Filter + Search + Sort =====
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    let data = realCards;

    // search
    if (query) {
      data = data.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.body.toLowerCase().includes(query) ||
          c.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    // tag filter: ต้อง “มีครบทุกอันที่เลือก” (AND)
    if (selected.size > 0) {
      data = data.filter((c) =>
        Array.from(selected).every((t) => c.tags.includes(t))
      );
    }

    // sort (เดโม่)
    if (sort === "newest") data = [...data].reverse();
    if (sort === "featured") data = data.slice(0, 6);

    return data;
  }, [q, selected, realCards, sort]);

  return (
    <>
      <Navbar />

      <main className="km-wrap">
        {/* ===== Hero (คงสีเดิม) ===== */}
        <section className="km-hero" aria-labelledby="hero-title">
          <div className="km-hero__inner fade-in-up">
            <h1 id="hero-title" className="km-hero__title">
              K-Merge
            </h1>
            <p className="km-hero__subtitle">
              Discover amazing portfolios from KMUTT students. Showcase your
              talent and explore innovative projects.
            </p>

            {/* Search - responsive */}
            <form
              className="km-search"
              onSubmit={(e) => e.preventDefault()}
              role="search"
              aria-label="Sitewide"
            >
              <input
                className="km-search__input"
                placeholder="Search student works, projects, and portfolios…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Search"
              />
              <button className="km-search__btn" type="submit">
                <span>Search</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M21 21l-4.2-4.2M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </form>
          </div>
        </section>

        {/* ===== Browse + Filters ===== */}
        <section className="km-section" aria-labelledby="browse-title">
          <div className="km-section__head">
            <div>
              <h3 id="browse-title" className="km-section__title">
                Browse
              </h3>
              <p className="km-section__sub">Explore work here</p>
            </div>

            <div className="km-controls">
              <button type="button" className="km-filterbtn" aria-label="Filters">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 7h16M7 12h10M10 17h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Filters
              </button>

              <button type="button" className="km-clear" onClick={clearAll} disabled={selected.size === 0}>
                Clear all
              </button>

              <div className="km-sort">
                <label className="sr-only" htmlFor="sort">Sort by</label>
                <select
                  id="sort"
                  className="km-sort__select"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as any)}
                >
                  <option value="popular">Popular</option>
                  <option value="newest">Newest</option>
                  <option value="featured">Featured</option>
                </select>
              </div>
            </div>
          </div>

          {/* Chips (compact, selectable) */}
          <div className="km-chips km-chips--compact" role="group" aria-label="Active filters">
            {TAGS.map((tag) => {
              const active = selected.has(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  className={`km-chip km-chip--compact ${active ? "is-active" : ""}`}
                  aria-pressed={active}
                  onClick={() => toggleTag(tag)}
                >
                  {active && (
                    <svg className="km-chip__check" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )}
                  {tag}
                  {active && <span className="km-chip__x" aria-hidden>×</span>}
                </button>
              );
            })}
          </div>

          {/* Cards */}
          {filtered.length > 0 ? (
            <div className="km-grid" aria-live="polite">
              {filtered.map((c, idx) => (
                <article
                  key={c.id}
                  className="km-card fade-in-up"
                  style={{ animationDelay: `${Math.min(idx, 6) * 60}ms` }}
                  onClick={() => navigate(`/works/${c.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate(`/works/${c.id}`)}
                >
                  <div className="km-card__thumb" aria-hidden="true">
                    {c.thumb ? (
                      <img src={c.thumb} alt="thumbnail" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                    ) : (
                      <div className="km-thumb__shape" />
                    )}
                  </div>
                  <div className="km-card__body">
                    <h4 className="km-card__title">{c.title}</h4>
                    <p className="km-card__text">{c.body}</p>
                    <div className="km-card__tags">
                      {c.tags.map((t) => (
                        <span
                          key={t}
                          className={`km-tag ${selected.has(t) ? "is-on" : ""}`}
                          onClick={() => toggleTag(t)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggleTag(t)}
                          aria-pressed={selected.has(t)}
                          title={`Filter by ${t}`}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="km-empty">
              <div className="km-empty__icon" aria-hidden="true">🔎</div>
              <h4 className="km-empty__title">No results</h4>
              <p className="km-empty__text">
                Try a different keyword or clear filters to see more results.
              </p>
              <div className="km-empty__actions">
                <button className="km-btn km-btn--minimal" onClick={() => setQ("")}>
                  Clear search
                </button>
                <button className="km-btn km-btn--minimal" onClick={clearAll} disabled={selected.size === 0}>
                  Clear filters
                </button>
              </div>
            </div>
          )}

          {/* Pagination (placeholder) */}
          <div className="km-pager" role="navigation" aria-label="Pagination">
            <button className="km-iconbtn" aria-label="Previous" disabled>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <span className="km-pager__info">Page 1 of 3</span>
            <button className="km-iconbtn" aria-label="Next">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}




