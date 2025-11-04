import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Editprofile.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../contexts/AuthContext";

type TabKey = "account" | "contact";

export default function EditProfile() {
  const [tab, setTab] = useState<TabKey>("account");
  const [avatar, setAvatar] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const { user, refetchUser } = useAuth();

  // ----- form states -----
  const [username, setUsername] = useState(user?.user_metadata?.username || "");
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
  const [aboutMe, setAboutMe] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [phoneTH, setPhoneTH] = useState("");
  const [loading, setLoading] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(true);

  // basic validations (front-end only)
  const emailValid = useMemo(() => {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, [email]);
  const fullNameValid = useMemo(() => fullName.trim().length >= 2, [fullName]);
  // const _usernameValid = useMemo(() => {
  //   const l = username.trim().length;
  //   return l === 0 || l >= 2;
  // }, [username]);
  const aboutValid = useMemo(() => {
    const l = aboutMe.trim().length;
    return l === 0 || l >= 10;
  }, [aboutMe]);
  // Thai phone (mobile): 0[6|8|9]XXXXXXXX OR +66[6|8|9]XXXXXXXX
  const phoneValid = useMemo(() => {
    if (!phoneTH) return true;
    return /^(0[689]\d{8}|\+66[689]\d{8})$/.test(phoneTH.replace(/\s|-/g, ""));
  }, [phoneTH]);

  // Prefill from Profile table via backend
  useEffect(() => {
    (async () => {
      try {
        setPrefillLoading(true);
        const res = await fetch("/auth/profile", { credentials: "include" });
        if (res.ok) {
          const p = await res.json();
          if (p) {
            setFullName(p.displayName || user?.user_metadata?.full_name || "");
            setAboutMe(p.bio || "");
            setPhoneTH(p.contact || "");
            setAvatar(p.avatarUrl || null);
          }
        }
      } catch {}
      finally {
        setPrefillLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickImage = () => fileRef.current?.click();
  const compressImage = async (
    file: File,
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.8
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Failed to get canvas context"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const onImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      const compressed = await compressImage(file);
      setAvatar(compressed);
    } catch (error) {
      console.error("Error compressing image:", error);
      alert("อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => setAvatar(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload: Record<string, any> = {};
      const nameClean = fullName.trim();
      const aboutClean = aboutMe.trim();
      const phoneClean = phoneTH.replace(/\s|-/g, "").trim();
      if (nameClean) payload.displayName = nameClean;
      if (aboutClean) payload.bio = aboutClean;
      if (phoneClean) payload.contact = phoneClean;
      if (avatar) payload.avatar = avatar;

      const res = await fetch("/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update profile");

      await refetchUser();
      alert("บันทึกสำเร็จ");
      navigate("/profile");
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ep-bg">
      <Navbar />
      <main className="ep-shell">
        <aside className="ep-sidebar">
          <nav className="ep-nav">
            <button
              className={`ep-nav__item ${tab === "account" ? "is-active" : ""}`}
              onClick={() => setTab("account")}
            >
              ข้อมูลบัญชี
            </button>
            <button
              className={`ep-nav__item ${tab === "contact" ? "is-active" : ""}`}
              onClick={() => setTab("contact")}
            >
              ข้อมูลติดต่อ
            </button>
          </nav>
        </aside>

        <section className="ep-content">
          <form className="ep-card" onSubmit={onSubmit}>
            <div className="ep-block">
              <div className="ep-block__title">รูปโปรไฟล์</div>
              <div className="ep-avatar">
                <img
                  src={
                    avatar ??
                    "https://ui-avatars.com/api/?name=KM&background=F59E0B&color=ffffff"
                  }
                  alt="avatar"
                />
                <div className="ep-avatar__actions">
                  <button type="button" className="btn btn-primary" onClick={pickImage}>
                    เลือกรูป
                  </button>
                  {avatar && (
                    <button type="button" className="btn btn-ghost" onClick={clearImage}>
                      ลบรูป
                    </button>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" onChange={onImage} hidden />
                </div>
                <p className="ep-help">รองรับ JPG/PNG แนะนำอย่างน้อย 400x400px</p>
              </div>
            </div>

            {tab === "account" && (
              <div className="ep-block">
                <div className="ep-block__title">ข้อมูลบัญชี</div>
                <div className="ep-grid">
                  <div className="ep-field">
                    <label htmlFor="username">Username</label>
                    <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
                  </div>
                  <div className="ep-field">
                    <label htmlFor="fullname">Full Name</label>
                    <input id="fullname" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} aria-invalid={!fullNameValid} />
                  </div>
                  <div className="ep-field ep-field--full">
                    <label htmlFor="about">About Me</label>
                    <textarea id="about" rows={5} value={aboutMe} onChange={(e) => setAboutMe(e.target.value)} aria-invalid={!aboutValid} />
                    <div className="ep-hint-row">
                      <span className="ep-hint">แนะนำ 160–500 ตัวอักษร</span>
                      <span className="ep-count">{aboutMe.length}/500</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === "contact" && (
              <div className="ep-block">
                <div className="ep-block__title">ข้อมูลติดต่อ</div>
                <div className="ep-grid">
                  <div className="ep-field">
                    <label htmlFor="email">อีเมล</label>
                    <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!emailValid} />
                    {!emailValid && <p className="ep-error">อีเมลไม่ถูกต้อง</p>}
                  </div>
                  <div className="ep-field">
                    <label htmlFor="phone">เบอร์โทร (ไทย)</label>
                    <input id="phone" type="tel" value={phoneTH} onChange={(e) => setPhoneTH(e.target.value)} aria-invalid={!phoneValid} />
                    {!phoneValid && <p className="ep-error">รูปแบบเบอร์โทรไม่ถูกต้อง</p>}
                  </div>
                </div>
              </div>
            )}

            <div className="ep-actions">
              <button type="button" className="btn btn-ghost" onClick={() => window.history.back()}>
                ยกเลิก
              </button>
              <button type="submit" className="btn btn-primary" disabled={prefillLoading || !emailValid || !phoneValid || loading}>
                {loading ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
              </button>
            </div>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
}
