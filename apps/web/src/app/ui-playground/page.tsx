import { notFound } from "next/navigation";
import { DashboardPlayground } from "@/components/playground/dashboard-playground";
import { requireAuthenticatedProfile } from "@/lib/auth/session";

export default async function UiPlaygroundPage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  await requireAuthenticatedProfile();

  return <DashboardPlayground />;
}
