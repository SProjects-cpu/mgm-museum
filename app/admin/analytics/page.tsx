import { Metadata } from "next";
import { AnalyticsDashboard } from "./analytics-dashboard";

export const metadata: Metadata = {
  title: "Analytics & Reports",
};

export default function AnalyticsPage() {
  return <AnalyticsDashboard />;
}


