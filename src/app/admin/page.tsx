import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth-utils";
import Navbar from "@/components/Navbar";
import { AdminPanel } from "./AdminPanel";

export default async function AdminPage() {
  const admin = await isAdmin();
  
  if (!admin) {
    redirect("/");
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#121212]">
      <Navbar isAdmin={admin} />
      <div className="p-4 md:p-8 flex-1 flex flex-col items-center">
        <AdminPanel />
      </div>
    </div>
  );
}
