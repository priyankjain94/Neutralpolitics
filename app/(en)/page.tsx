import { HomeRoute, homeMeta } from "@/lib/render";
export const metadata = homeMeta("en");
export default function Page() { return <HomeRoute lang="en" />; }
