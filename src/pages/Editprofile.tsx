import React, { useRef, useState } from "react";
import "./EditProfile.css";
import logo from "../assets/logo.png";
import { FaTrash } from "react-icons/fa"; // 🗑️ เพิ่ม icon ถังขยะ
import Navbar from "../components/Navbar";

export default function EditProfile() {
  const [avatar, setAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePickImage = () => fileInputRef.current?.click();
  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatar(URL.createObjectURL(file));
  };


  type Platform = "facebook" | "instagram" | "x" | "linkedin" | "website";
  const ALL_PLATFORMS: Record<Platform, { label: string; placeholder: string }> = {
    facebook: { label: "Facebook", placeholder: "https://facebook.com/" },
    instagram: { label: "Instagram", placeholder: "https://instagram.com/" },
    x: { label: "X (Twitter)", placeholder: "https://twitter.com/" },
    linkedin: { label: "LinkedIn", placeholder: "https://linkedin.com/in/" },
    website: { label: "Website", placeholder: "https://yourwebsite.com/" },
  };


  const [links, setLinks] = useState<Platform[]>(["facebook", "instagram"]);

  const addLink = (platform: Platform) => {
    setLinks((prev) => [...prev, platform]);
  };

  const removeLink = (platform: Platform) => {
    setLinks((prev) => prev.filter((p) => p !== platform));
  };

  const availablePlatforms = (Object.keys(ALL_PLATFORMS) as Platform[]).filter(
    (p) => !links.includes(p)
  );


  return (
    <div className="edit-bg">
      <div className="edit-container">
        {/* ✅ โลโก้ตรงกลาง */}
        <div className="edit-logo">
          <img src={logo} alt="K-Merge logo" className="logo-img" />
        </div>

        

        {/* กล่องฟอร์ม */}
        <div className="edit-card">
            <h2 className="km-login__title">ข้อมูลบัญชี</h2>

          <div className="edit-avatar">
            <img
              src={avatar ?? "https://ui-avatars.com/api/?name=KM&background=F59E0B&color=fff"}
              alt="avatar"
            />

            <button type="button" className="edit-btn" onClick={handlePickImage}>
              edit picture
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImage}
              hidden
            />
          </div>

          <form className="edit-form">
            <label>ชื่อผู้ใช้</label>
            <input type="text" placeholder="ชื่อผู้ใช้" />

            <label>อีเมลที่ติดต่อได้</label>
            <input type="email" placeholder="xxxx@gmail.com" />

            <label>รหัสผ่าน</label>
            <input type="password" placeholder="รหัสผ่าน" />

            <label>ยืนยันรหัสผ่าน</label>
            <input type="password" placeholder="ยืนยันรหัสผ่าน" />

            <label>เบอร์โทรศัพท์</label>
            <input type="text" placeholder="09x-xxx-xxxx" />

            <label>ช่องทางการติดต่อเพิ่มเติม</label>
            <div className="contact-box">
              {links.map((platform) => (
                <div key={platform} className="contact-row">
                  <label>{ALL_PLATFORMS[platform].label}</label>
                  <input
                    type="url"
                    placeholder={ALL_PLATFORMS[platform].placeholder}
                  />
                  <button
                    type="button"
                    onClick={() => removeLink(platform)}
                    className="trash-btn"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              ))}

              {availablePlatforms.length > 0 && (
                <div className="add-contact">
                  <select
                    onChange={(e) => {
                      if (e.target.value) addLink(e.target.value as Platform);
                      e.target.value = "";
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>
                      เพิ่มช่องทางการติดต่อ 
                    </option>
                    {availablePlatforms.map((p) => (
                      <option key={p} value={p}>
                        {ALL_PLATFORMS[p].label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="edit-actions">
              <button type="button" className="cancel-btn">ยกเลิก</button>
              <button type="submit" className="save-btn">บันทึกการแก้ไข</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}