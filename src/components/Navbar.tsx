// src/components/Navbar.tsx
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import "./navbar.css";
import { useAuth } from "../contexts/AuthContext";
import { FaSignOutAlt } from "react-icons/fa";
import { FiHome, FiUser } from "react-icons/fi";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, profile, loading, logout } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
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
    setOpen(false);
    navigate("/");
  };

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || "User";
  const initial = (displayName || "U").slice(0, 1).toUpperCase();
  const avatarUrl = (profile as any)?.avatarUrl || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  return (
    <>
      <nav className={`km-nav ${scrolled ? 'is-scrolled' : ''}`} aria-label="Primary">
        <div className="km-nav__left">
          <Link to="/" className="km-iconbtn km-navbtn" aria-label="Home">
            <FiHome />
          </Link>
        </div>

        <div className="km-nav__center">
          <Link
            to="/"
            className="km-logo"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Go to Home"
          >
            <img src={logo} alt="K-Merge" className="km-logo-img" />
          </Link>
        </div>

        <div className="km-nav__right">
          {loading && <div className="km-avatar" style={{ visibility: 'hidden' }} />}
          {!loading && (
            <div className="km-profile" ref={menuRef}>
              <button
                className="km-avatar"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label="Open profile menu"
                onClick={() => setOpen(v => !v)}
              >
                {user ? (
                  avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" style={{width: '100%', height: '100%', borderRadius: '50%'}}/>
                  ) : (
                    <span className="km-avatar__initial">{initial}</span>
                  )
                ) : (
                  <FiUser aria-hidden="true" />
                )}
              </button>

              {open && (
                <div className="km-dropdown" role="menu" aria-label="Profile">
                  {user && (
                    <div className="km-dropdown__header">
                      <div className="km-avatar km-avatar--sm" aria-hidden="true">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" style={{width: '100%', height: '100%', borderRadius: '50%'}}/>
                        ) : (
                          <span className="km-avatar__initial">{initial}</span>
                        )}
                      </div>
                      <div className="km-user">
                        <div className="km-user__name">{displayName}</div>
                        <div className="km-user__sub">{user?.email}</div>
                      </div>
                    </div>
                  )}

                  <div className="km-dropdown__sep" />
                  {!user ? (
                    <Link to="/login" className="km-dropdown__item" role="menuitem" onClick={() => setOpen(false)}>
                      Login
                    </Link>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
      {open && <div className="km-nav-overlay" onClick={() => setOpen(false)} />}
    </>
  );
}
