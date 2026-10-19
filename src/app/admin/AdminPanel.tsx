"use client";

import { useState } from "react";
import {
  registerUser,
  listUsers,
  toggleUserRole,
  adminChangePassword,
  changeOwnPassword,
  deleteUser,
} from "../actions/authActions";
import { Button } from "@/components/ui/Button";
import {
  Users,
  UserPlus,
  KeyRound,
  Lock,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  X,
  Eye,
  EyeOff,
} from "lucide-react";

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

interface AdminPanelProps {
  initialUsers: AdminUser[];
  currentUserId?: string;
  currentUserName?: string;
}

export function AdminPanel({
  initialUsers = [],
  currentUserId,
  currentUserName,
}: AdminPanelProps) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [activeTab, setActiveTab] = useState<"list" | "create" | "my-password">("list");
  const [search, setSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Estados de criação de usuário
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"USER" | "ADMIN">("USER");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Estados do Modal de Troca de Senha de Usuário
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

  // Estados de exclusão
  const [deleteModalUser, setDeleteModalUser] = useState<AdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Loading individual de alternância de papel
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

  async function reloadUsers() {
    setIsRefreshing(true);
    try {
      const res = await listUsers();
      if (res.success && res.users) {
        setUsers(res.users);
      }
    } catch {
      setFeedback({ type: "error", text: "Erro ao recarregar usuários." });
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
        setActiveTab("list");
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

  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === "ADMIN" || u.name === "gab").length;

  return (
    <div className="space-y-6">
      {/* Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Usuários e Permissões</h1>
          <p className="text-xs text-zinc-400 mt-1">Gerencie os acessos do sistema e credenciais das contas.</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span><strong className="text-zinc-200 font-medium">{totalUsers}</strong> {totalUsers === 1 ? "usuário" : "usuários"}</span>
          <span className="w-1 h-1 rounded-full bg-zinc-700" />
          <span><strong className="text-zinc-200 font-medium">{adminCount}</strong> {adminCount === 1 ? "admin" : "admins"}</span>
        </div>
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

      {/* Clean Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-3">
        <div className="flex items-center gap-6 text-sm">
          <button
            onClick={() => setActiveTab("list")}
            className={`pb-3 font-medium transition-colors relative ${
              activeTab === "list"
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
          <button
            onClick={() => setActiveTab("my-password")}
            className={`pb-3 font-medium transition-colors relative ${
              activeTab === "my-password"
                ? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#b300e4]"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Minha Senha
          </button>
        </div>

        {activeTab === "list" && (
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

      {/* TAB 1: LISTA DE USUÁRIOS */}
      {activeTab === "list" && (
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
                    const isSelf = user.id === currentUserId || user.name === currentUserName;
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

      {/* TAB 2: CRIAR NOVO USUÁRIO */}
      {activeTab === "create" && (
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

      {/* TAB 3: TROCAR MINHA PRÓPRIA SENHA */}
      {activeTab === "my-password" && (
        <div className="bg-[#141414] border border-white/10 rounded-xl p-6 max-w-lg mx-auto">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-white">Alterar Minha Senha</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Atualize sua senha de acesso ao sistema.</p>
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
                placeholder="Senha atual"
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
      )}

      {/* MODAL: REDEFINIR SENHA DE OUTRO USUÁRIO */}
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

      {/* MODAL: CONFIRMAR EXCLUSÃO */}
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
