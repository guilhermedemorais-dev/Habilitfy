import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { CheckCircle2, ChevronRight, ChevronLeft, Upload, Camera, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { WebcamCapture } from "@/components/WebcamCapture";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ProgressDots } from "@/components/ui/ProgressDots";

// Máscaras de input
const maskCPF = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

const maskPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
};

const maskCEP = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.replace(/(\d{5})(\d)/, "$1-$2");
};

// Google Icon
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const STATES = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

export default function SignupInstructor() {
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const [form, setForm] = useState({
    // Personal
    firstName: "",
    lastName: "",
    cpf: "",
    phone: "",
    birthDate: "",
    addressLine: "",
    zipCode: "",
    neighborhood: "",
    city: "",
    state: "",
    // Professional / Documents
    documentNumber: "",
    credentialNumber: "",
    selfieImageUrl: "",
    documentFrontImageUrl: "",
    documentBackImageUrl: "",
    credentialImageUrl: "",
    // Vehicle
    vehicleModel: "",
    vehicleYear: "",
    vehicleType: "",
    vehiclePlate: "",
    vehicleImageUrl: "",
    vehicleDocImageUrl: "",
    vehiclePlateImageUrl: "",
    vehicleAuthorizationImageUrl: "",
    // Auth
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

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
      requireField("firstName", "Nome");
      requireField("lastName", "Sobrenome");
      requireField("cpf", "CPF");
      requireField("phone", "WhatsApp");
      requireField("addressLine", "Endereço");
      requireField("zipCode", "CEP");
      requireField("neighborhood", "Bairro");
      requireField("city", "Cidade");
      requireField("state", "Estado");
    }

    if (step === 2) {
      requireField("selfieImageUrl", "Selfie");
      requireField("documentNumber", "Número do Documento");
      requireField("documentFrontImageUrl", "Frente do Documento");
      requireField("documentBackImageUrl", "Verso do Documento");
      requireField("credentialNumber", "Número da Credencial");
      requireField("credentialImageUrl", "Foto da Credencial");
    }

    if (step === 3) {
      requireField("vehicleModel", "Modelo do Veículo");
      requireField("vehicleYear", "Ano do Veículo");
      requireField("vehicleType", "Tipo de Veículo");
      requireField("vehiclePlate", "Placa");
      requireField("vehicleImageUrl", "Foto do Veículo");
      requireField("vehicleDocImageUrl", "Documento do Veículo");
      requireField("vehiclePlateImageUrl", "Foto da Placa");
      requireField("vehicleAuthorizationImageUrl", "Doc. de Autorização");
    }

    if (step === 4) {
      requireField("email", "E-mail");
      requireField("password", "Senha");
      requireField("confirmPassword", "Confirmação de senha");
      if (form.password && form.confirmPassword && form.password !== form.confirmPassword) {
        nextErrors["confirmPassword"] = "As senhas não conferem.";
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

    if (step < 4) {
      setFieldErrors({});
      setStep(step + 1);
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/users/register", {
        ...form,
        role: "instructor",
        documentImageUrl: form.documentFrontImageUrl,
      });

      toast({
        title: "Cadastro realizado!",
        description: "Bem-vindo ao HabilitFy.",
      });
      setLocation("/dashboard/instrutor");
    } catch (err: any) {
      setError(err?.message || "Não foi possível enviar o cadastro.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepTitles: Record<number, string> = {
    1: "Dados Pessoais",
    2: "Documentos e Credencial",
    3: "Dados do Veículo",
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
            {step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Nome</Label>
                    <Input
                      value={form.firstName}
                      onChange={(e) => updateForm("firstName", e.target.value)}
                      placeholder="Nome"
                      className={`h-14 rounded-2xl bg-gray-50 border-gray-200 ${getError("firstName") ? "border-red-500" : ""}`}
                    />
                    {getError("firstName") && <p className="text-xs text-red-600">{getError("firstName")}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Sobrenome</Label>
                    <Input
                      value={form.lastName}
                      onChange={(e) => updateForm("lastName", e.target.value)}
                      placeholder="Sobrenome"
                      className={`h-14 rounded-2xl bg-gray-50 border-gray-200 ${getError("lastName") ? "border-red-500" : ""}`}
                    />
                    {getError("lastName") && <p className="text-xs text-red-600">{getError("lastName")}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">CPF</Label>
                  <Input
                    value={form.cpf}
                    onChange={(e) => updateForm("cpf", maskCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    className={`h-14 rounded-2xl bg-gray-50 border-gray-200 ${getError("cpf") ? "border-red-500" : ""}`}
                  />
                  {getError("cpf") && <p className="text-xs text-red-600">{getError("cpf")}</p>}
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
                      {STATES.map((uf) => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                    {getError("state") && <p className="text-xs text-red-600">{getError("state")}</p>}
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl text-blue-800 text-sm flex gap-3 mb-4">
                  <Camera className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Verificação e Credenciamento</p>
                    <p>Envie sua selfie, documentos pessoais e sua credencial do Detran.</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <Label className="text-sm font-medium text-gray-700">Sua Selfie</Label>
                  <div className="border rounded-2xl overflow-hidden bg-gray-50">
                    <WebcamCapture onCapture={(img) => updateForm('selfieImageUrl', img)} label="Tirar Selfie" />
                  </div>
                  {form.selfieImageUrl && <p className="text-sm text-green-600 text-center font-medium">Selfie capturada ✓</p>}
                  {getError("selfieImageUrl") && <p className="text-xs text-red-600 text-center">{getError("selfieImageUrl")}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Nº Documento (CNH/RG)</Label>
                    <Input
                      value={form.documentNumber}
                      onChange={(e) => updateForm("documentNumber", e.target.value)}
                      className={`h-14 rounded-2xl bg-gray-50 border-gray-200 ${getError("documentNumber") ? "border-red-500" : ""}`}
                    />
                    {getError("documentNumber") && <p className="text-xs text-red-600">{getError("documentNumber")}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Nº Credencial Detran</Label>
                    <Input
                      value={form.credentialNumber}
                      onChange={(e) => updateForm("credentialNumber", e.target.value)}
                      className={`h-14 rounded-2xl bg-gray-50 border-gray-200 ${getError("credentialNumber") ? "border-red-500" : ""}`}
                    />
                    {getError("credentialNumber") && <p className="text-xs text-red-600">{getError("credentialNumber")}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Frente Documento</Label>
                    <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${form.documentFrontImageUrl ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                      <Upload className={`w-6 h-6 mb-1 ${form.documentFrontImageUrl ? 'text-green-500' : 'text-gray-400'}`} />
                      <span className="text-xs text-gray-500">{form.documentFrontImageUrl ? "Enviado ✓" : "FRENTE"}</span>
                      <Input type="file" className="hidden" accept="image/*" onChange={(e) => handleFile("documentFrontImageUrl", e.target.files)} />
                    </label>
                    {getError("documentFrontImageUrl") && <p className="text-xs text-red-600">{getError("documentFrontImageUrl")}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Verso Documento</Label>
                    <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${form.documentBackImageUrl ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                      <Upload className={`w-6 h-6 mb-1 ${form.documentBackImageUrl ? 'text-green-500' : 'text-gray-400'}`} />
                      <span className="text-xs text-gray-500">{form.documentBackImageUrl ? "Enviado ✓" : "VERSO"}</span>
                      <Input type="file" className="hidden" accept="image/*" onChange={(e) => handleFile("documentBackImageUrl", e.target.files)} />
                    </label>
                    {getError("documentBackImageUrl") && <p className="text-xs text-red-600">{getError("documentBackImageUrl")}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Foto da Credencial Detran</Label>
                  <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${form.credentialImageUrl ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                    <Upload className={`w-6 h-6 mb-1 ${form.credentialImageUrl ? 'text-green-500' : 'text-gray-400'}`} />
                    <span className="text-xs text-gray-500">{form.credentialImageUrl ? "Credencial enviada ✓" : "Enviar Credencial"}</span>
                    <Input type="file" className="hidden" accept="image/*" onChange={(e) => handleFile("credentialImageUrl", e.target.files)} />
                  </label>
                  {getError("credentialImageUrl") && <p className="text-xs text-red-600">{getError("credentialImageUrl")}</p>}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Modelo</Label>
                    <Input
                      value={form.vehicleModel}
                      onChange={(e) => updateForm("vehicleModel", e.target.value)}
                      placeholder="Ex: Hyundai HB20"
                      className={`h-14 rounded-2xl bg-gray-50 border-gray-200 ${getError("vehicleModel") ? "border-red-500" : ""}`}
                    />
                    {getError("vehicleModel") && <p className="text-xs text-red-600">{getError("vehicleModel")}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Ano</Label>
                    <Input
                      value={form.vehicleYear}
                      onChange={(e) => updateForm("vehicleYear", e.target.value)}
                      placeholder="2023"
                      className={`h-14 rounded-2xl bg-gray-50 border-gray-200 ${getError("vehicleYear") ? "border-red-500" : ""}`}
                    />
                    {getError("vehicleYear") && <p className="text-xs text-red-600">{getError("vehicleYear")}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Tipo</Label>
                    <select
                      value={form.vehicleType}
                      onChange={(e) => updateForm("vehicleType", e.target.value)}
                      className={`flex h-14 w-full rounded-2xl border bg-gray-50 px-4 text-base ${getError("vehicleType") ? "border-red-500" : "border-gray-200"}`}
                    >
                      <option value="">Selecione</option>
                      <option value="carro">Carro</option>
                      <option value="moto">Moto</option>
                      <option value="caminhao">Caminhão</option>
                    </select>
                    {getError("vehicleType") && <p className="text-xs text-red-600">{getError("vehicleType")}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Placa</Label>
                    <Input
                      value={form.vehiclePlate}
                      onChange={(e) => updateForm("vehiclePlate", e.target.value.toUpperCase())}
                      placeholder="ABC1D23"
                      className={`h-14 rounded-2xl bg-gray-50 border-gray-200 ${getError("vehiclePlate") ? "border-red-500" : ""}`}
                    />
                    {getError("vehiclePlate") && <p className="text-xs text-red-600">{getError("vehiclePlate")}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Foto do Veículo</Label>
                    <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${form.vehicleImageUrl ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                      <Upload className={`w-6 h-6 mb-1 ${form.vehicleImageUrl ? 'text-green-500' : 'text-gray-400'}`} />
                      <span className="text-xs text-gray-500">{form.vehicleImageUrl ? "Enviado ✓" : "Foto Veículo"}</span>
                      <Input type="file" className="hidden" accept="image/*" onChange={(e) => handleFile("vehicleImageUrl", e.target.files)} />
                    </label>
                    {getError("vehicleImageUrl") && <p className="text-xs text-red-600">{getError("vehicleImageUrl")}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Foto da Placa</Label>
                    <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${form.vehiclePlateImageUrl ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                      <Upload className={`w-6 h-6 mb-1 ${form.vehiclePlateImageUrl ? 'text-green-500' : 'text-gray-400'}`} />
                      <span className="text-xs text-gray-500">{form.vehiclePlateImageUrl ? "Enviado ✓" : "Foto Placa"}</span>
                      <Input type="file" className="hidden" accept="image/*" onChange={(e) => handleFile("vehiclePlateImageUrl", e.target.files)} />
                    </label>
                    {getError("vehiclePlateImageUrl") && <p className="text-xs text-red-600">{getError("vehiclePlateImageUrl")}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Doc. Veículo</Label>
                    <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${form.vehicleDocImageUrl ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                      <Upload className={`w-6 h-6 mb-1 ${form.vehicleDocImageUrl ? 'text-green-500' : 'text-gray-400'}`} />
                      <span className="text-xs text-gray-500">{form.vehicleDocImageUrl ? "Enviado ✓" : "CRLV"}</span>
                      <Input type="file" className="hidden" accept="image/*" onChange={(e) => handleFile("vehicleDocImageUrl", e.target.files)} />
                    </label>
                    {getError("vehicleDocImageUrl") && <p className="text-xs text-red-600">{getError("vehicleDocImageUrl")}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Autorização</Label>
                    <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${form.vehicleAuthorizationImageUrl ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                      <Upload className={`w-6 h-6 mb-1 ${form.vehicleAuthorizationImageUrl ? 'text-green-500' : 'text-gray-400'}`} />
                      <span className="text-xs text-gray-500">{form.vehicleAuthorizationImageUrl ? "Enviado ✓" : "Autorização"}</span>
                      <Input type="file" className="hidden" accept="image/*" onChange={(e) => handleFile("vehicleAuthorizationImageUrl", e.target.files)} />
                    </label>
                    {getError("vehicleAuthorizationImageUrl") && <p className="text-xs text-red-600">{getError("vehicleAuthorizationImageUrl")}</p>}
                  </div>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-center text-gray-900 mb-4">Quase lá!</h3>

                <div className="space-y-4">
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

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-200"></span>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">Ou entre com</span>
                    </div>
                  </div>

                  <a href="/api/auth/google" className="block">
                    <Button variant="outline" className="w-full h-14 rounded-2xl gap-2" type="button">
                      <GoogleIcon />
                      Continuar com Google
                    </Button>
                  </a>

                  <div className="flex items-start space-x-3 p-3 border rounded-2xl hover:bg-gray-50 transition-colors">
                    <Checkbox
                      id="terms"
                      checked={form.acceptTerms}
                      onCheckedChange={(checked) => updateForm("acceptTerms", checked as boolean)}
                      className="mt-1"
                    />
                    <Label htmlFor="terms" className="text-sm font-normal text-gray-600 leading-snug cursor-pointer">
                      Declaro que as informações são verdadeiras e aceito os <Link href="/termos" className="text-emerald-600 hover:underline font-medium">Termos de Uso</Link> e <Link href="/privacidade" className="text-emerald-600 hover:underline font-medium">Política de Privacidade</Link>.
                    </Label>
                  </div>
                  {getError("acceptTerms") && <p className="text-xs text-red-600">{getError("acceptTerms")}</p>}
                </div>
              </>
            )}

            {error && <p className="text-sm text-red-600 text-center bg-red-50 p-3 rounded-2xl">{error}</p>}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Fixo */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 z-50">
        <div className="flex gap-3 max-w-lg mx-auto">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="flex-1 h-14 rounded-2xl text-base"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
            </Button>
          )}
          <Button
            onClick={handleNext}
            className="flex-1 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base shadow-lg shadow-emerald-500/25"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Cadastrando..." : step === 4 ? "Criar Conta" : "Próximo"}
            {!isSubmitting && step < 4 && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
        <div className="text-center mt-3">
          <p className="text-xs text-gray-500">
            Já tem uma conta? <Link href="/login" className="text-emerald-600 font-medium hover:underline">Fazer Login</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
