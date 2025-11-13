import { useEffect, useMemo, useRef, useState } from "react";
import { FiAlertTriangle, FiCheckCircle, FiClock, FiFlag, FiSearch } from "react-icons/fi";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../contexts/AuthContext";
import { supabaseInsert, supabaseRest, supabaseUpdate } from "../lib/supabase";
import "../App.css";
import "./Adminpage.css";

type ReportStatus = "pending" | "finished" | "rejected";

type ReportRecord = {
  id: string;
  status: ReportStatus;
  reason: string;
  details: string;
  reportedAt: string;
  work: {
    workId: string;
    title: string;
    thumbnail: string;
    author: { id: string; name: string; email: string };
  };
  reporter: { id: string; name: string; email: string };
  reviewAction?: {
    decision: string;
    note?: string;
    actedBy: string;
    actedAt: string;
  };
};

type ReportRow = {
  id: string;
  workId: string;
  reporterId: string | null;
  reason?: string | null;
  details?: string | null;
  status?: string | null;
  reportedAt?: string | null;
};

type WorkRow = {
  workId: string;
  title?: string | null;
  authorId?: string | null;
  Media?: { fileurl?: string | null }[];
};

type ProfileRow = {
  userID: string;
  displayName?: string | null;
  contact?: string | null;
  avatarUrl?: string | null;
};

type UserRow = {
  id: string;
  full_name?: string | null;
  email?: string | null;
};

type ReviewActionRow = {
  id: string;
  reportId: string;
  decision?: string | null;
  note?: string | null;
  actedBy?: string | null;
  actedAt?: string | null;
};

const STATUS_LABEL: Record<ReportStatus, { label: string; icon: JSX.Element }> = {
  pending: { label: "Pending", icon: <FiClock /> },
  finished: { label: "Finished", icon: <FiCheckCircle /> },
  rejected: { label: "Rejected", icon: <FiAlertTriangle /> },
};

const REPORT_PLACEHOLDER_THUMB =
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=60";

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
};

