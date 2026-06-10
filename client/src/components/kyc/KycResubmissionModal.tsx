import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, FileCheck2, Loader2, ShieldCheck, Upload } from "lucide-react";
import type { User } from "@shared/schema";
import { SelfieCapture } from "@/components/SelfieCapture";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast } from "sonner";

type KycResubmissionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
};

type Documents = {
  documentFront: string;
  documentBack: string;
  cnhFront: string;
  cnhBack: string;
  credential: string;
  license: string;
  theoreticalProof: string;
};

const emptyDocuments: Documents = {
  documentFront: "",
  documentBack: "",
  cnhFront: "",
  cnhBack: "",
  credential: "",
  license: "",
  theoreticalProof: "",
};

function UploadField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const selectFile = (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Use uma imagem JPG, PNG ou WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Cada imagem deve ter no máximo 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  return (
    <label className={`flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 text-center transition-colors ${value ? "border-emerald-400 bg-emerald-50" : "border-slate-300 hover:bg-slate-50"}`}>
      {value ? <Check className="mb-2 h-6 w-6 text-emerald-600" /> : <Upload className="mb-2 h-6 w-6 text-slate-400" />}
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <span className="mt-1 text-xs text-slate-500">{value ? "Arquivo selecionado" : "JPG, PNG ou WebP, até 5 MB"}</span>
      <input className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => selectFile(event.target.files?.[0])} />
    </label>
  );
}

export function KycResubmissionModal({ open, onOpenChange, user }: KycResubmissionModalProps) {
  const [step, setStep] = useState(1);
  const [documents, setDocuments] = useState<Documents>(emptyDocuments);
  const [selfie, setSelfie] = useState("");
  const [isLicensed, setIsLicensed] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isInstructor = user.role === "instructor";

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setDocuments(emptyDocuments);
    setSelfie("");
    setIsLicensed(false);
    setConsentAccepted(false);
  }, [open]);

  const setDocument = (key: keyof Documents, value: string) => {
    setDocuments((current) => ({ ...current, [key]: value }));
  };

  const documentsComplete = isInstructor
    ? Boolean(documents.cnhFront && documents.cnhBack && documents.credential)
    : Boolean(documents.documentFront && documents.documentBack && (isLicensed ? documents.license : documents.theoreticalProof));

  const next = () => {
    if (step === 1 && !documentsComplete) {
      toast.error("Envie todos os documentos obrigatórios.");
      return;
    }
    if (step === 2 && !selfie) {
      toast.error("Capture uma selfie para continuar.");
      return;
    }
    setStep((current) => Math.min(3, current + 1));
  };

  const submit = async () => {
    if (!consentAccepted) {
      toast.error("Aceite o consentimento para enviar os documentos.");
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest("POST", "/api/kyc/consent", { sourceScreen: "account_kyc_resubmission" });
      await apiRequest("POST", "/api/kyc/resubmit", {
        selfie,
        isLicensed,
        ...documents,
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      await queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
      toast.success("Documentos reenviados para análise.");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível reenviar os documentos.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto rounded-lg p-0">
        <DialogHeader className="border-b px-6 py-5 text-left">
          <DialogTitle>Refazer verificação de identidade</DialogTitle>
          <DialogDescription>Etapa {step} de 3: {step === 1 ? "documentos" : step === 2 ? "selfie" : "confirmação"}.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 px-6 pb-6">
          <div className="grid grid-cols-3 gap-2 pt-5" aria-label="Progresso do reenvio de KYC">
            {[1, 2, 3].map((item) => <div key={item} className={`h-1.5 rounded-full ${item <= step ? "bg-primary" : "bg-slate-200"}`} />)}
          </div>

          {step === 1 ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-4">
                <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <p className="text-sm text-slate-600">Envie fotos legíveis, sem cortes, reflexos ou dados encobertos.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {isInstructor ? (
                  <>
                    <UploadField label="CNH - frente" value={documents.cnhFront} onChange={(value) => setDocument("cnhFront", value)} />
                    <UploadField label="CNH - verso" value={documents.cnhBack} onChange={(value) => setDocument("cnhBack", value)} />
                    <div className="sm:col-span-2"><UploadField label="Credencial de instrutor" value={documents.credential} onChange={(value) => setDocument("credential", value)} /></div>
                  </>
                ) : (
                  <>
                    <UploadField label="Documento - frente" value={documents.documentFront} onChange={(value) => setDocument("documentFront", value)} />
                    <UploadField label="Documento - verso" value={documents.documentBack} onChange={(value) => setDocument("documentBack", value)} />
                    <div className="flex items-start gap-3 rounded-lg border p-4 sm:col-span-2">
                      <Checkbox id="kyc-is-licensed" checked={isLicensed} onCheckedChange={(value) => setIsLicensed(value === true)} />
                      <Label htmlFor="kyc-is-licensed" className="cursor-pointer leading-5">Já possuo CNH</Label>
                    </div>
                    <div className="sm:col-span-2">
                      {isLicensed
                        ? <UploadField label="CNH aberta" value={documents.license} onChange={(value) => setDocument("license", value)} />
                        : <UploadField label="LADV ou comprovante do exame teórico" value={documents.theoreticalProof} onChange={(value) => setDocument("theoreticalProof", value)} />}
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : null}

          {step === 2 ? <SelfieCapture onCapture={setSelfie} /> : null}

          {step === 3 ? (
            <div className="space-y-5">
              <div className="flex items-start gap-3 rounded-lg bg-blue-50 p-4 text-blue-900">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Revisão manual</p>
                  <p className="mt-1 text-sm">A tentativa anterior será preservada no histórico. Este novo envio voltará ao status pendente para análise do administrador.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border p-4">
                <Checkbox id="kyc-consent" checked={consentAccepted} onCheckedChange={(value) => setConsentAccepted(value === true)} />
                <Label htmlFor="kyc-consent" className="cursor-pointer text-sm leading-5">Autorizo o tratamento destes dados e imagens exclusivamente para validação de identidade e segurança da plataforma.</Label>
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between border-t pt-5">
            <Button type="button" variant="outline" onClick={() => step === 1 ? onOpenChange(false) : setStep((current) => current - 1)} disabled={submitting}>
              <ArrowLeft className="mr-2 h-4 w-4" />{step === 1 ? "Cancelar" : "Voltar"}
            </Button>
            {step < 3 ? (
              <Button type="button" onClick={next}>Continuar<ArrowRight className="ml-2 h-4 w-4" /></Button>
            ) : (
              <Button type="button" onClick={submit} disabled={submitting || !consentAccepted}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}Enviar para análise
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
