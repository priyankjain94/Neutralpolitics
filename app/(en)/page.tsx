import { HomeRoute, homeMeta } from "@/lib/render";
export const revalidate = 60;
export const metadata = homeMeta("en");
export default function Page() { return <HomeRoute lang="en" />; }
