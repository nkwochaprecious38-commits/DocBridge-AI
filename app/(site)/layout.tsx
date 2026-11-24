import { SiteNav } from "@/components/SiteNav";
import { Footer } from "@/components/Footer";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (<><SiteNav /><main>{children}</main><Footer /></>);
}
