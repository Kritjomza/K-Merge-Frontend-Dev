import { useEffect, useMemo, useState } from "react";
import { FiAlertTriangle, FiCheckCircle, FiClock, FiFlag, FiSearch } from "react-icons/fi";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
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

const MOCK_REPORTS: ReportRecord[] = [
  {
    id: "REP-4012",
    status: "pending",
    reason: "ละเมิดลิขสิทธิ์",
    details: "งานนี้คล้ายกับโปรเจกต์ใน Behance แทบทั้งหมด",
    reportedAt: "2024-06-17T09:10:00Z",
    work: {
      workId: "work-541",
      title: "Futuristic Banking Dashboard",
      thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=60",
      author: { id: "usr-999", name: "Pattaradanai Tan", email: "pattaradanai@example.com" },
    },
    reporter: { id: "usr-222", name: "Natthanon", email: "natta@kmutt.ac.th" },
  },
  {
    id: "REP-3999",
    status: "pending",
    reason: "ข้อมูลเท็จ",
    details: "อ้างถึงข้อมูลผู้ใช้งาน 500K ที่ไม่มีหลักฐาน",
    reportedAt: "2024-06-16T15:32:00Z",
    work: {
      workId: "work-530",
      title: "Green Mobility App",
      thumbnail: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=600&q=60",
      author: { id: "usr-211", name: "Tawan Sae", email: "tawan@example.com" },
    },
    reporter: { id: "usr-112", name: "Chutima", email: "chutima@kmutt.ac.th" },
    reviewAction: {
      decision: "ขอข้อมูลเพิ่ม",
      note: "รอหลักฐานจากผู้สร้างผลงาน",
      actedBy: "Admin K-02",
      actedAt: "2024-06-17T02:14:00Z",
    },
  },
  {
    id: "REP-3983",
    status: "finished",
    reason: "เนื้อหาไม่เหมาะสม",
    details: "ภาพประกอบและคำบรรยายไม่เหมาะสมกับชุมชน",
    reportedAt: "2024-06-14T12:00:00Z",
    work: {
      workId: "work-501",
      title: "Midnight Illustration Pack",
      thumbnail: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=60",
      author: { id: "usr-900", name: "Sasiwimon", email: "sasi@kmutt.ac.th" },
    },
    reporter: { id: "usr-004", name: "Peerawit", email: "peerawit@kmutt.ac.th" },
    reviewAction: {
      decision: "ลบผลงาน",
      note: "แจ้งนักศึกษาพร้อมคำเตือนครั้งที่ 1",
      actedBy: "Admin K-01",
      actedAt: "2024-06-15T08:45:00Z",
    },
  },
  {
    id: "REP-3950",
    status: "rejected",
    reason: "สแปม",
    details: "ลิงก์ที่ให้มาพบว่าไม่อันตราย เป็นกิจกรรมของชมรม",
    reportedAt: "2024-06-17T05:55:00Z",
    work: {
      workId: "work-489",
      title: "KMUTT Club Landing Page",
      thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=60",
      author: { id: "usr-770", name: "Anongnat", email: "anongnat@example.com" },
    },
    reporter: { id: "usr-310", name: "Jirayu", email: "jirayu@kmutt.ac.th" },
    reviewAction: {
      decision: "ปฏิเสธรายงาน",
      note: "ไม่มีพฤติกรรม spam และเป็นลิงก์ KMUTT อย่างเป็นทางการ",
      actedBy: "Admin K-04",
      actedAt: "2024-06-16T11:22:00Z",
    },
  },
];

const STATUS_LABEL: Record<ReportStatus, { label: string; icon: JSX.Element }> = {
  pending: { label: "Pending", icon: <FiClock /> },
  finished: { label: "Finished", icon: <FiCheckCircle /> },
  rejected: { label: "Rejected", icon: <FiAlertTriangle /> },
};

const formatDate = (value: string) =>
  new Date(value).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });

