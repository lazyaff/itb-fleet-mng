import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-row">
      <Sidebar />
      <div className="flex flex-col flex-1 h-dvh overflow-y-auto">
        <Navbar />
        <main className="flex-1 bg-gray-100 px-5 py-5 text-sm">{children}</main>
      </div>
    </div>
  );
}
