"use client";

import { useState, useEffect } from "react";
import {
  registerUser,
  listUsers,
  toggleUserRole,
  adminChangePassword,
  changeOwnPassword,
  deleteUser,
  updateUsername,
} from "../actions/authActions";
import {
  getUserGoogleSettings,
  saveBankSyncRules,
  disconnectGoogle,
  syncGoogleEmails,
  type BankSyncRule,
} from "../actions/googleSync";
import { Button } from "@/components/ui/Button";
import {
  Users,
  UserPlus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  X,
  Eye,
  EyeOff,
  Pencil,
  Mail,
  Unlink,
  ShieldCheck,
  ChevronDown,
  Plus,
} from "lucide-react";

export interface GoogleSettings {
  isConnected: boolean;
  googleEmail: string | null;
  bankSenderEmail: string | null;
  bankSyncAccountId?: string | null;
  bankSyncRules?: BankSyncRule[];
  availableAccounts?: { id: string; name: string; type: string }[];
}

export interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  _count: {
    transactions: number;
    accounts: number;
  };
}

export interface UserSessionData {
  id?: string;
  name?: string;
  email?: string;
  role: string;
  isAdmin: boolean;
}

interface ProfilePanelProps {
  userSession: UserSessionData;
  initialUsers?: AdminUser[];
  initialGoogleSettings?: GoogleSettings;
}

