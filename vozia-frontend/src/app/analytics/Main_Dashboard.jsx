import { useEffect, useRef } from "react";
import { useDashboardContext } from "../../contexts/DashboardContext";
import { usePageContextBridge } from "../../contexts/PageContextBridge";
import { API_URL } from "../../config/api";
import KPIGrid from "./dashboard/componentes/KPIGrid";
import RevenueChart from "./dashboard/componentes/RevenueChart";
import AIInsights from "./dashboard/componentes/AIInsights";
import TopProducts from "./dashboard/componentes/TopProducts";
import SalesTarget from "./dashboard/componentes/SalesTarget";
import ActivityFeed from "./dashboard/componentes/ActivityFeed";
import Header from "../ai-voz/components/Header";

export default function DashboardPage() {
  const { dashboardData, loading, fetchDashboardData } = useDashboardContext();

  const { setPageContext } = usePageContextBridge();

  const syncedRef = useRef(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (!dashboardData) return;

    setPageContext({
      page: "dashboard",
      data: dashboardData,
    });

    return () => {
      setPageContext(null);
    };
  }, [dashboardData, setPageContext]);

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
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col items-center justify-center font-sans antialiased">
        <div className="relative w-12 h-12 mb-4">
          <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-cyan-400 rounded-full animate-spin"></div>
        </div>
        <p className="text-sm text-slate-400 animate-pulse font-sans">
          Cargando métricas y estadísticas en tiempo real...
        </p>
      </main>
    );
  }

  return (
    <main className="h-full bg-[#0B1020] text-white flex overflow-hidden">
      {/* DASHBOARD */}
      <section className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          {/* HEADER COMÚN CENTRADO */}
          <div className="max-w-7xl mx-auto px-4 pt-12 md:pt-8">
            <Header />
          </div>

          {/* CONTENEDOR PRINCIPAL CENTRADO */}
          <div className="max-w-7xl mx-auto px-4 py-8">
            <KPIGrid data={dashboardData.KPIGrid} />

            <div className="grid grid-cols-12 gap-5 mt-5">
              <div className="col-span-12 lg:col-span-8">
                <RevenueChart data={dashboardData.RevenueChart} />
              </div>

              <div className="col-span-12 lg:col-span-4">
                <AIInsights data={dashboardData.AIInsights} />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-5 mt-5">
              <div className="col-span-12 md:col-span-6 lg:col-span-4">
                <TopProducts data={dashboardData.TopProducts} />
              </div>

              <div className="col-span-12 md:col-span-6 lg:col-span-4">
                <SalesTarget data={dashboardData.SalesTarget} />
              </div>

              <div className="col-span-12 md:col-span-12 lg:col-span-4">
                <ActivityFeed data={dashboardData.ActivityFeed} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
