"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Mail, UserCheck, UserX, Shield, Edit, Trash2, Loader2, Check, X, ChevronDown, Send, MoreVertical, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

type Member = {
  id: string;
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  role: "owner" | "admin" | "designer" | "editor" | "viewer";
  status: "active" | "pending";
  createdAt: string;
};

const ROLE_LABELS: Record<Member["role"], string> = {
  owner: "Proprietário",
  admin: "Admin",
  designer: "Designer",
  editor: "Editor",
  viewer: "Visualizador",
};

const ROLE_HIERARCHY: Member["role"][] = ["owner", "admin", "designer", "editor", "viewer"];

interface EquipeClientProps {
  initialOrg: {
    id: string;
    name: string;
    slug: string;
  } | null;
  initialUser: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    emailAddresses: Array<{ emailAddress: string }>;
    imageUrl: string;
  } | null;
}

export default function EquipeClient({ initialOrg, initialUser }: EquipeClientProps) {
  const router = useRouter();
  const [org] = useState(initialOrg);
  const [currentUserId] = useState(initialUser?.id);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<Member["role"]>("designer");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<Member["role"]>("designer");
  const [roleMenuOpen, setRoleMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    loadMembers();
  }, [org?.id]);

  async function loadMembers() {
    if (!org?.id) return;
    try {
      const res = await fetch(`/api/configuracao/equipe?orgId=${org.id}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!newMemberEmail.trim() || !newMemberEmail.includes("@")) return;
    if (!org?.id) return;

    setInviting(true);
    try {
      const res = await fetch("/api/configuracao/equipe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orgId: org.id, email: newMemberEmail.trim(), role: newMemberRole }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Erro ao convidar");
      }

      setNewMemberEmail("");
      await loadMembers();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setInviting(false);
    }
  }

  async function handleRoleChange(memberId: string, newRole: Member["role"]) {
    if (!org?.id) return;

    try {
      const res = await fetch(`/api/configuracao/equipe/${memberId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orgId: org.id, role: newRole }),
      });

      if (!res.ok) throw new Error("Erro ao alterar role");

      setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)));
      setEditingId(null);
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async function handleRemove(memberId: string) {
    if (!org?.id) return;
    if (!confirm("Tem certeza que deseja remover este membro?")) return;

    try {
      const res = await fetch(`/api/configuracao/equipe/${memberId}`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orgId: org.id }),
      });

      if (!res.ok) throw new Error("Erro ao remover membro");

      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err) {
      alert((err as Error).message);
    }
  }

  function canManage(currentUserRole: Member["role"], targetUserRole: Member["role"]): boolean {
    const currentLevel = ROLE_HIERARCHY.indexOf(currentUserRole);
    const targetLevel = ROLE_HIERARCHY.indexOf(targetUserRole);
    return currentLevel < targetLevel;
  }

  const currentUserMember = members.find((m) => m.userId === currentUserId);
  const currentUserRole = currentUserMember?.role ?? "viewer";

  if (!org) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center text-parchment-400"
        >
          Carregando...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl py-8 px-4">
      <div className="mb-8">
        <h1 className="font-display text-3xl tracking-wide text-parchment-100">Equipe</h1>
        <p className="mt-2 text-parchment-500">Gerencie membros e permissões da {org.name}</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-gold-500/15 bg-ink-900/60 p-6"
      >
        <h2 className="mb-4 font-display text-xl text-parchment-100">Convidar novo membro</h2>
        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
          <input
            value={newMemberEmail}
            onChange={(e) => setNewMemberEmail(e.target.value)}
            placeholder="email@exemplo.com"
            type="email"
            className="flex-1 rounded-xl border border-gold-500/15 bg-ink-900/70 px-4 py-3 text-sm text-parchment-100 outline-none transition-colors placeholder:text-parchment-500/60 focus:border-gold-400/50"
          />
          <select
            value={newMemberRole}
            onChange={(e) => setNewMemberRole(e.target.value as Member["role"])}
            className="w-full sm:w-48 rounded-xl border border-gold-500/15 bg-ink-900/70 px-3 py-3 text-sm text-parchment-100 outline-none transition-colors focus:border-gold-400/50"
          >
            <option value="designer">Designer</option>
            <option value="editor">Editor</option>
            <option value="viewer">Visualizador</option>
          </select>
          <motion.button
            type="submit"
            disabled={inviting || !newMemberEmail.trim() || !newMemberEmail.includes("@")}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-700 px-6 py-3 text-sm font-semibold text-ink-950 shadow-glow disabled:cursor-not-allowed disabled:opacity-40"
          >
            {inviting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
            Convidar
          </motion.button>
        </form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-6 rounded-2xl border border-gold-500/15 bg-ink-900/60 overflow-hidden"
      >
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-ink-900/50 border border-gold-500/10" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-gold-500/10">
            {members.map((member) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between px-6 py-4 hover:bg-gold-500/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={member.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.firstName || member.email)}&background=1a1a2e&color=bb9e49`}
                    alt={member.firstName || member.email}
                    className="h-10 w-10 rounded-full bg-ink-900"
                  />
                  <div>
                    <p className="font-medium text-parchment-100">
                      {member.firstName || member.lastName ? `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim() : member.email}
                    </p>
                    <p className="text-sm text-parchment-500">{member.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          member.status === "pending"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        {member.status === "pending" ? (
                          <>
                            <Clock className="h-3 w-3" />
                            Pendente
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-3 w-3" />
                            Ativo
                          </>
                        )}
                      </span>
                      <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium text-parchment-400 border-gold-500/20 bg-gold-500/5">
                        {ROLE_LABELS[member.role]}
                      </span>
                      {member.role === "owner" && (
                        <Shield className="h-3.5 w-3.5 text-gold-400" aria-label="Proprietário" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {member.status === "pending" && (
                    <button
                      onClick={() => handleRoleChange(member.id, member.role)}
                      disabled={!canManage(currentUserRole, member.role) || member.userId === currentUserId}
                      className="p-2 rounded-lg text-parchment-400 hover:text-gold-300 hover:bg-gold-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="Reenviar convite"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  )}

                  <div className="relative">
                    <button
                      onClick={() => setRoleMenuOpen(roleMenuOpen === member.id ? null : member.id)}
                      className="p-2 rounded-lg text-parchment-400 hover:text-parchment-100 hover:bg-gold-500/10 transition-colors"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {roleMenuOpen === member.id && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-1 w-40 rounded-xl border border-gold-500/15 bg-ink-900/95 py-1 shadow-xl z-10"
                      >
                        {ROLE_HIERARCHY.filter((r) => canManage(currentUserRole, r) && r !== member.role).map((r) => (
                          <button
                            key={r}
                            onClick={() => handleRoleChange(member.id, r)}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-parchment-300 hover:bg-gold-500/10 hover:text-gold-200 ${editRole === r ? "bg-gold-500/10 text-gold-300" : ""}`}
                          >
                            {editRole === r && <Check className="h-4 w-4" />}
                            {ROLE_LABELS[r]}
                          </button>
                        ))}
                        <hr className="my-1 border-gold-500/10" />
                        {canManage(currentUserRole, member.role) && member.userId !== currentUserId && (
                          <button
                            onClick={() => handleRemove(member.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remover
                          </button>
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {members.length === 0 && (
              <div className="p-8 text-center text-parchment-500">
                Nenhum membro além de você. Convide sua equipe acima!
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}