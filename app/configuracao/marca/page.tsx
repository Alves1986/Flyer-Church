import { getCurrentUser, getCurrentOrg, requireAuth, requireOrg } from "@/lib/auth";
import { redirect } from "next/navigation";
import MarcaClient from "./MarcaClient";

export default async function MarcaPage() {
  await requireAuth();
  await requireOrg();

  const [user, org, brandDna] = await Promise.all([
    getCurrentUser(),
    getCurrentOrg(),
    getBrandDna(),
  ]);

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

  return <MarcaClient initialOrg={initialOrg} initialUser={initialUser} initialBrandDna={brandDna} />;
}

async function getBrandDna() {
  if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) return null;
  
  const { getCurrentOrgId } = await import("@/lib/auth");
  const orgId = await getCurrentOrgId();
  if (!orgId) return null;

  const { ensureSchema, sql, setOrgContext } = await import("@/lib/db");
  await ensureSchema();
  await setOrgContext(orgId);

  const result = await sql`select dados from brand_dna where organization_id = ${orgId}::uuid limit 1`;
  const row = (result as Array<Record<string, unknown>>)[0];
  return row?.dados as any ?? null;
}