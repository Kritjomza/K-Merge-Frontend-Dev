import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FaFacebookF, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import "./profile.css";
import Navbar from "../components/Navbar";
import { useAuth } from "../contexts/AuthContext";
import { apiGet } from "../lib/api";
type TabKey = "saved" | "posts";

type Card = {
  id: string | number;
  title: string;
  excerpt: string;
  tags: string[];
  thumb?: string | null;
  created_at?: string;
  updated_at?: string;
  status?: 'draft' | 'published';
  savedAt?: string | null;
};

type TagItem = { tagId?: string; name: string };
type EditMedia = { id?: string; dataUrl?: string; previewUrl: string; alttext?: string };

export default function Profile() {
  const { user, loading, refetchUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("saved");
  const [profile, setProfile] = useState<any | null>(null);
  const [saved, setSaved] = useState<Card[]>([]);
  const [savedLoading, setSavedLoading] = useState<boolean>(false);
  const [savedError, setSavedError] = useState<string | null>(null);
  const [posts, setPosts] = useState<Card[]>([]);
  const [editing, setEditing] = useState<null | {
    id: string | number;
    title: string;
    excerpt: string;
    status: 'draft' | 'published';
    tags: TagItem[];
    media: EditMedia[];
  }>(null);
  const [busy, setBusy] = useState<boolean>(false);
  const [tagQuery, setTagQuery] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState<TagItem[]>([]);
  const imagePickerRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let active = true;
    (async () => {
      if (!user) {
        setPosts([]);
        return;
      }
      try {
        const res = await fetch('/works/my', { credentials: 'include' });
        if (!res.ok) return;
        const works = await res.json();
        if (!active) return;
        const mapped: Card[] = (works || []).map((w: any) => ({
          id: w.workId || w.id,
          title: w.title,
          excerpt: w.description || '',
          tags: (w.tags || []).map((t: any) => t.name),
          thumb: w.thumbnail || null,
        }));
        setPosts(mapped);
      } catch {}
    })();
    return () => { active = false; };
  }, [user]);

  const fetchSaved = useCallback(async () => {
    if (!user) {
      setSaved([]);
      return;
    }
    setSavedLoading(true);
    setSavedError(null);
    try {
      const res = await fetch('/works/saved', { credentials: 'include' });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Unable to load saved works');
      }
      const works = await res.json();
      const mapped: Card[] = (works || []).map((w: any) => ({
        id: w.workId || w.id,
        title: w.title,
        excerpt: w.description || '',
        tags: (w.tags || []).map((t: any) => t.name),
        thumb: w.thumbnail || null,
        created_at: w.created_at,
        updated_at: w.updatedAt,
        status: w.status,
        savedAt: w.savedAt || w.saved_at || null,
      }));
      setSaved(mapped);
    } catch (err: any) {
      setSaved([]);
      setSavedError(err?.message || 'Unable to load saved works');
    } finally {
      setSavedLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  useEffect(() => {
    if (tab === 'saved' && !saved.length && !savedLoading && !savedError) {
      fetchSaved();
    }
  }, [tab, saved.length, savedLoading, savedError, fetchSaved]);

  // Load Profile row for display
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/auth/profile', { credentials: 'include' });
        if (res.ok) {
          setProfile(await res.json());
        }
      } catch {}
    })();
  }, []);

  const onPickImage = () => fileRef.current?.click();
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
    // Upload to Supabase via backend, then refresh profile
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || '');
      if (!dataUrl.startsWith('data:image')) return;
      try {
        const res = await fetch('/auth/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ avatar: dataUrl }),
        });
        if (!res.ok) {
          const txt = await res.text();
          console.error('Avatar update failed:', txt);
        }
        // Re-fetch profile to get signed avatar URL from server
        try {
          const profRes = await fetch('/auth/profile', { credentials: 'include' });
          if (profRes.ok) setProfile(await profRes.json());
          // also refresh global auth context so Navbar gets updated avatar
          await refetchUser();
        } catch {}
      } catch (err) {
        console.error('Failed to upload avatar', err);
      } finally {
        // clear the input value to allow re-uploading same file later
        if (e.currentTarget) e.currentTarget.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="profile-page"><div className="loading">Loading Profile...</div></div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="profile-page">
          <div className="empty-state">
            <h3>Please sign in</h3>
            <p>
              You need to <Link to="/login">log in</Link> to see your profile.
            </p>
          </div>
        </div>
      </>
    );
  }

  const displayName =
    (profile && profile.displayName) ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email ||
    "User";

  const avatarUrl =
    avatarPreview ||
    // Profile table (handle different column casings just in case)
    (profile && (profile.avatarUrl || profile.avatarurl || profile.avatar_url)) ||
    // Metadata fallbacks
    (user.user_metadata && (user.user_metadata.avatar_url || user.user_metadata.picture)) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=F59E0B&color=fff`;

  const locationText =
    user.user_metadata?.location || "KMUTT, Thailand";

  const bioText =
    (profile && profile.bio) ||
    user.user_metadata?.bio ||
    "Tell people who you are, what you are building, and what you are excited about.";
  const activeList = tab === "saved" ? saved : posts;
  const showSavedSpinner = tab === 'saved' && savedLoading && saved.length === 0;

  const onDelete = async (id: string | number) => {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    try {
      setBusy(true);
      const res = await fetch(`/works/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) {
        const txt = await res.text();
        alert(txt || 'Failed to delete');
        return;
      }
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch (e: any) {
      alert(e?.message || 'Failed to delete');
    } finally {
      setBusy(false);
    }
  };

  const startEdit = async (item: Card) => {
    try {
      setBusy(true);
      const detail = await apiGet<any>(`/works/${item.id}`);
      const media: EditMedia[] = (detail.media || []).map((m: any) => ({
        id: m.id,
        previewUrl: m.fileurl,
        alttext: m.alttext || '',
      }));
      setEditing({
        id: item.id,
        title: detail.title || item.title,
        excerpt: detail.description || item.excerpt || '',
        status: (detail.status as 'draft' | 'published') || 'draft',
        tags: (detail.tags || []).map((t: any) => ({ tagId: t.tagId, name: t.name })),
        media,
      });
    } catch (e: any) {
      alert(e?.message || 'Failed to load work');
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    const { id, title, excerpt, status, tags, media } = editing;
    if (!String(title).trim()) {
      alert('Title is required');
      return;
    }
    try {
      setBusy(true);
      const body: any = {
        title: title.trim(),
        description: excerpt,
        status,
        tagIds: tags.filter(t => !!t.tagId).map(t => t.tagId),
        newTags: tags.filter(t => !t.tagId).map(t => t.name),
        media: media.map(m => (m.dataUrl ? { dataUrl: m.dataUrl, alttext: m.alttext } : { id: m.id, alttext: m.alttext })),
      };
      const res = await fetch(`/works/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const txt = await res.text();
        alert(txt || 'Failed to update');
        return;
      }
      const fresh = await apiGet<any>(`/works/${id}`);
      setPosts(prev => prev.map(p => (p.id === id ? {
        ...p,
        title: fresh.title || title,
        excerpt: fresh.description || excerpt,
        tags: (fresh.tags || []).map((t: any) => t.name),
        thumb: fresh.thumbnail || (editing.media[0]?.previewUrl || null),
      } : p)));
      setEditing(null);
    } catch (e: any) {
      alert(e?.message || 'Failed to update');
    } finally {
      setBusy(false);
    }
  };

  // --- Tag suggestions (debounced) ---
  useEffect(() => {
    let cancelled = false;
    const h = setTimeout(async () => {
      if (!tagQuery.trim()) {
        setTagSuggestions([]);
        return;
      }
      try {
        const res = await fetch(`/works/meta/tags?q=${encodeURIComponent(tagQuery)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setTagSuggestions((data || []).map((t: any) => ({ tagId: t.tagId, name: t.name })));
      } catch {}
    }, 200);
    return () => { cancelled = true; clearTimeout(h); };
  }, [tagQuery]);

  const addTagByName = (name: string) => {
    if (!editing) return;
    const n = name.trim();
    if (!n) return;
    if (editing.tags.some(t => t.name.toLowerCase() === n.toLowerCase())) return;
    const existing = tagSuggestions.find(s => s.name.toLowerCase() === n.toLowerCase());
    setEditing({ ...editing, tags: [...editing.tags, existing || { name: n }] });
    setTagQuery("");
    setTagSuggestions([]);
  };
  const removeTag = (name: string) => {
    if (!editing) return;
    setEditing({ ...editing, tags: editing.tags.filter(t => t.name !== name) });
  };

  // --- Media helpers ---
  const onPickEditImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editing) return;
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result);
        setEditing((prev) => prev ? ({
          ...prev,
          media: [...prev.media, { dataUrl, previewUrl: dataUrl, alttext: f.name }],
        }) : prev);
      };
      reader.readAsDataURL(f);
    });
    e.currentTarget.value = "";
  };
  const removeMedia = (idx: number) => {
    if (!editing) return;
    setEditing({ ...editing, media: editing.media.filter((_, i) => i !== idx) });
  };
  const setAsThumbnail = (idx: number) => {
    if (!editing) return;
    if (idx === 0) return;
    const next = [...editing.media];
    const [itm] = next.splice(idx, 1);
    next.unshift(itm);
    setEditing({ ...editing, media: next });
  };

  const formatSavedTimestamp = (value?: string | null) => {
    if (!value) return 'recently';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'recently';
    return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(d);
  };

  return (
    <>
      <Navbar />
      <div className="profile-page">
        <div className="profile-card">
          {/* ===== Left: Profile panel ===== */}
          <aside className="profile-left">
            <Link to="/edit-profile" className="edit-btn" aria-label="Edit profile">
              Edit
            </Link>

            <div
              className="avatar-wrap"
              onClick={onPickImage}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onPickImage()}
              aria-label="Upload new avatar"
            >
              <img
                className="avatar"
                src={avatarUrl}
                alt={`${displayName} avatar`}
                onError={(e) => {
                  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=F59E0B&color=fff`;
                  if (e.currentTarget.src !== fallback) {
                    e.currentTarget.src = fallback;
                  }
                }}
              />
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden-file"
                onChange={onFileChange}
              />
            </div>

            <div className="username">
              <span className="code" title={displayName}>{displayName}</span>
            </div>

            <div className="meta">
              <div className="meta-item"><span>Location</span><strong>{locationText}</strong></div>
              <div className="meta-item">
                <span>Email</span>
                <strong title={user.email || ""}>{user.email || "â€”"}</strong>
              </div>
              <div className="meta-item"><span>Member since</span><strong>{user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}</strong></div>
            </div>

            <div className="bio-left">
              <p>{bioText}</p>
            </div>

            <div className="socials">
              <a href="#" className="social" aria-label="facebook"><FaFacebookF /></a>
              <a href="#" className="social" aria-label="instagram"><FaInstagram /></a>
              <a href="#" className="social" aria-label="linkedin"><FaLinkedinIn /></a>
            </div>

            <div className="copy">Â© {new Date().getFullYear()} All rights reserved</div>
          </aside>

          {/* ===== Right: Content (Saved / Posts) ===== */}
          <section className="profile-right">
            <div className="header-block">
              <h1 className="title">{displayName}</h1>
              <h2 className="subtitle">From {locationText}</h2>
            </div>

            {/* Tabs */}
            <div className="tabbar" role="tablist" aria-label="Profile sections">
              <button
                role="tab"
                aria-selected={tab === "saved"}
                className={`tab ${tab === "saved" ? "is-active" : ""}`}
                onClick={() => setTab("saved")}
              >
                Saved <span className="badge">{saved.length}</span>
              </button>
              <button
                role="tab"
                aria-selected={tab === "posts"}
                className={`tab ${tab === "posts" ? "is-active" : ""}`}
                onClick={() => setTab("posts")}
              >
                Posts <span className="badge">{posts.length}</span>
              </button>
            </div>

            {tab === 'saved' && savedError && (
              <div className="alert" role="alert">{savedError}</div>
            )}

            {showSavedSpinner ? (
              <div className="loading">Loading saved works…</div>
            ) : activeList.length ? (
              <div className="grid" aria-live="polite">
                {activeList.map((item, i) => (
                  <article
                    key={item.id}
                    className="card fade-in-up"
                    style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}
                  >
                    <div className="thumb" aria-hidden="true">
                      {item.thumb ? (
                        <img src={item.thumb} alt="thumbnail" style={{width:'100%',height:'100%',objectFit:'cover', borderRadius: 'inherit'}} />
                      ) : (
                        <div className="thumb-shape" />
                      )}
                    </div>
                    <div className="card-body">
                      <h3 className="card-title">{item.title}</h3>
                      <p className="card-text">{item.excerpt}</p>
                      <div className="tags">
                        {(item.tags || []).map((t) => (
                          <span className="tag" key={t}>{t}</span>
                        ))}
                      </div>
                      {tab === 'posts' ? (
                        <div className="card-actions">
                          <button className="btn-mini" onClick={() => startEdit(item)} disabled={busy}>Edit</button>
                          <button className="btn-mini danger" onClick={() => onDelete(item.id)} disabled={busy}>Delete</button>
                        </div>
                      ) : (
                        <div className="card-footer">
                          <span>Saved {formatSavedTimestamp(item.savedAt)}</span>
                          <Link className="btn-mini primary" to={`/works/${item.id}`}>View work</Link>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <h3>No {tab === "saved" ? "saved items" : "posts"} yet</h3>
                <p>Start exploring and share your work to see it here.</p>
              </div>
            )}
            {editing && (
              <div className="modal-backdrop" role="dialog" aria-modal="true">
                <div className="modal">
                  <h3 className="modal-title">Edit Work</h3>

                  <div className="edit-grid">
                    <div className="edit-col">
                      <label className="modal-label">Title</label>
                      <input className="modal-input" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />

                      <label className="modal-label">Description</label>
                      <textarea className="modal-textarea" rows={6} value={editing.excerpt} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} />

                      <label className="modal-label">Status</label>
                      <select className="modal-input" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as any })}>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>

                      <label className="modal-label">Tags</label>
                      <div className="edit-tags">
                        <div className="taglist">
                          {editing.tags.map(t => (
                            <button key={t.name} type="button" className="chip" onClick={() => removeTag(t.name)} title="Remove tag">
                              {t.name} <span aria-hidden>×</span>
                            </button>
                          ))}
                        </div>
                        <input
                          className="modal-input"
                          placeholder="Add tag and press Enter"
                          value={tagQuery}
                          onChange={(e) => setTagQuery(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTagByName(tagQuery); } }}
                          aria-autocomplete="list"
                          aria-expanded={tagSuggestions.length > 0}
                        />
                        {tagSuggestions.length > 0 && (
                          <div className="suggest-box">
                            {tagSuggestions.map(s => (
                              <button key={s.tagId || s.name} type="button" className="suggest-item" onClick={() => addTagByName(s.name)}>
                                {s.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="edit-col">
                      <div className="media-head">
                        <span>Images</span>
                        <button className="btn-mini" onClick={() => imagePickerRef.current?.click()} disabled={busy}>Add Images</button>
                        <input ref={imagePickerRef} type="file" accept="image/*" multiple className="hidden-file" onChange={onPickEditImages} />
                      </div>
                      <div className="edit-media-grid">
                        {editing.media.map((m, i) => (
                          <figure key={(m.id||'new')+i} className={`edit-media ${i===0 ? 'is-thumb' : ''}`}>
                            <img src={m.previewUrl} alt={m.alttext || `image ${i+1}`} />
                            <figcaption>{i===0 ? 'Thumbnail' : `Image ${i+1}`}</figcaption>
                            <input className="modal-input" placeholder="Alt text" value={m.alttext || ''} onChange={(e) => {
                              const next = [...editing.media];
                              next[i] = { ...m, alttext: e.target.value };
                              setEditing({ ...editing, media: next });
                            }} />
                            <div className="media-actions">
                              <button className="btn-mini" onClick={() => setAsThumbnail(i)} disabled={busy}>Set as thumbnail</button>
                              <button className="btn-mini danger" onClick={() => removeMedia(i)} disabled={busy}>Remove</button>
                            </div>
                          </figure>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button className="btn-mini" onClick={() => setEditing(null)} disabled={busy}>Cancel</button>
                    <button className="btn-mini primary" onClick={saveEdit} disabled={busy}>Save</button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
