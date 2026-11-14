import { HomeRoute, homeMeta } from "@/lib/render";
export const metadata = homeMeta("hi");
export default function Page() { return <HomeRoute lang="hi" />; }
