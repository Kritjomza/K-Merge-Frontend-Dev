import React from "react";
import { FaSearch } from "react-icons/fa";
import "./Home.css";

const Home: React.FC = () => {
  return (
    <main className="km-home">
      {/* Hero Section */}
      <header className="km-hero">
        <div className="km-hero__content">
          <h1 className="km-hero__title">K-Merge</h1>
          <p className="km-hero__desc">
            Discover portfolios and creative projects from KMUTT students.
            Showcase your talent and explore innovative ideas across disciplines.
          </p>

          <div className="km-search">
            <input
              type="text"
              placeholder="Search student works, projects, and portfolios..."
              className="km-search__input"
            />
            <button className="km-search__btn">
              <FaSearch />
            </button>
          </div>
        </div>
      </header>

      {/* Explore Section */}
      <section className="km-explore">
        <div className="km-explore__head">
          <h2 className="km-explore__title">Filter & Browse</h2>
          <p className="km-explore__subtitle">Explore work here</p>
        </div>

        <div className="km-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <article key={i} className="km-card">
              <div className="km-card__img">Image</div>
              <h3 className="km-card__title">Title</h3>
              <p className="km-card__desc">
                Body text for whatever you'd like to say. Add main takeaway points,
                quotes, anecdotes, or even a very short story.
              </p>
            </article>
          ))}
        </div>

        <div className="km-pagination">
          <button className="km-page-btn">←</button>
          <button className="km-page-btn">→</button>
        </div>
      </section>
    </main>
  );
};

export default Home;
