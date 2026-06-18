"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Table, message } from "antd";
import type { ColumnsType } from "antd/es/table";

interface UserRow {
  id: string;
  email: string;
  contact: string;
  daysActive: number;
}

const PAGE_SIZE = 10;

export default function AdminDashboard() {
  const router = useRouter();
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  const [rows, setRows] = useState<UserRow[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [todayActive, setTodayActive] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Gate: must have an admin email in localStorage, else back to home.
  useEffect(() => {
    // localStorage is only available on the client, so this gate must run in
    // an effect; setting state from it is the intended pattern here.
    const stored = localStorage.getItem("adminEmail");
    if (!stored) {
      router.replace("/");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAdminEmail(stored);
  }, [router]);

  const load = useCallback(
    async (p: number) => {
      if (!adminEmail) return;
      setLoading(true);
      try {
        const { data } = await axios.get("/api/admin/users", {
          params: { adminEmail, page: p, limit: PAGE_SIZE },
        });
        setRows(data.users);
        setTotalUsers(data.totalUsers);
        setTodayActive(data.todayActive);
        setPage(data.page);
      } catch {
        message.error("Failed to load users (not authorized?).");
        localStorage.removeItem("adminEmail");
        router.replace("/");
      } finally {
        setLoading(false);
      }
    },
    [adminEmail, router]
  );

  useEffect(() => {
    // load() sets state only after an await (async fetch), not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (adminEmail) load(1);
  }, [adminEmail, load]);

  const columns: ColumnsType<UserRow> = [
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Contact",
      dataIndex: "contact",
      key: "contact",
      render: (c: string) => c || <span className="text-gray-400">—</span>,
    },
    {
      title: "Days Active",
      dataIndex: "daysActive",
      key: "daysActive",
      align: "center",
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-950 via-blue-800 to-blue-600 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8 pt-4">
          <h1 className="text-3xl font-bold text-white mb-1">Admin Dashboard</h1>
          <p className="text-blue-300 text-sm">{adminEmail}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { label: "Total Users", value: totalUsers },
            { label: "Active Today", value: todayActive },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white/10 backdrop-blur rounded-2xl p-5 text-center border border-white/20"
            >
              <p className="text-4xl font-bold text-white">{s.value}</p>
              <p className="text-blue-300 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Users table */}
        <div className="bg-white rounded-2xl p-4 shadow-2xl">
          <Table<UserRow>
            rowKey="id"
            columns={columns}
            dataSource={rows}
            loading={loading}
            pagination={{
              current: page,
              pageSize: PAGE_SIZE,
              total: totalUsers,
              showSizeChanger: false,
              onChange: (p) => load(p),
            }}
          />
        </div>
      </div>
    </div>
  );
}
