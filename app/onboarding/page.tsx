import { getCurrentUser, getCurrentOrg, requireAuth, requireOrg } from "@/lib/auth";
import { redirect } from "next/navigation";
import OnboardingClient from "./OnboardingClient";

export default async function OnboardingPage() {
  const userId = await requireAuth();
  const orgId = await getCurrentOrgId();

  if (orgId) {
    redirect("/dashboard");
  }

  const user = await getCurrentUser();

  return <OnboardingClient initialUserEmail={user?.emailAddresses?.[0]?.emailAddress ?? ""} />;
}

async function getCurrentOrgId() {
  const { auth } = await import("@clerk/nextjs/server");
  const { orgId } = await auth();
  return orgId;
}