"use client";
import { API_URL } from "../../config/api";

import { useEffect, useRef } from "react";

import { useDashboardContext } from "../../api/DashboardContext";

import KPIGrid from "@/app/analytics/dashboard/KPIGrid";
import RevenueChart from "@/app/analytics/dashboard/RevenueChart";
import AIInsights from "@/app/analytics/dashboard/AIInsights";
import TopProducts from "@/app/analytics/dashboard/TopProducts";
import SalesTarget from "@/app/analytics/dashboard/SalesTarget";
import ActivityFeed from "@/app/analytics/dashboard/ActivityFeed";

export default function DashboardPage() {
  const { dashboardData, loading } = useDashboardContext();

  const syncedRef = useRef(false);

  useEffect(() => {
    if (!dashboardData) return;
    if (syncedRef.current) return;

fetch(`${API_URL}/copilot/sync-dashboard`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    session_id: "session_test_123",
    dashboard: dashboardData,
  }),
});

    syncedRef.current = true;
  }, [dashboardData]);

  if (loading || !dashboardData) {
    return (
      <main className="h-full bg-[#0B1020] text-white flex items-center justify-center">
        Loading dashboard...
      </main>
    );
  }

  return (
    <main className="h-full bg-[#0B1020] text-white flex overflow-hidden">

      {/* DASHBOARD */}
      <section className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto px-6 py-5">

          <KPIGrid data={dashboardData.KPIGrid} />

          <div className="grid grid-cols-12 gap-5 mt-5">
            <div className="col-span-8">
              <RevenueChart data={dashboardData.RevenueChart} />
            </div>

            <div className="col-span-4">
              <AIInsights data={dashboardData.AIInsights} />
            </div>
          </div>

          <div className="grid grid-cols-12 gap-5 mt-5">
            <div className="col-span-4">
              <TopProducts data={dashboardData.TopProducts} />
            </div>

            <div className="col-span-4">
              <SalesTarget data={dashboardData.SalesTarget} />
            </div>

            <div className="col-span-4">
              <ActivityFeed data={dashboardData.ActivityFeed} />
            </div>
          </div>

        </div>
      </section>

    </main>
  );
}