export default function AdminPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [loadingReports, setLoadingReports] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [decisionBusy, setDecisionBusy] = useState(false);
  const toastTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    async function loadReports() {
      setLoadingReports(true);
      setError(null);
      try {
        const rows = await supabaseRest<ReportRow[]>("Report", {
          searchParams: {
            select: "id,workId,reporterId,reason,details,status,reportedAt",
            order: "reportedAt.desc.nullslast",
          },
          signal: controller.signal,
        });
        const hydrated = await hydrateReports(rows || [], controller.signal);
        if (!controller.signal.aborted) {
          setReports(hydrated);
        }
      } catch (err: any) {
        if (!controller.signal.aborted) {
          setError(err?.message || "ไม่สามารถโหลดรายการรายงานได้");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingReports(false);
        }
      }
    }
    loadReports();
    return () => controller.abort();
  }, [refreshKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports.filter((report) => {
      const statusOk = statusFilter === "all" || report.status === statusFilter;
      const matchesQuery =
        !q ||
        report.work.title.toLowerCase().includes(q) ||
        report.reason.toLowerCase().includes(q) ||
        report.reporter.name.toLowerCase().includes(q) ||
        (report.reporter.email || "").toLowerCase().includes(q);
      return statusOk && matchesQuery;
    });
  }, [reports, statusFilter, query]);

  useEffect(() => {
    if (selectedId && filtered.some((r) => r.id === selectedId)) return;
    if (filtered.length > 0) {
      setSelectedId(filtered[0].id);
    } else {
      setSelectedId(null);
    }
  }, [filtered, selectedId]);

  const selected = filtered.find((r) => r.id === selectedId) || reports.find((r) => r.id === selectedId) || null;

  const metrics = useMemo(() => {
    const total = reports.length;
    const pendingCount = reports.filter((r) => r.status === "pending").length;
    const finishedCount = reports.filter((r) => r.status === "finished").length;
    const rejectedCount = reports.filter((r) => r.status === "rejected").length;
    return { total, pendingCount, finishedCount, rejectedCount };
  }, [reports]);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2500);
  };

  const handleDecision = async (action: "delete" | "reject") => {
    if (!selected) return;
    const workId = selected.work.workId;
    const confirmMessage =
      action === "delete"
        ? `ยืนยันการลบโพสต์ "${selected.work.title}" ออกจากระบบหรือไม่?`
        : `ยืนยันการปฏิเสธรายงาน ${selected.id} หรือไม่?`;
    if (!window.confirm(confirmMessage)) return;
    const defaultNote = action === "delete" ? "ลบโพสต์ออกจากระบบ" : "รายงานไม่เข้าเงื่อนไข";
    const noteInput = window.prompt("บันทึกเพิ่มเติม (ไม่บังคับ)", defaultNote) ?? "";
    setDecisionBusy(true);
    try {
      const tasks: Promise<unknown>[] = [];
      tasks.push(
        supabaseUpdate("Report", { id: `eq.${selected.id}` }, { status: action === "delete" ? "finished" : "rejected" }),
      );
      if (action === "delete") {
        tasks.push(
          supabaseUpdate("Work", { workId: `eq.${workId}` }, { status: "removed", updatedAt: new Date().toISOString() }),
        );
      }
      await Promise.all(tasks);
      await supabaseInsert("ReviewAction", {
        reportId: selected.id,
        actedBy: user?.id ?? null,
        decision: action === "delete" ? "ลบโพสต์" : "ปฏิเสธรายงาน",
        note: noteInput.trim() || null,
        actedAt: new Date().toISOString(),
      });
      showToast(
        action === "delete"
          ? `ลบโพสต์ "${selected.work.title}" แล้ว`
          : `ปฏิเสธรายงาน ${selected.id} แล้ว`,
      );
      setRefreshKey((key) => key + 1);
    } catch (err: any) {
      showToast(err?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setDecisionBusy(false);
    }
  };

  const handleViewPost = () => {
    if (!selected) return;
    const url = `/works/${selected.work.workId}`;
    window.open(url, "_blank");
  };

  const handleRefresh = () => setRefreshKey((key) => key + 1);

  return (
    <div className="admin-app">
      <Navbar />
      <main className="admin-shell">
        <section className="admin-hero">
          <div className="hero-copy">
            <p className="eyebrow">Trust &amp; Safety</p>
            <h1>Report Command Center</h1>
            <p>ติดตาม สางงาน และสื่อสารกับผู้แจ้งให้ครบวงจรในที่เดียว</p>
          </div>
          <div className="hero-actions">
            <button className="ghost-btn" type="button" onClick={handleRefresh}>
              รีเฟรช
            </button>
            <button className="ghost-btn" type="button" onClick={() => showToast("ฟีเจอร์ Export CSV กำลังพัฒนา")}>
              Export CSV
            </button>
          </div>
        </section>

        <section className="stat-deck">
          <div className="stat-card primary">
            <p>รายงานทั้งหมด</p>
            <strong>{metrics.total}</strong>
            <span>{metrics.pendingCount} รายการรอจัดการ</span>
          </div>
          <div className="stat-card">
            <p>Pending</p>
            <strong>{metrics.pendingCount}</strong>
            <span>ยังไม่ตัดสิน</span>
          </div>
          <div className="stat-card">
            <p>Finished</p>
            <strong>{metrics.finishedCount}</strong>
            <span>ลบ/ระงับโพสต์แล้ว</span>
          </div>
          <div className="stat-card">
            <p>Rejected</p>
            <strong>{metrics.rejectedCount}</strong>
            <span>ปล่อยให้เผยแพร่ต่อ</span>
          </div>
        </section>

        <section className="board-controls">
          <div className="status-filter">
            {["all", "pending", "finished", "rejected"].map((status) => (
              <button
                key={status}
                className={`status-chip ${statusFilter === status ? "is-active" : ""}`}
                onClick={() => setStatusFilter(status as ReportStatus | "all")}
              >
                {status === "all" ? "ทั้งหมด" : STATUS_LABEL[status as ReportStatus].label}
              </button>
            ))}
          </div>
          <div className="controls-right">
            <div className="search-box">
              <FiSearch />
              <input
                placeholder="ค้นหาด้วยชื่อผลงาน เหตุผล หรือผู้แจ้ง..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </section>

        {error && (
          <div className="admin-toast admin-toast--error">
            <FiAlertTriangle />
            <span>{error}</span>
          </div>
        )}

        {toast && (
          <div className="admin-toast">
            <FiCheckCircle />
            <span>{toast}</span>
          </div>
        )}

        <section className="admin-board">
          <div className="board-card">
            <div className="board-head">
              <div>
                <p className="eyebrow">รายการรายงาน</p>
                <h2>Inbox</h2>
              </div>
              <span className="table-meta">
                {loadingReports ? "กำลังโหลด..." : `${filtered.length} รายการ`}
              </span>
            </div>
            <div className="table-scroll">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>งานที่ถูกแจ้ง</th>
                    <th>ผู้แจ้ง</th>
                    <th>เหตุผล</th>
                    <th>สถานะ</th>
                    <th>แจ้งเมื่อ</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((report) => {
                    const thumb = report.work.thumbnail || REPORT_PLACEHOLDER_THUMB;
                    return (
                      <tr
                        key={report.id}
                        className={`row-clickable ${selectedId === report.id ? "row-selected" : ""}`}
                        onClick={() => setSelectedId(report.id)}
                      >
                        <td>
                          <div className="work-cell">
                            <img src={thumb} alt={report.work.title} />
                            <div>
                              <p className="work-title">{report.work.title}</p>
                              <span>#{report.work.workId}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="reporter-cell">
                            <p>{report.reporter.name}</p>
                            <span>{report.reporter.email || "—"}</span>
                          </div>
                        </td>
                        <td>
                          <div className="reason-cell">
                            <FiAlertTriangle />
                            <span>{report.reason}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`status-pill status-${report.status}`}>
                            {STATUS_LABEL[report.status].icon}
                            {STATUS_LABEL[report.status].label}
                          </span>
                        </td>
                        <td>{formatDate(report.reportedAt)}</td>
                      </tr>
                    );
                  })}
                  {!loadingReports && filtered.length === 0 && (
                    <tr>
                      <td colSpan={5}>
                        <div className="empty-state">
                          <FiFlag />
                          <p>ยังไม่มีรายงานตามเงื่อนไขนี้</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="board-detail">
            {selected ? (
              <>
                <header className="detail-header">
                  <p className="eyebrow">รายละเอียด</p>
                  <h3>{selected.work.title}</h3>
                  <span className="work-meta">#{selected.work.workId} • โดย {selected.work.author.name}</span>
                </header>
                <div className="detail-section">
                  <h4>ผู้แจ้ง</h4>
                  <p className="detail-value">{selected.reporter.name}</p>
                  <span className="detail-muted">{selected.reporter.email || "—"}</span>
                </div>
                <div className="detail-section">
                  <h4>เหตุผล</h4>
                  <p className="detail-value">{selected.reason}</p>
                  <span className="detail-muted">{selected.details || "ไม่มีรายละเอียดเพิ่มเติม"}</span>
                </div>
                <div className="detail-section">
                  <h4>เวลา</h4>
                  <p className="detail-value">{formatDate(selected.reportedAt)}</p>
                </div>
                {selected.reviewAction && (
                  <div className="detail-section">
                    <h4>บันทึกการดำเนินการ</h4>
                    <p className="detail-value">{selected.reviewAction.decision}</p>
                    <span className="detail-muted">{selected.reviewAction.note || "—"}</span>
                    <small>
                      ดำเนินการโดย {selected.reviewAction.actedBy || "—"} • {formatDate(selected.reviewAction.actedAt)}
                    </small>
                  </div>
                )}
                <div className="detail-actions">
                  <button className="ghost-btn" type="button" onClick={() => handleDecision("reject")} disabled={decisionBusy}>
                    ปฏิเสธรายงาน
                  </button>
                  <button className="primary-btn" type="button" onClick={() => handleDecision("delete")} disabled={decisionBusy}>
                    ลบโพสต์
                  </button>
                  <button className="outline-btn" type="button" onClick={handleViewPost} disabled={decisionBusy}>
                    ดูโพสต์
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-pane">
                <FiSearch />
                <p>เลือกหนึ่งรายการทางซ้ายเพื่อดูรายละเอียด</p>
              </div>
            )}
          </aside>
        </section>
      </main>
      <Footer />
    </div>
  );
}