export function ProfilePanel({
  userSession,
  initialUsers = [],
  initialGoogleSettings,
}: ProfilePanelProps) {
  const isAdmin = userSession.isAdmin;
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [activeTab, setActiveTab] = useState<"profile" | "users" | "create">("profile");
  const [search, setSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Estados de Integração Google / Múltiplos Remetentes de Bancos
  const [googleSettings, setGoogleSettings] = useState<GoogleSettings>(
    initialGoogleSettings || { isConnected: false, googleEmail: null, bankSenderEmail: null }
  );
  const [rules, setRules] = useState<BankSyncRule[]>(() => {
    if (initialGoogleSettings?.bankSyncRules && initialGoogleSettings.bankSyncRules.length > 0) {
      return initialGoogleSettings.bankSyncRules;
    }
    if (initialGoogleSettings?.bankSenderEmail) {
      return [
        {
          id: "rule-1",
          email: initialGoogleSettings.bankSenderEmail,
          accountId: initialGoogleSettings.bankSyncAccountId || "",
        },
      ];
    }
    return [{ id: "rule-1", email: "", accountId: "" }];
  });
  const [isSavingSender, setIsSavingSender] = useState(false);
  const [isDisconnectingGoogle, setIsDisconnectingGoogle] = useState(false);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [googleFeedback, setGoogleFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const googleParam = params.get("google");
      const errorParam = params.get("error");

      if (googleParam === "connected") {
        setGoogleFeedback({
          type: "success",
          text: "Conta Google conectada com sucesso! Agora configure abaixo os e-mails dos bancos para sincronização.",
        });
        getUserGoogleSettings().then((res) => {
          setGoogleSettings(res);
          if (res.bankSyncRules && res.bankSyncRules.length > 0) {
            setRules(res.bankSyncRules);
          } else if (res.bankSenderEmail) {
            setRules([
              {
                id: "rule-1",
                email: res.bankSenderEmail,
                accountId: res.bankSyncAccountId || "",
              },
            ]);
          }
        });
        window.history.replaceState({}, "", window.location.pathname);
      } else if (errorParam) {
        setGoogleFeedback({
          type: "error",
          text: `Erro ao conectar com o Google: ${errorParam}`,
        });
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, []);

  function handleAddRule() {
    setRules((prev) => [
      ...prev,
      { id: `rule-${Date.now()}`, email: "", accountId: "" },
    ]);
  }

  function handleUpdateRule(id: string, field: "email" | "accountId", value: string) {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  }

  function handleDeleteRule(id: string) {
    setRules((prev) => {
      const next = prev.filter((r) => r.id !== id);
      return next.length > 0 ? next : [{ id: `rule-${Date.now()}`, email: "", accountId: "" }];
    });
  }

  async function handleSaveBankSyncRules(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingSender(true);
    setGoogleFeedback(null);
    try {
      const validRules = rules.filter((r) => r.email.trim());
      await saveBankSyncRules(validRules);
      setGoogleSettings((prev) => ({
        ...prev,
        bankSyncRules: validRules,
        bankSenderEmail: validRules[0]?.email || null,
        bankSyncAccountId: validRules[0]?.accountId || null,
      }));
      setGoogleFeedback({
        type: "success",
        text: "Regras de remetentes bancários e contas de destino salvas com sucesso!",
      });
    } catch {
      setGoogleFeedback({
        type: "error",
        text: "Erro ao salvar as configurações de sincronização.",
      });
    } finally {
      setIsSavingSender(false);
    }
  }

  async function handleDisconnectGoogle() {
    if (!confirm("Tem certeza que deseja desconectar sua conta do Google? A leitura de e-mails deste usuário será interrompida.")) {
      return;
    }
    setIsDisconnectingGoogle(true);
    setGoogleFeedback(null);
    try {
      await disconnectGoogle();
      setGoogleSettings({ isConnected: false, googleEmail: null, bankSenderEmail: null, bankSyncAccountId: null, bankSyncRules: [] });
      setRules([{ id: "rule-1", email: "", accountId: "" }]);
      setGoogleFeedback({
        type: "success",
        text: "Conta Google desconectada com sucesso.",
      });
    } catch {
      setGoogleFeedback({
        type: "error",
        text: "Erro ao desconectar conta Google.",
      });
    } finally {
      setIsDisconnectingGoogle(false);
    }
  }

  async function handleSyncNow() {
    setIsSyncingGoogle(true);
    setGoogleFeedback(null);
    try {
      const res = await syncGoogleEmails();
      if (res.success) {
        setGoogleFeedback({
          type: "success",
          text: res.message || `${res.count ?? 0} comprovante(s) processado(s) com sucesso!`,
        });
      } else {
        setGoogleFeedback({
          type: "error",
          text: res.error || "Erro durante a sincronização de e-mails.",
        });
      }
    } catch {
      setGoogleFeedback({
        type: "error",
        text: "Erro inesperado ao sincronizar com o Gmail.",
      });
    } finally {
      setIsSyncingGoogle(false);
    }
  }

  // Estados de criação de usuário (Admin)
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"USER" | "ADMIN">("USER");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Estados do Modal de Troca de Senha de Usuário (Admin)
  const [passwordModalUser, setPasswordModalUser] = useState<AdminUser | null>(null);
  const [modalNewPassword, setModalNewPassword] = useState("");
  const [modalConfirmPassword, setModalConfirmPassword] = useState("");
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [isChangingUserPassword, setIsChangingUserPassword] = useState(false);
  const [modalFeedback, setModalFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Estados de Troca de Minha Própria Senha
  const [currentPass, setCurrentPass] = useState("");
  const [myNewPass, setMyNewPass] = useState("");
  const [myConfirmPass, setMyConfirmPass] = useState("");
  const [showMyPass, setShowMyPass] = useState(false);
  const [isUpdatingMyPass, setIsUpdatingMyPass] = useState(false);

  // Estados de Nome de Usuário / Login
  const [currentUsername, setCurrentUsername] = useState(userSession.name || userSession.email || "");
  const [usernameInput, setUsernameInput] = useState(userSession.name || userSession.email || "");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [usernameFeedback, setUsernameFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Estados de exclusão (Admin)
  const [deleteModalUser, setDeleteModalUser] = useState<AdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Loading individual de alternância de papel
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

  async function reloadUsers() {
    if (!isAdmin) return;
    setIsRefreshing(true);
    try {
      const res = await listUsers();
      if (res.success && res.users) {
        setUsers(res.users);
      }
    } catch {
      setFeedback({ type: "error", text: "Erro ao recarregar lista de usuários." });
    } finally {
      setIsRefreshing(false);
    }
  }

  function generateRandomPassword() {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let pass = "";
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setIsCreating(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append("username", newName.trim());
      formData.append("password", newPassword);
      formData.append("role", newRole);

      const res = await registerUser(formData);

      if (res.success) {
        setFeedback({
          type: "success",
          text: `Usuário "${newName.trim()}" cadastrado com sucesso.`,
        });
        setNewName("");
        setNewPassword("");
        setNewRole("USER");
        await reloadUsers();
        setActiveTab("users");
      } else {
        setFeedback({ type: "error", text: res.error || "Erro ao cadastrar usuário." });
      }
    } catch {
      setFeedback({ type: "error", text: "Ocorreu um erro inesperado." });
    } finally {
      setIsCreating(false);
    }
  }

  async function handleToggleRole(targetUser: AdminUser) {
    if (targetUser.name === "gab" || targetUser.email === "gab") {
      setFeedback({
        type: "error",
        text: "O usuário principal 'gab' não pode ser alterado.",
      });
      return;
    }

    const nextRole = targetUser.role === "ADMIN" ? "USER" : "ADMIN";
    setTogglingUserId(targetUser.id);
    setFeedback(null);

    try {
      const res = await toggleUserRole(targetUser.id, nextRole);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, role: nextRole } : u))
        );
        setFeedback({
          type: "success",
          text: `Acesso de "${targetUser.name}" alterado para ${nextRole === "ADMIN" ? "Administrador" : "Normal"}.`,
        });
      } else {
        setFeedback({ type: "error", text: res.error || "Erro ao atualizar permissão." });
      }
    } catch {
      setFeedback({ type: "error", text: "Erro ao comunicar com o servidor." });
    } finally {
      setTogglingUserId(null);
    }
  }

  function openPasswordModal(u: AdminUser) {
    setPasswordModalUser(u);
    setModalNewPassword("");
    setModalConfirmPassword("");
    setModalFeedback(null);
  }

  async function handleSaveUserPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordModalUser) return;

    if (modalNewPassword.length < 6) {
      setModalFeedback({ type: "error", text: "A nova senha deve ter no mínimo 6 caracteres." });
      return;
    }

    if (modalNewPassword !== modalConfirmPassword) {
      setModalFeedback({ type: "error", text: "As senhas não coincidem." });
      return;
    }

    setIsChangingUserPassword(true);
    setModalFeedback(null);

    try {
      const res = await adminChangePassword(passwordModalUser.id, modalNewPassword);
      if (res.success) {
        setFeedback({
          type: "success",
          text: `Senha de "${passwordModalUser.name}" alterada com sucesso.`,
        });
        setPasswordModalUser(null);
      } else {
        setModalFeedback({ type: "error", text: res.error || "Erro ao alterar senha." });
      }
    } catch {
      setModalFeedback({ type: "error", text: "Erro ao processar a troca de senha." });
    } finally {
      setIsChangingUserPassword(false);
    }
  }

  async function handleUpdateMyPassword(e: React.FormEvent) {
    e.preventDefault();
    if (myNewPass.length < 6) {
      setFeedback({ type: "error", text: "A nova senha deve conter ao menos 6 caracteres." });
      return;
    }

    if (myNewPass !== myConfirmPass) {
      setFeedback({ type: "error", text: "A confirmação da nova senha não confere." });
      return;
    }

    setIsUpdatingMyPass(true);
    setFeedback(null);

    try {
      const res = await changeOwnPassword(currentPass, myNewPass);
      if (res.success) {
        setFeedback({
          type: "success",
          text: "Sua senha foi alterada com sucesso.",
        });
        setCurrentPass("");
        setMyNewPass("");
        setMyConfirmPass("");
      } else {
        setFeedback({ type: "error", text: res.error || "Erro ao alterar sua senha." });
      }
    } catch {
      setFeedback({ type: "error", text: "Erro ao comunicar com o servidor." });
    } finally {
      setIsUpdatingMyPass(false);
    }
  }

  async function handleUpdateUsername(e: React.FormEvent) {
    e.preventDefault();
    const clean = usernameInput.trim().toLowerCase().replace(/\s+/g, "_");
    if (!clean) return;

    if (clean === currentUsername) {
      setUsernameFeedback({ type: "error", text: "O novo nome de usuário deve ser diferente do atual." });
      return;
    }

    setIsUpdatingUsername(true);
    setUsernameFeedback(null);

    try {
      const res = await updateUsername(clean);
      if (res.success && res.username) {
        setCurrentUsername(res.username);
        setUsernameInput(res.username);
        setIsEditingName(false);
        setUsernameFeedback({
          type: "success",
          text: `Nome de login alterado para "${res.username}". Utilize este novo nome para entrar.`,
        });
        setUsers((prev) =>
          prev.map((u) => (u.id === userSession.id ? { ...u, name: res.username, email: res.username } : u))
        );
      } else {
        setUsernameFeedback({ type: "error", text: res.error || "Erro ao atualizar nome de usuário." });
      }
    } catch {
      setUsernameFeedback({ type: "error", text: "Erro ao comunicar com o servidor." });
    } finally {
      setIsUpdatingUsername(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteModalUser) return;
    setIsDeleting(true);
    try {
      const res = await deleteUser(deleteModalUser.id);
      if (res.success) {
        setUsers((prev) => prev.filter((u) => u.id !== deleteModalUser.id));
        setFeedback({
          type: "success",
          text: `Usuário "${deleteModalUser.name}" excluído.`,
        });
        setDeleteModalUser(null);
      } else {
        setFeedback({ type: "error", text: res.error || "Erro ao excluir usuário." });
      }
    } catch {
      setFeedback({ type: "error", text: "Erro ao excluir usuário." });
    } finally {
      setIsDeleting(false);
    }
  }

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">
            {isAdmin ? "Gerenciamento de Conta e Acessos" : "Meu Perfil"}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {isAdmin
              ? "Gerencie seu perfil, usuários cadastrados e permissões de acesso."
              : "Visualize os dados da sua conta e altere sua senha de acesso."}
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <span><strong className="text-zinc-200 font-medium">{users.length}</strong> {users.length === 1 ? "usuário" : "usuários"}</span>
          </div>
        )}
      </div>

      {/* Global Feedback Alert */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-medium ${
            feedback.type === "success"
              ? "bg-emerald-950/30 border-emerald-800/40 text-emerald-400"
              : "bg-rose-950/30 border-rose-800/40 text-rose-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-zinc-500 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Tabs: Apenas visíveis para Admin */}
      {isAdmin ? (
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-3">
          <div className="flex items-center gap-6 text-sm">
            <button
              onClick={() => setActiveTab("profile")}
              className={`pb-3 font-medium transition-colors relative ${
                activeTab === "profile"
                  ? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#b300e4]"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Meu Perfil
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`pb-3 font-medium transition-colors relative ${
                activeTab === "users"
                  ? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#b300e4]"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Usuários ({users.length})
            </button>
            <button
              onClick={() => setActiveTab("create")}
              className={`pb-3 font-medium transition-colors relative ${
                activeTab === "create"
                  ? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#b300e4]"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Novo Usuário
            </button>
          </div>

          {activeTab === "users" && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Buscar usuário..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-xs bg-zinc-900 border border-white/10 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#b300e4]"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                disabled={isRefreshing}
                onClick={reloadUsers}
                title="Recarregar"
                className="border-white/10 text-zinc-400 hover:text-white rounded-lg h-8 w-8"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
          )}
        </div>
      ) : null}

      {/* ABA 1: MEU PERFIL (Aparece para todos) */}
      {(activeTab === "profile" || !isAdmin) && (
        <div className="space-y-6 max-w-2xl mx-auto">
          {/* Card com Informações da Conta e Alterar Nome de Usuário */}
          <div className="bg-[#141414] border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Dados da Conta
              </h2>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                  userSession.isAdmin
                    ? "bg-zinc-800 text-zinc-200 border border-zinc-700/60"
                    : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                }`}
              >
                {userSession.isAdmin ? "Administrador" : "Usuário Normal"}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center font-semibold text-sm text-zinc-200 uppercase shrink-0">
                  {currentUsername ? currentUsername.slice(0, 1) : "U"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-zinc-400 font-medium">Nome de Login</p>
                  <p className="text-sm font-semibold text-white truncate">
                    {currentUsername}
                  </p>
                </div>
              </div>

              {!isEditingName && (
                <button
                  type="button"
                  onClick={() => {
                    setUsernameInput(currentUsername);
                    setIsEditingName(true);
                    setUsernameFeedback(null);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-white/10 transition-colors flex items-center gap-1.5 self-start sm:self-center"
                >
                  <Pencil className="w-3.5 h-3.5 text-zinc-400" />
                  Editar Nome de Login
                </button>
              )}
            </div>

            {usernameFeedback && (
              <div
                className={`p-2.5 rounded-lg text-xs font-medium mt-3 ${
                  usernameFeedback.type === "success"
                    ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/40"
                    : "bg-rose-950/40 text-rose-400 border border-rose-800/40"
                }`}
              >
                {usernameFeedback.text}
              </div>
            )}

            {isEditingName && (
              <form onSubmit={handleUpdateUsername} className="space-y-3 pt-3 border-t border-white/5 mt-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Novo Nome de Login
                  </label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                    placeholder="Digite o novo nome de usuário"
                    className="w-full h-9 bg-zinc-900 border border-white/10 rounded-lg px-3 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#b300e4] font-mono"
                    autoFocus
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Mínimo 3 caracteres, sem espaços.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditingName(false);
                      setUsernameInput(currentUsername);
                      setUsernameFeedback(null);
                    }}
                    className="h-8 border-white/10 text-zinc-400 hover:text-white rounded-lg text-xs px-3"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUpdatingUsername || usernameInput.trim() === currentUsername || !usernameInput.trim()}
                    className="h-8 bg-[#b300e4] hover:bg-[#9a00c4] text-white font-medium rounded-lg text-xs px-3 disabled:opacity-40"
                  >
                    {isUpdatingUsername ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Card de Conexão com Google e Remetente Bancário */}
          <div className="bg-[#141414] border border-white/10 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#b300e4]/15 border border-[#b300e4]/30 flex items-center justify-center text-[#d246f8]">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white tracking-tight">
                    Sincronização de Transações por E-mail (Gmail)
                  </h2>
                  <p className="text-[11px] text-zinc-400">
                    Importação individual de comprovantes bancários recebidos
                  </p>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1.5 ${
                  googleSettings.isConnected
                    ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/40"
                    : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    googleSettings.isConnected ? "bg-emerald-400" : "bg-zinc-500"
                  }`}
                />
                {googleSettings.isConnected ? "Conectado" : "Não Conectado"}
              </span>
            </div>

            {googleFeedback && (
              <div
                className={`p-3 rounded-lg text-xs font-medium flex items-start justify-between gap-2 ${
                  googleFeedback.type === "success"
                    ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/40"
                    : "bg-rose-950/40 text-rose-400 border border-rose-800/40"
                }`}
              >
                <span>{googleFeedback.text}</span>
                <button
                  type="button"
                  onClick={() => setGoogleFeedback(null)}
                  className="text-zinc-500 hover:text-white shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {!googleSettings.isConnected ? (
              <div className="pt-2 border-t border-white/5 space-y-3">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Conecte sua conta do Google para que o sistema leia com segurança os comprovantes bancários recebidos no seu Gmail e cadastre os lançamentos diretamente na sua conta.
                </p>

                <div className="pt-1">
                  <a
                    href="/api/auth/google"
                    className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-semibold transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    Conectar Conta Google
                  </a>
                </div>

                <div className="p-3 rounded-lg bg-zinc-900/60 border border-white/5 text-[11px] text-zinc-500 space-y-1">
                  <div className="flex items-center gap-1.5 text-zinc-400 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Privacidade e Isolamento
                  </div>
                  <p>
                    A permissão solicitada é restrita à leitura de e-mails (Gmail Readonly) para identificar os comprovantes que você determinar. Suas mensagens pessoais não são compartilhadas nem alteradas.
                  </p>
                </div>
              </div>
            ) : (
              <div className="pt-2 border-t border-white/5 space-y-4">
                {/* E-mail Google Conectado */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-white/5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-zinc-400 font-medium">Conta Google Conectada</p>
                      <p className="text-xs font-semibold text-white truncate">
                        {googleSettings.googleEmail || "Conexão ativa"}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isDisconnectingGoogle}
                    onClick={handleDisconnectGoogle}
                    className="h-7 text-[11px] text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border-rose-900/40 rounded-lg px-2.5 gap-1"
                  >
                    <Unlink className="w-3 h-3" />
                    {isDisconnectingGoogle ? "Desconectando..." : "Desconectar"}
                  </Button>
                </div>

                {/* Formulário para Configurar Múltiplos Remetentes de Bancos e Contas */}
                <form onSubmit={handleSaveBankSyncRules} className="space-y-4 pt-1">
                  <div className="space-y-3">
                    <div className="space-y-0.5">
                      <label className="text-xs font-semibold text-zinc-200">
                        Remetentes de Bancos Autorizados
                      </label>
                      <p className="text-[11px] text-zinc-400">
                        Cadastre os e-mails dos bancos e a conta onde as receitas e despesas devem ser creditadas ou debitadas.
                      </p>
                    </div>

                    {/* Cabeçalho da tabela no desktop para alinhamento perfeito sem quebra de linha */}
                    <div className="hidden sm:grid grid-cols-[1fr_1fr_40px] gap-3 px-1 text-[11px] font-medium text-zinc-400">
                      <div>E-mail do Remetente</div>
                      <div>Conta de Destino</div>
                      <div />
                    </div>

                    <div className="space-y-2.5">
                      {rules.map((rule) => (
                        <div
                          key={rule.id}
                          className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_40px] gap-2.5 sm:gap-3 items-center bg-zinc-900/60 sm:bg-transparent p-3 sm:p-0 rounded-lg sm:rounded-none border border-white/5 sm:border-0"
                        >
                          <div>
                            <label className="sm:hidden block text-[11px] font-medium text-zinc-400 mb-1">
                              E-mail do Remetente
                            </label>
                            <input
                              type="email"
                              value={rule.email}
                              onChange={(e) => handleUpdateRule(rule.id, "email", e.target.value)}
                              placeholder="Ex: noreply@99app.com"
                              className="w-full h-9 bg-zinc-900 border border-white/10 rounded-lg px-3 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#b300e4] font-mono"
                            />
                          </div>

                          <div>
                            <label className="sm:hidden block text-[11px] font-medium text-zinc-400 mb-1">
                              Conta de Destino
                            </label>
                            <div className="relative">
                              <select
                                value={rule.accountId}
                                onChange={(e) => handleUpdateRule(rule.id, "accountId", e.target.value)}
                                className="w-full h-9 bg-zinc-900 border border-white/10 rounded-lg pl-3 pr-8 text-xs text-white focus:outline-none focus:border-[#b300e4] cursor-pointer appearance-none"
                              >
                                <option value="">Automático (criar conta por nome)</option>
                                {googleSettings.availableAccounts?.map((acc) => (
                                  <option key={acc.id} value={acc.id}>
                                    {acc.name} ({acc.type === "CARTAO" ? "Cartão" : "Conta"})
                                  </option>
                                ))}
                              </select>
                              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                                <ChevronDown className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          </div>

                          <div className="flex sm:justify-center">
                            <button
                              type="button"
                              title="Remover este remetente"
                              onClick={() => handleDeleteRule(rule.id)}
                              disabled={rules.length === 1 && !rule.email}
                              className="h-9 w-9 flex items-center justify-center rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-900/40 transition-colors disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-zinc-500 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleAddRule}
                      className="inline-flex items-center gap-1.5 text-xs text-[#d246f8] hover:text-[#e475ff] font-medium transition-colors cursor-pointer self-start sm:self-center"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar outro e-mail de banco
                    </button>

                    <Button
                      type="submit"
                      disabled={isSavingSender || rules.every((r) => !r.email.trim())}
                      className="h-8.5 bg-[#b300e4] hover:bg-[#9a00c4] text-white font-medium rounded-lg text-xs px-4 shadow-sm shadow-[#b300e4]/20 disabled:opacity-40 shrink-0 cursor-pointer"
                    >
                      {isSavingSender ? "Salvando..." : "Salvar Configurações"}
                    </Button>
                  </div>
                </form>

                {/* Ação de Sincronizar Agora */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-zinc-400">
                    Deseja buscar novos comprovantes recebidos agora?
                  </div>
                  <Button
                    type="button"
                    disabled={isSyncingGoogle || rules.every((r) => !r.email.trim())}
                    onClick={handleSyncNow}
                    className="h-8 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 text-xs rounded-lg px-3 gap-1.5 shrink-0 disabled:opacity-40"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingGoogle ? "animate-spin text-[#d246f8]" : ""}`} />
                    {isSyncingGoogle ? "Sincronizando..." : "Sincronizar E-mails"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Card para Trocar Senha */}
          <div className="bg-[#141414] border border-white/10 rounded-xl p-6">
            <div className="mb-5">
              <h2 className="text-base font-semibold text-white">Alterar Senha</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Atualize sua senha de acesso para manter sua conta protegida.
              </p>
            </div>

            <form onSubmit={handleUpdateMyPassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Senha Atual
                </label>
                <input
                  type={showMyPass ? "text" : "password"}
                  required
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  placeholder="Sua senha atual"
                  className="w-full h-9 bg-zinc-900 border border-white/10 rounded-lg px-3 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#b300e4]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Nova Senha
                </label>
                <div className="relative">
                  <input
                    type={showMyPass ? "text" : "password"}
                    required
                    minLength={6}
                    value={myNewPass}
                    onChange={(e) => setMyNewPass(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full h-9 bg-zinc-900 border border-white/10 rounded-lg pl-3 pr-8 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#b300e4] font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMyPass(!showMyPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showMyPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Confirmar Nova Senha
                </label>
                <input
                  type={showMyPass ? "text" : "password"}
                  required
                  minLength={6}
                  value={myConfirmPass}
                  onChange={(e) => setMyConfirmPass(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full h-9 bg-zinc-900 border border-white/10 rounded-lg px-3 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#b300e4] font-mono"
                />
              </div>

              <Button
                type="submit"
                disabled={isUpdatingMyPass}
                className="w-full h-9 bg-[#b300e4] hover:bg-[#9a00c4] text-white font-medium rounded-lg text-xs mt-3"
              >
                {isUpdatingMyPass ? "Salvando..." : "Salvar Nova Senha"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* ABA 2: USUÁRIOS (Somente Admin) */}
      {isAdmin && activeTab === "users" && (
        <div className="bg-[#141414] border border-white/10 rounded-xl overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="p-10 text-center text-zinc-400 space-y-2">
              <Users className="w-8 h-8 mx-auto text-zinc-600" />
              <p className="text-sm font-medium text-zinc-300">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01] text-zinc-400 font-medium">
                    <th className="py-3 px-5">Usuário</th>
                    <th className="py-3 px-5">Acesso</th>
                    <th className="py-3 px-5">Cadastro</th>
                    <th className="py-3 px-5">Dados</th>
                    <th className="py-3 px-5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map((user) => {
                    const isMasterGab = user.name === "gab" || user.email === "gab";
                    const isSelf = user.id === userSession.id || user.name === userSession.name;
                    const isAdminUser = user.role === "ADMIN" || isMasterGab;

                    return (
                      <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                        {/* Usuário */}
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center font-semibold text-zinc-300 uppercase shrink-0">
                              {user.name ? user.name.slice(0, 1) : "U"}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-zinc-200">
                                {user.name || user.email}
                              </span>
                              {isSelf && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] text-zinc-500 bg-white/5">
                                  Você
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Nível de Acesso */}
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                                isAdminUser
                                  ? "bg-zinc-800 text-zinc-200 border border-zinc-700/60"
                                  : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                              }`}
                            >
                              {isAdminUser ? "Administrador" : "Normal"}
                            </span>

                            {!isMasterGab && (
                              <button
                                onClick={() => handleToggleRole(user)}
                                disabled={togglingUserId === user.id}
                                className="text-[11px] text-zinc-400 hover:text-zinc-200 underline-offset-2 hover:underline ml-1"
                              >
                                {togglingUserId === user.id
                                  ? "Salvando..."
                                  : isAdminUser
                                  ? "Tornar Normal"
                                  : "Tornar Admin"}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Data */}
                        <td className="py-3 px-5 text-zinc-400 text-[11px]">
                          {new Date(user.createdAt).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </td>

                        {/* Atividade */}
                        <td className="py-3 px-5 text-zinc-400 text-[11px]">
                          {user._count.transactions} transações • {user._count.accounts} contas
                        </td>

                        {/* Ações */}
                        <td className="py-3 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openPasswordModal(user)}
                              className="px-2.5 py-1 rounded-md text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-white/10 transition-colors"
                            >
                              Trocar Senha
                            </button>

                            {!isMasterGab && !isSelf && (
                              <button
                                onClick={() => setDeleteModalUser(user)}
                                title="Excluir usuário"
                                className="p-1 rounded text-zinc-500 hover:text-rose-400 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ABA 3: NOVO USUÁRIO (Somente Admin) */}
      {isAdmin && activeTab === "create" && (
        <div className="bg-[#141414] border border-white/10 rounded-xl p-6 max-w-lg mx-auto">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-white">Criar Nova Conta</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              O novo usuário terá seu espaço de finanças isolado.
            </p>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Nome de Login
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                placeholder="Ex: ana_silva"
                className="w-full h-9 bg-zinc-900 border border-white/10 rounded-lg px-3 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#b300e4]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-zinc-300">
                  Senha Provisória
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const generated = generateRandomPassword();
                    setNewPassword(generated);
                    setShowNewPassword(true);
                  }}
                  className="text-[11px] text-zinc-400 hover:text-zinc-200"
                >
                  Gerar senha
                </button>
              </div>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full h-9 bg-zinc-900 border border-white/10 rounded-lg pl-3 pr-8 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#b300e4] font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Nível de Permissão
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNewRole("USER")}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    newRole === "USER"
                      ? "bg-white/5 border-white/30 text-white"
                      : "bg-zinc-900 border-white/5 text-zinc-400 hover:border-white/15"
                  }`}
                >
                  <p className="text-xs font-medium text-white">Normal</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Acesso somente às finanças pessoais</p>
                </button>

                <button
                  type="button"
                  onClick={() => setNewRole("ADMIN")}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    newRole === "ADMIN"
                      ? "bg-white/5 border-white/30 text-white"
                      : "bg-zinc-900 border-white/5 text-zinc-400 hover:border-white/15"
                  }`}
                >
                  <p className="text-xs font-medium text-white">Administrador</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Acesso total e gestão de usuários</p>
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isCreating}
              className="w-full h-9 bg-[#b300e4] hover:bg-[#9a00c4] text-white font-medium rounded-lg text-xs mt-3"
            >
              {isCreating ? "Cadastrando..." : "Cadastrar Usuário"}
            </Button>
          </form>
        </div>
      )}

      {/* MODAL: REDEFINIR SENHA DE OUTRO USUÁRIO (Admin) */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-white/10 rounded-xl w-full max-w-sm p-5 shadow-2xl relative">
            <button
              onClick={() => setPasswordModalUser(null)}
              className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-white">Redefinir Senha</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Usuário: <span className="font-medium text-white">{passwordModalUser.name}</span>
              </p>
            </div>

            {modalFeedback && (
              <div
                className={`p-2.5 rounded-lg text-xs font-medium mb-3 ${
                  modalFeedback.type === "success"
                    ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/40"
                    : "bg-rose-950/40 text-rose-400 border border-rose-800/40"
                }`}
              >
                {modalFeedback.text}
              </div>
            )}

            <form onSubmit={handleSaveUserPassword} className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-zinc-300">Nova Senha</label>
                  <button
                    type="button"
                    onClick={() => {
                      const gen = generateRandomPassword();
                      setModalNewPassword(gen);
                      setModalConfirmPassword(gen);
                      setShowModalPassword(true);
                    }}
                    className="text-[11px] text-zinc-400 hover:text-zinc-200"
                  >
                    Gerar senha
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showModalPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={modalNewPassword}
                    onChange={(e) => setModalNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full h-8 bg-zinc-900 border border-white/10 rounded-lg pl-3 pr-8 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#b300e4] font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowModalPassword(!showModalPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showModalPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Confirmar Senha</label>
                <input
                  type={showModalPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={modalConfirmPassword}
                  onChange={(e) => setModalConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  className="w-full h-8 bg-zinc-900 border border-white/10 rounded-lg px-3 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#b300e4] font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPasswordModalUser(null)}
                  className="border-white/10 text-zinc-300 hover:text-white rounded-lg h-8 text-xs px-3"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isChangingUserPassword}
                  className="bg-[#b300e4] hover:bg-[#9a00c4] text-white font-medium rounded-lg h-8 text-xs px-3"
                >
                  {isChangingUserPassword ? "Salvando..." : "Salvar Senha"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR EXCLUSÃO (Admin) */}
      {deleteModalUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-white/10 rounded-xl w-full max-w-sm p-5 shadow-2xl relative">
            <h3 className="text-sm font-semibold text-white mb-2">Excluir Usuário</h3>
            <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
              Deseja realmente remover o usuário <span className="text-white font-medium">{deleteModalUser.name}</span>? Todos os dados vinculados a ele serão excluídos.
            </p>

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteModalUser(null)}
                className="border-white/10 text-zinc-300 hover:text-white rounded-lg h-8 text-xs px-3"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg h-8 text-xs px-3"
              >
                {isDeleting ? "Excluindo..." : "Excluir"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
