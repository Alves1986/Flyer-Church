import dynamic from "next/dynamic";

const LandingClient = dynamic(() => import("./(marketing)/LandingClient"), { ssr: false });

export default function Page() {
  return <LandingClient />;
}