async function hydrateReports(rows: ReportRow[], signal?: AbortSignal): Promise<ReportRecord[]> {
  if (!rows.length) return [];
  const workIds = rows.map((row) => row.workId).filter(Boolean);
  const works = await fetchByIds<WorkRow>("Work", "workId", workIds, "workId,title,authorId,Media(fileurl)", { signal });
  const workMap = new Map(works.map((work) => [work.workId, work]));

  const authorIds = works.map((work) => work.authorId).filter(Boolean) as string[];
  const reporterIds = rows.map((row) => row.reporterId).filter(Boolean) as string[];
  const userIds = Array.from(new Set([...authorIds, ...reporterIds]));

  const profiles = await fetchByIds<ProfileRow>("Profile", "userID", userIds, "userID,displayName,contact", { signal });
  const profileMap = new Map(profiles.map((profile) => [profile.userID, profile]));

  const users = await fetchByIds<UserRow>("users", "id", userIds, "id,full_name,email", { signal });
  const userMap = new Map(users.map((item) => [item.id, item]));

  const reviewRows = await fetchByIds<ReviewActionRow>(
    "ReviewAction",
    "reportId",
    rows.map((row) => row.id),
    "id,reportId,decision,note,actedBy,actedAt",
    { order: "actedAt.desc.nullslast", signal },
  );
  const reviewMap = new Map<string, ReviewActionRow>();
  reviewRows.forEach((action) => {
    if (!reviewMap.has(action.reportId)) {
      reviewMap.set(action.reportId, action);
    }
  });

  return rows.map((row) => {
    const work = workMap.get(row.workId);
    const statusValue = (row.status || "pending").toLowerCase();
    const status: ReportStatus = statusValue === "finished" || statusValue === "rejected" ? (statusValue as ReportStatus) : "pending";
    const workAuthor = resolvePerson(work?.authorId, profileMap, userMap);
    const reporter = resolvePerson(row.reporterId, profileMap, userMap);
    const review = reviewMap.get(row.id);

    return {
      id: row.id,
      status,
      reason: row.reason || "ไม่ระบุเหตุผล",
      details: row.details || "",
      reportedAt: row.reportedAt || "",
      work: {
        workId: row.workId,
        title: work?.title || "Untitled work",
        thumbnail: work?.Media?.[0]?.fileurl || REPORT_PLACEHOLDER_THUMB,
        author: workAuthor,
      },
      reporter,
      reviewAction: review
        ? {
            decision: review.decision || "—",
            note: review.note || "",
            actedBy: review.actedBy || "—",
            actedAt: review.actedAt || "",
          }
        : undefined,
    };
  });
}

type FetchByIdsOptions = {
  order?: string;
  signal?: AbortSignal;
};

async function fetchByIds<T>(
  table: string,
  column: string,
  ids: string[],
  select: string,
  options: FetchByIdsOptions = {},
): Promise<T[]> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (!unique.length) return [];

  const results: T[] = [];
  const chunkSize = 40;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const filter = `in.(${chunk.map((id) => `"${id}"`).join(",")})`;
    const searchParams: Record<string, string> = { select, [column]: filter };
    if (options.order) searchParams.order = options.order;
    const data = await supabaseRest<T[]>(table, { searchParams, signal: options.signal });
    if (Array.isArray(data)) results.push(...data);
  }
  return results;
}

function resolvePerson(
  userId: string | null | undefined,
  profileMap: Map<string, ProfileRow>,
  userMap: Map<string, UserRow>,
) {
  if (!userId) {
    return { id: "", name: "ผู้ใช้งานไม่ระบุ", email: "-" };
  }
  const profile = profileMap.get(userId);
  const account = userMap.get(userId);
  return {
    id: userId,
    name: profile?.displayName || account?.full_name || "ไม่ระบุชื่อ",
    email: account?.email || profile?.contact || "-",
  };
}
