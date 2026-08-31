import { getCurrentUser, getCurrentOrg } from "@/lib/auth";
import PlanoPageClient from "./PlanoPageClient";

async function getPlanData() {
  const [user, org] = await Promise.all([getCurrentUser(), getCurrentOrg()]);
  return { user, org };
}

export default async function PlanoPage() {
  const { user, org } = await getPlanData();
  const currentPlan = (org?.plan as "free" | "pro" | "church") ?? "free";

  return (
    <PlanoPageClient
      initialPlan={currentPlan}
      initialUserEmail={user?.emailAddresses?.[0]?.emailAddress ?? ""}
    />
  );
}