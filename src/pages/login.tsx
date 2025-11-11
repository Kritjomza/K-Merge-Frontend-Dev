// src/pages/login.tsx
import { Link, useNavigate } from "react-router-dom";
import { useState, type FormEvent } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import "./login.css";

export default function Login() {
  const navigate = useNavigate();
  const { refetchUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Function for Google Sign-In
  const signInWithGoogle = () => {
    // In production, we must redirect to the backend domain.
    const API_BASE = (import.meta as any).env?.VITE_API_BASE as string | undefined;
    const url = API_BASE ? `${API_BASE}/auth/login` : `/auth/login`;
    window.location.href = url;
  };

  // Function for Email/Password Login
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`/auth/login/email`, { // Using proxy
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Invalid login credentials');
      }

      await refetchUser(); // Update global auth state
      navigate('/profile'); // Redirect to profile page

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="km-login-wrap">
        <div
          className="km-login-card"
          role="dialog"
          aria-labelledby="login-title"
          aria-modal="false"
        >
          <h1 id="login-title" className="km-login-title">
            เข้าสู่ระบบ / สร้างบัญชี
          </h1>

          <form className="km-form" onSubmit={onSubmit}>
            {/* --- ✅ START: Input fields --- */}
            <label className="km-field">
              <span className="km-label">อีเมลหรือชื่อผู้ใช้</span>
              <input
                type="email"
                className="km-input"
                inputMode="email"
                autoComplete="username"
                placeholder="name@student.kmutt.ac.th"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="อีเมลหรือชื่อผู้ใช้"
                required
              />
            </label>

            <label className="km-field">
              <span className="km-label">รหัสผ่าน</span>
              <div className="km-input-group">
                <input
                  type={showPw ? "text" : "password"}
                  className="km-input km-input--pw"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  aria-label="รหัสผ่าน"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="km-input-append"
                  aria-label={showPw ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  aria-pressed={showPw}
                  onClick={() => setShowPw((s) => !s)}
                >
                  {showPw ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </label>
            
            <div className="km-links">
              <Link className="km-link" to="/register">
                สร้างบัญชี
              </Link>
              <a className="km-link" href="#">
                ลืมรหัสผ่าน
              </a>
            </div>
            {/* --- ✅ END: Input fields --- */}

            {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
            
            <button type="submit" className="km-btn km-btn--brand km-btn--full" disabled={loading}>
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>

          <div className="km-divider"><span>หรือ</span></div>

          <button
            className="km-btn km-btn--minimal km-btn--full"
            onClick={signInWithGoogle}
          >
            {/* --- ✅ START: Google Icon and text --- */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              style={{ marginRight: 8 }}
            >
              <path d="M21.6 12.23c0-.74-.07-1.45-.2-2.13H12v4.03h5.4c-.23 1.25-.93 2.3-1.98 3l3.2 2.48c1.87-1.73 2.98-4.28 2.98-7.38Z" fill="#4285F4"/>
              <path d="M12 22c2.7 0 4.97-.9 6.62-2.44l-3.2-2.48c-.88.6-2.01.95-3.42.95-2.63 0-4.85-1.77-5.64-4.15H2.98v2.6C4.62 19.98 8.04 22 12 22Z" fill="#34A853"/>
              <path d="M6.36 13.88c-.2-.6-.32-1.25-.32-1.88s.12-1.28.32-1.88V7.52H2.98A9.94 9.94 0 0 0 2 12c0 1.6.39 3.1 1.08 4.48l3.28-2.6Z" fill="#FBBC05"/>
              <path d="M12 6.37c1.47 0 2.79.5 3.83 1.46l2.87-2.87C16.95 3.33 14.68 2.4 12 2.4 8.04 2.4 4.62 4.42 2.98 7.52l3.38 2.6C7.15 8.14 9.37 6.37 12 6.37Z" fill="#EA4335"/>
            </svg>
            เข้าสู่ระบบด้วย Google
            {/* --- ✅ END: Google Icon and text --- */}
          </button>
        </div>
      </main>
      <Footer />
    </>
  );
}
