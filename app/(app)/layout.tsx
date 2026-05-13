import AppSidebar from "@/components/AppSidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      {/* On mobile we hide the global Header (see components/Header.tsx) and
          let the AppSidebar's floating hamburger (fixed top-3 left-3) own the
          chrome. Adding pt-14 here shifts page content below that hamburger so
          page titles don't get covered. Desktop has no offset because the
          sidebar is laid out beside the content. */}
      <div className="flex-1 min-w-0 bg-gray-50 pt-14 md:pt-0">
        {children}
      </div>
    </div>
  );
}