export default function AdminPage() {
  const [reports] = useState<ReportRecord[]>(MOCK_REPORTS);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(reports[0]?.id ?? null);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports.filter((report) => {
      const statusOk = statusFilter === "all" || report.status === statusFilter;
      const matchesQuery =
        !q ||
        report.work.title.toLowerCase().includes(q) ||
        report.reason.toLowerCase().includes(q) ||
        report.reporter.name.toLowerCase().includes(q) ||
        report.reporter.email.toLowerCase().includes(q);
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

  const handleDecision = (action: "delete" | "reject") => {
    if (!selected) return;
    const msgMap = {
      delete: `ลบโพสต์ "${selected.work.title}" ออกจากระบบแล้ว`,
      reject: `ปฏิเสธรายงาน ${selected.id} และปล่อยโพสต์ไว้`,
    };
    setToast(msgMap[action]);
    setTimeout(() => setToast(null), 2500);
  };

  const handleViewPost = () => {
    if (!selected) return;
    const url = `/works/${selected.work.workId}`;
    window.open(url, "_blank");
  };

  return (
    <div className="admin-app">
      <Navbar />
      <main className="admin-shell">
        <section className="admin-headline">
          <div>
            <p className="eyebrow">Moderation</p>
            <h1>Report Center</h1>
            <p>ติดตามการรายงานผลงานและดำเนินการได้อย่างรวดเร็วภายในศูนย์เดียว</p>
          </div>
          <div className="headline-actions">
            <button className="ghost-btn" onClick={() => setToast("ฟีเจอร์ Export CSV กำลังพัฒนา")}>
              Export CSV
            </button>
          </div>
        </section>

        <section className="metric-grid">
          <div className="metric-card">
            <span>รายงานทั้งหมด</span>
            <strong>{metrics.total}</strong>
            <small>{metrics.pendingCount} รายการรอดำเนินการ</small>
          </div>
          <div className="metric-card metric-card--accent">
            <span>Pending</span>
            <strong>{metrics.pendingCount}</strong>
            <small>ยังไม่ได้จัดการ</small>
          </div>
          <div className="metric-card">
            <span>Finished</span>
            <strong>{metrics.finishedCount}</strong>
            <small>ลบ/ระงับโพสต์แล้ว</small>
          </div>
          <div className="metric-card">
            <span>Rejected</span>
            <strong>{metrics.rejectedCount}</strong>
            <small>ยกเลิกรายงาน</small>
          </div>
        </section>

        <section className="report-panel">
          <div className="report-filters">
            <div className="status-tabs">
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
            <div className="search-box">
              <FiSearch />
              <input
                placeholder="ค้นหาด้วยชื่อผลงาน เหตุผล หรือผู้แจ้ง..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          {toast && (
            <div className="admin-toast">
              <FiCheckCircle />
              <span>{toast}</span>
            </div>
          )}
          <div className="reports-layout">
            <div className="report-table-card">
              <div className="report-table-head">
                <div>
                  <h2>รายการรายงาน</h2>
                  <p>{filtered.length} รายการที่แสดงผล</p>
                </div>
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
                    {filtered.map((report) => (
                      <tr
                        key={report.id}
                        className={`row-clickable ${selectedId === report.id ? "row-selected" : ""}`}
                        onClick={() => setSelectedId(report.id)}
                      >
                        <td>
                          <div className="work-cell">
                            <img src={report.work.thumbnail} alt={report.work.title} />
                            <div>
                              <p className="work-title">{report.work.title}</p>
                              <span>#{report.work.workId}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="reporter-cell">
                            <p>{report.reporter.name}</p>
                            <span>{report.reporter.email}</span>
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
                    ))}
                    {filtered.length === 0 && (
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

            <aside className="report-detail-pane">
              {selected ? (
                <>
                  <div className="detail-header">
                    <p className="eyebrow">รายละเอียดรายงาน</p>
                    <h3>{selected.work.title}</h3>
                    <span className="work-meta">#{selected.work.workId} • โดย {selected.work.author.name}</span>
                  </div>
                  <div className="detail-section">
                    <h4>ข้อมูลการรายงาน</h4>
                    <ul>
                      <li>
                        <span>ผู้แจ้ง</span>
                        <strong>{selected.reporter.name}</strong>
                        <small>{selected.reporter.email}</small>
                      </li>
                      <li>
                        <span>เหตุผล</span>
                        <strong>{selected.reason}</strong>
                        <small>{selected.details}</small>
                      </li>
                      <li>
                        <span>เวลา</span>
                        <strong>{formatDate(selected.reportedAt)}</strong>
                      </li>
                    </ul>
                  </div>
                  {selected.reviewAction && (
                    <div className="detail-section">
                      <h4>บันทึกการดำเนินการ</h4>
                      <p className="decision-label">{selected.reviewAction.decision}</p>
                      <p className="decision-note">{selected.reviewAction.note}</p>
                      <small>
                        ดำเนินการโดย {selected.reviewAction.actedBy} • {formatDate(selected.reviewAction.actedAt)}
                      </small>
                    </div>
                  )}
                  <div className="detail-actions">
                    <button className="ghost-btn" type="button" onClick={() => handleDecision("reject")}>
                      ปฏิเสธการรายงาน
                    </button>
                    <button className="primary-btn" type="button" onClick={() => handleDecision("delete")}>
                      ลบโพสต์
                    </button>
                    <button className="outline-btn" type="button" onClick={handleViewPost}>
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
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
