import { useRef, useState, useEffect } from "react";
import { FaFacebookF, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import "./profile.css";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

type UserProfile = {
  id: string;
  email?: string | null;
  user_metadata?: {
    full_name?: string;
    name?: string;
    picture?: string;
    location?: string;
    bio?: string;
  };
};

export default function Profile() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);

  // Load user profile
  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/auth/me", { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setUser(json?.user ?? null);
      // Set avatar if available from user metadata
      if (json?.user?.user_metadata?.picture) {
        setAvatarUrl(json.user.user_metadata.picture);
      }
    } catch (e) {
      console.error("loadUserProfile failed:", e);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, []);

  const onPickImage = () => fileRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
      
      // TODO: Implement image upload to backend/storage
      // const formData = new FormData();
      // formData.append('avatar', file);
      // await fetch('/api/profile/avatar', {
      //   method: 'POST',
      //   credentials: 'include',
      //   body: formData
      // });
      
      // Refresh profile after upload
      // await loadUserProfile();
    } catch (error) {
      console.error('Failed to upload image:', error);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="profile-page">
          <div className="loading">Loading profile...</div>
        </div>
      </>
    );
  }

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || "Guest";

  return (
    <>
      <Navbar />
      <div className="profile-page">
        <div className="profile-card">
          {/* ===== Left card ===== */}
          <aside className="profile-left">
            <Link to="/edit-profile">
            <button className="edit-btn">Edit</button>
            </Link>

            <div
              className="avatar-wrap"
              onClick={onPickImage}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onPickImage()}
            >
              {avatarUrl ? (
                <img className="avatar" src={avatarUrl} alt="Profile" />
              ) : (
                <div className="avatar-placeholder">Add photo</div>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden-file"
                onChange={onFileChange}
              />
            </div>

            <div className="two-codes">
              <span className="code">{user?.id?.slice(0, 6) || "XXXXXX"}</span>
              <span className="code">{user?.id?.slice(-6) || "XXXXXX"}</span>
            </div>

            <div className="profile-left-bottom">
              <div className="socials">
                <a href="#" className="social" aria-label="facebook">
                  <FaFacebookF />
                </a>
                <a href="#" className="social" aria-label="instagram">
                  <FaInstagram />
                </a>
                <a href="#" className="social" aria-label="linkedin">
                  <FaLinkedinIn />
                </a>
              </div>
              <div className="copy">Copyright ©2025 All rights reserved</div>
            </div>
          </aside>

          {/* ===== Right content ===== */}
          <section className="profile-right">
            <h1 className="title">{displayName}</h1>
            <h2 className="subtitle">
              {user?.user_metadata?.location ? `From ${user.user_metadata.location}` : "Location not set"}
            </h2>
            <p className="bio">
              {user?.user_metadata?.bio || "No bio available. Click edit to add your bio."}
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
