import Navbar from "@/context/Navbar";
import Sidebar from "@/context/Sidebar";

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
        <main className="flex-1 bg-gray-100 px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
