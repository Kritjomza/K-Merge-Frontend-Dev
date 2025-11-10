// src/pages/admin.tsx
import "../App.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useState } from "react";

type User = {
  name: string;
  email: string;
  status: string;
  admin: string;
  reason: string;
  color: string;
};

export default function AdminPage() {
  const [users] = useState<User[]>([
    {
      name: "John Doe",
      email: "john.doe@example.com",
      status: "Active",
      admin: "None",
      reason: "เนื้อหาไม่เหมาะสม",
      color: "#ff8c00",
    },
    {
      name: "Jane Doe",
      email: "jane.doe@example.com",
      status: "Active",
      admin: "Super admin",
      reason: "สแปม / โฆษณาเกินจริง",
      color: "#ffa94d",
    },
    {
      name: "Nick Jansen",
      email: "nick.jansen@example.com",
      status: "Active",
      admin: "None",
      reason: "ละเมิดลิขสิทธิ์",
      color: "#ff6b35",
    },
  ]);

  // ข้อความแจ้งเตือนว่ากดอะไรไปล่าสุด
  const [lastAction, setLastAction] = useState<string | null>(null);

  // user ที่เลือกเพื่อดูรายละเอียด
  const [selectedUserIndex, setSelectedUserIndex] = useState<number | null>(
    null
  );

  const selectedUser =
    selectedUserIndex !== null ? users[selectedUserIndex] : null;

  return (
    <div className="app">
      {/* ส่วนหัว */}
      <Navbar />

      {/* ส่วนตรงกลาง */}
      <main className="main admin-main">
        <section className="user-report">
          <h1 className="user-report-title">User Reports</h1>

          {/* กรอบใหญ่ */}
          <div className="user-report-box">
            {/* filter */}
            <div className="filter-row">
              <button className="filter-btn">ดำเนินการแล้ว ▼</button>
              <button className="filter-btn">ยังไม่ดำเนินการ ▼</button>
              <button className="filter-btn">ยกเลิก ▼</button>
            </div>

            {/* แจ้งว่ากดอะไรล่าสุด */}
            {lastAction && (
              <div className="action-info-box">
                <span className="action-dot" />
                <span>{lastAction}</span>
              </div>
            )}

            {/* ตาราง */}
            <div className="report-card">
              <div className="report-header">
                <h3>Accounts</h3>
                <button className="add-filter-btn">+ Add a filter</button>
              </div>

              <div className="report-table-wrapper">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>User account status</th>
                      <th>Admin status</th>
                      <th>เหตุผลในการรายงาน</th>
                      <th>การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, index) => (
                      <tr
                        key={u.email}
                        className={
                          "row-clickable " +
                          (selectedUserIndex === index
                            ? "row-selected"
                            : "")
                        }
                        onClick={() => setSelectedUserIndex(index)}
                      >
                        <td className="user-cell">
                          <div
                            className="avatar"
                            style={{ backgroundColor: u.color }}
                          >
                            {u.name.charAt(0)}
                          </div>
                          <div className="user-info">
                            <a href="#" className="user-name">
                              {u.name}
                            </a>
                            <div className="user-email">{u.email}</div>
                          </div>
                        </td>
                        <td>{u.status}</td>
                        <td>{u.admin}</td>
                        <td>{u.reason}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-small-orange"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLastAction(
                                  `คุณกด "รายงาน" สำหรับ ${u.name}`
                                );
                                setSelectedUserIndex(index);
                              }}
                            >
                              รายงาน
                            </button>
                            <button
                              className="btn-small-gray"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLastAction(
                                  `คุณกด "ยกเลิก" สำหรับ ${u.name}`
                                );
                                setSelectedUserIndex(index);
                              }}
                            >
                              ยกเลิก
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* กล่องรายละเอียดบัญชีที่เลือก */}
              {selectedUser && (
                <div className="user-detail-panel">
                  <div className="user-detail-header">
                    <div
                      className="avatar avatar-lg"
                      style={{ backgroundColor: selectedUser.color }}
                    >
                      {selectedUser.name.charAt(0)}
                    </div>
                    <div>
                      <div className="user-detail-name">
                        {selectedUser.name}
                      </div>
                      <div className="user-detail-email">
                        {selectedUser.email}
                      </div>
                    </div>
                  </div>

                  <div className="user-detail-tags">
                    <span className="tag tag-green">
                      สถานะ: {selectedUser.status}
                    </span>
                    <span className="tag tag-blue">
                      สิทธิ์ผู้ใช้: {selectedUser.admin}
                    </span>
                    <span className="tag tag-orange">
                      เหตุผลรายงาน: {selectedUser.reason}
                    </span>
                  </div>

                  <div className="user-detail-actions">
                    <button
                      className="btn-small-orange"
                      onClick={() =>
                        setLastAction(
                          `คุณกด "รายงาน" สำหรับ ${selectedUser.name}`
                        )
                      }
                    >
                      รายงาน
                    </button>
                    <button
                      className="btn-small-gray"
                      onClick={() =>
                        setLastAction(
                          `คุณกด "ยกเลิก" สำหรับ ${selectedUser.name}`
                        )
                      }
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ส่วนท้าย */}
      <Footer />
    </div>
  );
}
