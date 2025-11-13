import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaShieldAlt } from "react-icons/fa";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../contexts/AuthContext";
import "./AdminLogin.css";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { refetchUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const buttonLabel = useMemo(
    () => (loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบผู้ดูแล"),
    [loading]
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setStatus(null);
    setLoading(true);

    try {
      // ✅ เรียก API Login ไป backend
      const response = await fetch("/auth/login/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "เข้าสู่ระบบไม่สำเร็จ");
      }

      setStatus("เข้าสู่ระบบสำเร็จ กำลังโหลดข้อมูลผู้ใช้...");

      // ✅ โหลดข้อมูลผู้ใช้หลัง login
      await refetchUser();

      // ✅ ไปหน้า dashboard
      navigate("/admin", { replace: true });

    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="admin-login-page">
        <div
          className="admin-login-card"
          role="form"
          aria-labelledby="admin-login-title"
        >
          <div className="admin-login-hero">
            <div className="hero-icon">
              <FaShieldAlt size={28} />
            </div>
            <div>
              <p className="eyebrow">K-Merge Admin Portal</p>
              <h1 id="admin-login-title">ยืนยันตัวตนผู้ดูแลระบบ</h1>
              <p className="subtitle">
                สำหรับทีมงาน K-Merge เท่านั้น โปรดใช้บัญชีที่ได้รับอนุมัติ
                เพื่อจัดการคอนเทนต์และผู้ใช้งาน
              </p>
            </div>
          </div>

          <form className="admin-login-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>อีเมลผู้ดูแล</span>
              <input
                type="email"
                placeholder="admin@kmerge.com"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>รหัสผ่าน</span>
              <div className="password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="toggle-visibility"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </label>

            {status && <p className="status-msg">{status}</p>}
            {error && (
              <p className="error-msg" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="admin-login-btn" disabled={loading}>
              {buttonLabel}
            </button>
          </form>

          <div className="admin-login-footer">
            <Link to="/login">กลับไปหน้าเข้าสู่ระบบปกติ</Link>
            <span>หากต้องการสิทธิ์ผู้ดูแล โปรดติดต่อทีม K-Merge</span>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
