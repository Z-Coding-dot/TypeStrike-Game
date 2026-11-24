import type { Metadata } from "next";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { getAdminAnalyticsSnapshot } from "@/lib/adminAnalytics";

export const metadata: Metadata = {
  title: "Owner dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const snapshot = await getAdminAnalyticsSnapshot();
  return <AdminDashboard snapshot={snapshot} />;
}
