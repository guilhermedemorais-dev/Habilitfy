import { useEffect, useRef, useState } from "react";
import {
  Camera,
  FileCheck2,
  KeyRound,
  Loader2,
  Save,
  UserRound,
} from "lucide-react";
import type { User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { KycResubmissionModal } from "@/components/kyc/KycResubmissionModal";

type AccountModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null | undefined;
};

export function AccountModal({ open, onOpenChange, user }: AccountModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarData, setAvatarData] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [kycModalOpen, setKycModalOpen] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setFirstName(user.firstName || "");
    setLastName(user.lastName || "");
    setAvatarPreview(user.profileImageUrl || null);
    setAvatarData(null);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }, [open, user]);

  if (!user) return null;

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Usuário";
  const initials = [user.firstName, user.lastName]
    .filter(Boolean)
    .map((part) => part?.[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

  const handleAvatarSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error("Use uma imagem JPG, PNG ou WebP.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      setAvatarData(result);
      setAvatarPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    if (!firstName.trim()) {
      toast.error("Informe seu nome.");
      return;
    }

    setSavingProfile(true);
    try {
      await apiRequest("PATCH", "/api/users/me", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      if (avatarData) {
        await apiRequest("POST", "/api/users/me/avatar", { imageData: avatarData });
      }
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      await queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
      setAvatarData(null);
      toast.success("Perfil atualizado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o perfil.");
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    if (newPassword.length < 8) {
      toast.error("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As novas senhas não coincidem.");
      return;
    }

    setSavingPassword(true);
    try {
      await apiRequest("POST", "/api/users/me/password", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Senha atualizada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar a senha.");
    } finally {
      setSavingPassword(false);
    }
  };

  const canRetryKyc = (user.role === "student" || user.role === "instructor") && user.kycStatus === "rejected";
  const tabCount = 2 + (canRetryKyc ? 1 : 0);

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-lg p-0">
        <DialogHeader className="border-b px-6 py-5 text-left">
          <DialogTitle>Minha conta</DialogTitle>
          <DialogDescription>Atualize seus dados de acesso e perfil.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="px-6 pb-6">
          <TabsList className={`mt-5 grid w-full ${tabCount === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
            <TabsTrigger value="profile"><UserRound className="mr-2 h-4 w-4" />Perfil</TabsTrigger>
            <TabsTrigger value="password"><KeyRound className="mr-2 h-4 w-4" />Senha</TabsTrigger>
            {canRetryKyc ? <TabsTrigger value="kyc"><FileCheck2 className="mr-2 h-4 w-4" />KYC</TabsTrigger> : null}
          </TabsList>

          <TabsContent value="profile" className="mt-6 space-y-5 outline-none focus-visible:ring-0 focus-visible:ring-offset-0">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border">
                {avatarPreview ? <AvatarImage src={avatarPreview} alt={fullName} className="object-cover" /> : null}
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{fullName}</p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarSelection}
                />
                <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => fileInputRef.current?.click()}>
                  <Camera className="mr-2 h-4 w-4" />Trocar foto
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="account-first-name">Nome</Label>
                <Input id="account-first-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} maxLength={255} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-last-name">Sobrenome</Label>
                <Input id="account-last-name" value={lastName} onChange={(event) => setLastName(event.target.value)} maxLength={255} />
              </div>
            </div>

            <Button className="w-full" onClick={saveProfile} disabled={savingProfile}>
              {savingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar perfil
            </Button>
          </TabsContent>

          <TabsContent value="password" className="mt-6 space-y-4 outline-none focus-visible:ring-0 focus-visible:ring-offset-0">
            <div className="space-y-2">
              <Label htmlFor="account-current-password">Senha atual</Label>
              <Input id="account-current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
              <p className="text-xs text-slate-500">Contas criadas pelo Google podem deixar este campo vazio ao definir a primeira senha.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-new-password">Nova senha</Label>
              <Input id="account-new-password" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-confirm-password">Confirmar nova senha</Label>
              <Input id="account-confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            </div>
            <Button className="w-full" onClick={savePassword} disabled={savingPassword}>
              {savingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
              Atualizar senha
            </Button>
          </TabsContent>

          {canRetryKyc ? (
            <TabsContent value="kyc" className="mt-6 space-y-4 outline-none focus-visible:ring-0 focus-visible:ring-offset-0">
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-900">Verificação recusada</p>
                <p className="mt-1 text-sm text-red-700">Você pode corrigir as imagens e enviar uma nova tentativa. O envio anterior continuará registrado para auditoria.</p>
              </div>
              <Button className="w-full" onClick={() => { onOpenChange(false); setKycModalOpen(true); }}>
                <FileCheck2 className="mr-2 h-4 w-4" />Refazer verificação de identidade
              </Button>
            </TabsContent>
          ) : null}
        </Tabs>
      </DialogContent>
    </Dialog>
    {canRetryKyc ? <KycResubmissionModal open={kycModalOpen} onOpenChange={setKycModalOpen} user={user} /> : null}
    </>
  );
}
