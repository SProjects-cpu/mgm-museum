import { Metadata } from "next";
import { AdminDashboard } from "./admin-dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function AdminPage() {
  return <AdminDashboard />;
}


