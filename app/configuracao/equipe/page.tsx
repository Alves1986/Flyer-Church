import { getCurrentUser, getCurrentOrg, requireAuth, requireOrg } from "@/lib/auth";
import { redirect } from "next/navigation";
import EquipeClient from "./EquipeClient";

export default async function EquipePage() {
  await requireAuth();
  await requireOrg();

  const [user, org] = await Promise.all([getCurrentUser(), getCurrentOrg()]);

  const initialOrg = org ? {
    id: org.id as string,
    name: org.name as string,
    slug: org.slug as string,
  } : null;

  const initialUser = user ? {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    emailAddresses: user.emailAddresses,
    imageUrl: user.imageUrl,
  } : null;

  return <EquipeClient initialOrg={initialOrg} initialUser={initialUser} />;
}