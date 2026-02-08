import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronRight, ChevronLeft, Upload, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { SelfieCapture } from "@/components/SelfieCapture";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ProgressDots } from "@/components/ui/ProgressDots";
import { maskCNPJ, maskPhone, maskCEP, isValidCNPJ, BRAZILIAN_STATES } from "@/lib/validators";

// Google Icon
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export default function SignupInstructor() {
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const [googleUser, setGoogleUser] = useState<{
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  } | null>(null);

  const [form, setForm] = useState({
    // Step 1: Dados da Empresa
    fullName: "",
    cnpj: "",
    phone: "",
    addressLine: "",
    zipCode: "",
    neighborhood: "",
    city: "",
    state: "",
    // Step 2: Documentos
    cnhFrontImageUrl: "",
    cnhBackImageUrl: "",
    credentialImageUrl: "",
    // Step 3: Selfie
    selfieImageUrl: "",
    // Step 4: Conta
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  // Detectar Google OAuth callback
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('google_connected') === 'true') {
      fetch('/api/auth/pending-google-user', { credentials: 'include' })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setGoogleUser(data);
            setForm(prev => ({
              ...prev,
              fullName: `${data.firstName || ''} ${data.lastName || ''}`.trim() || prev.fullName,
              email: data.email || prev.email,
            }));
            toast({
              title: "Google conectado!",
              description: "Preencha os dados restantes para completar o cadastro.",
            });
          }
        })
        .catch(console.error);
      window.history.replaceState({}, '', '/signup-instructor');
    }
  }, [toast]);

  const totalSteps = 4;

  const updateForm = (field: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Falha ao ler arquivo"));
      reader.readAsDataURL(file);
    });

  const handleFile = async (field: keyof typeof form, fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    try {
      const dataUrl = await readFileAsDataUrl(fileList[0]);
      updateForm(field, dataUrl);
    } catch {
      setError("Não foi possível carregar o arquivo.");
    }
  };

  const validateStep = () => {
    const nextErrors: Record<string, string> = {};
    const requireField = (field: keyof typeof form, label: string) => {
      const value = form[field];
      if (typeof value === "string" && value.trim()) return;
      if (typeof value === "boolean" && value) return;
      nextErrors[field] = `${label} é obrigatório.`;
    };

    if (step === 1) {
      requireField("fullName", "Nome Completo");
      requireField("cnpj", "CNPJ");
      requireField("phone", "WhatsApp");
      requireField("addressLine", "Endereço");
      requireField("zipCode", "CEP");
      requireField("neighborhood", "Bairro");
      requireField("city", "Cidade");
      requireField("state", "Estado");
      // Validação real de CNPJ
      if (form.cnpj && !isValidCNPJ(form.cnpj)) {
        nextErrors["cnpj"] = "CNPJ inválido.";
      }
    }

    if (step === 2) {
      requireField("cnhFrontImageUrl", "Frente da CNH");
      requireField("cnhBackImageUrl", "Verso da CNH");
      requireField("credentialImageUrl", "Credencial de Instrutor");
    }

    if (step === 3) {
      requireField("selfieImageUrl", "Selfie");
    }

    if (step === 4) {
      requireField("email", "E-mail");
      // Senha só é obrigatória se NÃO estiver usando Google
      if (!googleUser) {
        requireField("password", "Senha");
        requireField("confirmPassword", "Confirmação de senha");
        if (form.password && form.confirmPassword && form.password !== form.confirmPassword) {
          nextErrors["confirmPassword"] = "As senhas não conferem.";
        }
      }
      if (!form.acceptTerms) {
        nextErrors["acceptTerms"] = "Você deve aceitar os termos.";
      }
    }

    return nextErrors;
  };

  const getError = (field: keyof typeof form) => fieldErrors[field];

  const handleNext = async () => {
    setError(null);
    const nextErrors = validateStep();
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    if (step < totalSteps) {
      setFieldErrors({});
      setStep(step + 1);
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/users/register", {
        ...form,
        role: "instructor",
        firstName: form.fullName.split(" ")[0],
        lastName: form.fullName.split(" ").slice(1).join(" "),
        googleId: googleUser?.googleId || undefined,
      });

      toast({
        title: "Cadastro realizado!",
        description: "Seu cadastro está em análise. Você receberá um e-mail quando for aprovado.",
      });
      setLocation("/login");
    } catch (err: any) {
      setError(err?.message || "Não foi possível enviar o cadastro.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = "/api/auth/google";
  };

  const stepTitles: Record<number, string> = {
    1: "Dados da Empresa",
    2: "Documentos",
    3: "Verificação Facial",
    4: "Criar Conta",
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header Fixo */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Home</span>
          </Link>
          <ProgressDots currentStep={step} totalSteps={totalSteps} />
        </div>
      </header>

      {/* Título do Step */}
      <div className="px-6 pt-6 pb-4 max-w-lg mx-auto w-full">
        <h1 className="text-2xl font-bold text-gray-900">Cadastro de Instrutor</h1>
        <p className="text-gray-500 text-sm mt-1">Passo {step} de {totalSteps}</p>
        <div className="mt-4">
          <h2 className="text-lg font-semibold text-gray-800 border-b-2 border-emerald-500 pb-2 inline-block">
            {stepTitles[step]}
          </h2>
        </div>
      </div>

      {/* Conteúdo do Step */}
      <main className="flex-1 px-6 pb-32 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Step 1: Dados da Empresa */}
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Nome Completo</Label>
                  <Input
                    value={form.fullName}
                    onChange={(e) => updateForm("fullName", e.target.value)}
                    placeholder="Seu nome completo"
                    className={`h-14 rounded-2xl bg-gray-50 border-gray-200 ${getError("fullName") ? "border-red-500" : ""}`}
                  />
                  {getError("fullName") && <p className="text-xs text-red-600">{getError("fullName")}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">CNPJ</Label>
                  <Input
                    value={form.cnpj}
                    onChange={(e) => updateForm("cnpj", maskCNPJ(e.target.value))}
                    placeholder="00.000.000/0000-00"
                    className={`h-14 rounded-2xl bg-gray-50 border-gray-200 ${getError("cnpj") ? "border-red-500" : ""}`}
                  />
                  {getError("cnpj") && <p className="text-xs text-red-600">{getError("cnpj")}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">WhatsApp</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => updateForm("phone", maskPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    className={`h-14 rounded-2xl bg-gray-50 border-gray-200 ${getError("phone") ? "border-red-500" : ""}`}
                  />
                  {getError("phone") && <p className="text-xs text-red-600">{getError("phone")}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Endereço (Rua, Número)</Label>
                  <Input
                    value={form.addressLine}
                    onChange={(e) => updateForm("addressLine", e.target.value)}
                    placeholder="Rua, número"
                    className={`h-14 rounded-2xl bg-gray-50 border-gray-200 ${getError("addressLine") ? "border-red-500" : ""}`}
                  />
                  {getError("addressLine") && <p className="text-xs text-red-600">{getError("addressLine")}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">CEP</Label>
                    <Input
                      value={form.zipCode}
                      onChange={(e) => updateForm("zipCode", maskCEP(e.target.value))}
                      placeholder="00000-000"
                      className={`h-14 rounded-2xl bg-gray-50 border-gray-200 ${getError("zipCode") ? "border-red-500" : ""}`}
                    />
                    {getError("zipCode") && <p className="text-xs text-red-600">{getError("zipCode")}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Bairro</Label>
                    <Input
                      value={form.neighborhood}
                      onChange={(e) => updateForm("neighborhood", e.target.value)}
                      placeholder="Bairro"
                      className={`h-14 rounded-2xl bg-gray-50 border-gray-200 ${getError("neighborhood") ? "border-red-500" : ""}`}
                    />
                    {getError("neighborhood") && <p className="text-xs text-red-600">{getError("neighborhood")}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Cidade</Label>
                    <Input
                      value={form.city}
                      onChange={(e) => updateForm("city", e.target.value)}
                      placeholder="Cidade"
                      className={`h-14 rounded-2xl bg-gray-50 border-gray-200 ${getError("city") ? "border-red-500" : ""}`}
                    />
                    {getError("city") && <p className="text-xs text-red-600">{getError("city")}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">UF</Label>
                    <select
                      value={form.state}
                      onChange={(e) => updateForm("state", e.target.value)}
                      className={`flex h-14 w-full rounded-2xl border bg-gray-50 px-4 text-base ${getError("state") ? "border-red-500" : "border-gray-200"}`}
                    >
                      <option value="">Selecione</option>
                      {BRAZILIAN_STATES.map((uf) => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                    {getError("state") && <p className="text-xs text-red-600">{getError("state")}</p>}
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Documentos */}
            {step === 2 && (
              <>
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl text-blue-800 text-sm flex gap-3 mb-4">
                  <Upload className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Envie seus documentos</p>
                    <p>Fotos da CNH (frente e verso) e sua credencial de instrutor do Detran.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">CNH (Frente)</Label>
                    <label className={`flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors ${form.cnhFrontImageUrl ? "border-green-500 bg-green-50" : "border-gray-300"}`}>
                      {form.cnhFrontImageUrl ? (
                        <img src={form.cnhFrontImageUrl} alt="CNH Frente" className="h-full w-full object-cover rounded-2xl" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-gray-400 mb-1" />
                          <span className="text-xs text-gray-500">Upload</span>
                        </>
                      )}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFile("cnhFrontImageUrl", e.target.files)}
                      />
                    </label>
                    {getError("cnhFrontImageUrl") && <p className="text-xs text-red-600">{getError("cnhFrontImageUrl")}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">CNH (Verso)</Label>
                    <label className={`flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors ${form.cnhBackImageUrl ? "border-green-500 bg-green-50" : "border-gray-300"}`}>
                      {form.cnhBackImageUrl ? (
                        <img src={form.cnhBackImageUrl} alt="CNH Verso" className="h-full w-full object-cover rounded-2xl" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-gray-400 mb-1" />
                          <span className="text-xs text-gray-500">Upload</span>
                        </>
                      )}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFile("cnhBackImageUrl", e.target.files)}
                      />
                    </label>
                    {getError("cnhBackImageUrl") && <p className="text-xs text-red-600">{getError("cnhBackImageUrl")}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Credencial de Instrutor (Detran)</Label>
                  <label className={`flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors ${form.credentialImageUrl ? "border-green-500 bg-green-50" : "border-gray-300"}`}>
                    {form.credentialImageUrl ? (
                      <img src={form.credentialImageUrl} alt="Credencial" className="h-full w-full object-cover rounded-2xl" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">Clique para enviar</span>
                        <span className="text-xs text-gray-400">JPEG, PNG até 5MB</span>
                      </>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleFile("credentialImageUrl", e.target.files)}
                    />
                  </label>
                  {getError("credentialImageUrl") && <p className="text-xs text-red-600">{getError("credentialImageUrl")}</p>}
                </div>
              </>
            )}

            {/* Step 3: Selfie */}
            {step === 3 && (
              <>
                <SelfieCapture onCapture={(img) => updateForm('selfieImageUrl', img)} />
                {getError("selfieImageUrl") && <p className="text-xs text-red-600 text-center mt-4">{getError("selfieImageUrl")}</p>}
              </>
            )}

            {/* Step 4: Criar Conta */}
            {step === 4 && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">E-mail</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateForm("email", e.target.value)}
                    placeholder="seu@email.com"
                    className={`h-14 rounded-2xl bg-gray-50 border-gray-200 ${getError("email") ? "border-red-500" : ""}`}
                  />
                  {getError("email") && <p className="text-xs text-red-600">{getError("email")}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Senha</Label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => updateForm("password", e.target.value)}
                    placeholder="••••••••"
                    className={`h-14 rounded-2xl bg-gray-50 border-gray-200 ${getError("password") ? "border-red-500" : ""}`}
                  />
                  {getError("password") && <p className="text-xs text-red-600">{getError("password")}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Confirmar Senha</Label>
                  <Input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => updateForm("confirmPassword", e.target.value)}
                    placeholder="••••••••"
                    className={`h-14 rounded-2xl bg-gray-50 border-gray-200 ${getError("confirmPassword") ? "border-red-500" : ""}`}
                  />
                  {getError("confirmPassword") && <p className="text-xs text-red-600">{getError("confirmPassword")}</p>}
                </div>

                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <Checkbox
                    id="acceptTerms"
                    checked={form.acceptTerms}
                    onCheckedChange={(checked) => updateForm("acceptTerms", checked as boolean)}
                    className="mt-1"
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="acceptTerms" className="text-sm font-medium cursor-pointer">
                      Aceito os <Link href="/termos" className="text-blue-600 underline">termos de uso</Link> e{" "}
                      <Link href="/privacidade" className="text-blue-600 underline">política de privacidade</Link>
                    </Label>
                  </div>
                </div>
                {getError("acceptTerms") && <p className="text-xs text-red-600">{getError("acceptTerms")}</p>}

              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Fixo */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-6">
        <div className="flex gap-4 max-w-lg mx-auto">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="flex-1 h-14 rounded-2xl border-gray-200 text-gray-700 font-semibold gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              Voltar
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={isSubmitting}
            className="flex-1 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2"
          >
            {isSubmitting ? "Enviando..." : step === totalSteps ? "Finalizar Cadastro" : "Próximo"}
            {!isSubmitting && step < totalSteps && <ChevronRight className="w-5 h-5" />}
          </Button>
        </div>

        {error && (
          <p className="text-sm text-red-600 text-center mt-3">{error}</p>
        )}

        <p className="text-center text-sm text-gray-500 mt-4">
          Já tem uma conta?{" "}
          <Link href="/login" className="text-emerald-600 font-medium hover:underline">
            Fazer Login
          </Link>
        </p>
      </footer>
    </div>
  );
}
