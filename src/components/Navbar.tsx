// src/components/Navbar.tsx
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiArrowUpRight } from "react-icons/fi";
import { FaSignOutAlt } from "react-icons/fa";
import logo from "../assets/logo.png";
import "./navbar.css";
import { useAuth } from "../contexts/AuthContext";

export default function Navbar() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, profile, loading, logout } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setProfileOpen(false);
      }
    };
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const handleSignOut = async () => {
    await logout();
    setProfileOpen(false);
    navigate("/");
  };

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || "User";
  const initial = (displayName || "U").slice(0, 1).toUpperCase();
  const avatarUrl = (profile as any)?.avatarUrl || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  // const navLinks = [
  //   { label: "สำรวจผลงาน", path: "/" },
  //   { label: "สร้างผลงาน", path: "/works/new", requiresAuth: true },
  // ];

  return (
    <>
      <nav className={`km-nav ${scrolled ? "is-scrolled" : ""}`} aria-label="Primary">
        <div className="km-nav__brand">
          <Link
            to="/"
            className="km-logo"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Go to home"
          >
            <img src={logo} alt="K-Merge" className="km-logo-img" />
          </Link>
        </div>

        {/* <div className="km-nav__links">
          {navLinks.map(link => {
            if (link.requiresAuth && !user) return null;
            const isActive = location.pathname === link.path;
            return (
              <Link key={link.path} to={link.path} className={`km-navlink ${isActive ? "is-active" : ""}`}>
                {link.label}
              </Link>
            );
          })}
        </div> */}

        <div className="km-nav__actions">
          {!user && !loading && (
            <Link to="/login" className="km-btn km-btn--ghost">
              เข้าสู่ระบบ
            </Link>
          )}
          {user && (
            <Link to="/works/new" className="km-btn km-btn--primary">
              โพสต์งาน <FiArrowUpRight />
            </Link>
          )}

          {user && (
            <div className="km-profile" ref={menuRef}>
              <button
                className="km-avatar"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                aria-label="Open profile menu"
                onClick={() => setProfileOpen(v => !v)}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", borderRadius: "50%" }} />
                ) : (
                  <span className="km-avatar__initial">{initial}</span>
                )}
              </button>

              {profileOpen && (
                <div className="km-dropdown" role="menu" aria-label="Profile">
                  <div className="km-dropdown__header">
                    <div className="km-avatar km-avatar--sm" aria-hidden="true">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", borderRadius: "50%" }} />
                      ) : (
                        <span className="km-avatar__initial">{initial}</span>
                      )}
                    </div>
                    <div className="km-user">
                      <div className="km-user__name">{displayName}</div>
                      <div className="km-user__sub">{user?.email}</div>
                    </div>
                  </div>

                  <div className="km-dropdown__sep" />
                  <Link to="/works/new" className="km-dropdown__item" role="menuitem">
                    Create new post
                  </Link>
                  <Link to="/profile" className="km-dropdown__item" role="menuitem">
                    Profile
                  </Link>
                  <button className="km-dropdown__item km-dropdown__item--logout" role="menuitem" onClick={handleSignOut}>
                    <FaSignOutAlt className="km-dropdown__icon-fa" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {profileOpen && <div className="km-nav-overlay" onClick={() => setProfileOpen(false)} />}
    </>
  );
}
