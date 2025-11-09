// src/components/Navbar.tsx
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiMenu, FiX, FiUser, FiArrowUpRight } from "react-icons/fi";
import { FaSignOutAlt } from "react-icons/fa";
import logo from "../assets/logo.png";
import "./navbar.css";
import { useAuth } from "../contexts/AuthContext";

export default function Navbar() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, profile, loading, logout } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setProfileOpen(false);
    setDrawerOpen(false);
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
        setDrawerOpen(false);
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
    setDrawerOpen(false);
    navigate("/");
  };

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || "User";
  const initial = (displayName || "U").slice(0, 1).toUpperCase();
  const avatarUrl = (profile as any)?.avatarUrl || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const navLinks = [
    { label: "สำรวจผลงาน", path: "/" },
    { label: "สร้างผลงาน", path: "/works/new", requiresAuth: true },
  ];

  return (
    <>
      <nav className={`km-nav ${scrolled ? "is-scrolled" : ""}`} aria-label="Primary">
        <div className="km-nav__brand">
          <button
            className="km-nav__menu"
            aria-label="Toggle menu"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(v => !v)}
          >
            {drawerOpen ? <FiX /> : <FiMenu />}
          </button>
          <Link
            to="/"
            className="km-logo"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Go to home"
          >
            <img src={logo} alt="K-Merge" className="km-logo-img" />
          </Link>
        </div>

        <div className="km-nav__links">
          {navLinks.map(link => {
            if (link.requiresAuth && !user) return null;
            const isActive = location.pathname === link.path;
            return (
              <Link key={link.path} to={link.path} className={`km-navlink ${isActive ? "is-active" : ""}`}>
                {link.label}
              </Link>
            );
          })}
        </div>

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

      <div className={`km-mobile-drawer ${drawerOpen ? "is-open" : ""}`}>
        <div className="km-mobile-drawer__inner">
          <div className="km-mobile-drawer__group">
            {navLinks.map(link => {
              if (link.requiresAuth && !user) return null;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`km-mobile-link ${isActive ? "is-active" : ""}`}
                  onClick={() => setDrawerOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
          <div className="km-mobile-drawer__group">
            {!user ? (
              <Link to="/login" className="km-mobile-link" onClick={() => setDrawerOpen(false)}>
                เข้าสู่ระบบ
              </Link>
            ) : (
              <>
                <Link to="/works/new" className="km-mobile-link" onClick={() => setDrawerOpen(false)}>
                  โพสต์งาน
                </Link>
                <Link to="/profile" className="km-mobile-link" onClick={() => setDrawerOpen(false)}>
                  โปรไฟล์
                </Link>
                <button className="km-mobile-link km-mobile-link--logout" onClick={handleSignOut}>
                  <FaSignOutAlt />
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {(profileOpen || drawerOpen) && <div className="km-nav-overlay" onClick={() => { setProfileOpen(false); setDrawerOpen(false); }} />}
    </>
  );
}
