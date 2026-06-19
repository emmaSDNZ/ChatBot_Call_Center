import { createContext, useContext, useEffect, useState } from "react";
import { mockDashboardData } from "../app/analytics/dashboard/mockData";

const DashboardContext = createContext(null);
import { API_URL } from "../config/api";

export function DashboardProvider({ children }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);


const fetchDashboardData = () => {
  setLoading(true);

  fetch(`${API_URL}/dashboard/data`)
    .then((res) => {
      if (!res.ok)
        throw new Error(
          "Failed to fetch dashboard data"
        );

      return res.json();
    })
    .then((data) => {
      setDashboardData(data);
      setLoading(false);
    })
    .catch((err) => {
      console.warn(
        "Backend dashboard fetch failed",
        err
      );

      setDashboardData(mockDashboardData);
      setLoading(false);
    });
};
  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <DashboardContext.Provider value={{ dashboardData, loading, fetchDashboardData }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboardContext must be used inside DashboardProvider");
  }
  return context;
}