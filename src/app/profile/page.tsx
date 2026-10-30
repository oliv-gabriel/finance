import { redirect } from "next/navigation";
import { getCurrentUserSession } from "@/lib/auth-utils";
import Navbar from "@/components/Navbar";
import { ProfilePanel, type AdminUser } from "./ProfilePanel";
import { listUsers } from "../actions/authActions";
import { getUserGoogleSettings } from "../actions/googleSync";
import { getTelegramSettings } from "../actions/telegramActions";

export default async function ProfilePage() {
  const userSession = await getCurrentUserSession(true);

  if (!userSession) {
    redirect("/login");
  }

  let initialUsers: AdminUser[] = [];
  if (userSession.isAdmin) {
    const usersResult = await listUsers();
    initialUsers = usersResult.success && usersResult.users ? usersResult.users : [];
  }

  const initialGoogleSettings = await getUserGoogleSettings();
  const telegramRes = await getTelegramSettings();
  const initialTelegramSettings = telegramRes.success
    ? {
        telegramChatId: telegramRes.telegramChatId || "",
        telegramNotifyBills: telegramRes.telegramNotifyBills ?? true,
        botConfigured: telegramRes.botConfigured ?? false,
      }
    : undefined;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar isAdmin={userSession.isAdmin} />
      <main className="p-4 md:p-8 flex-1 w-full max-w-5xl mx-auto">
        <ProfilePanel
          userSession={userSession}
          initialUsers={initialUsers}
          initialGoogleSettings={initialGoogleSettings}
          initialTelegramSettings={initialTelegramSettings}
        />
      </main>
    </div>
  );
}
