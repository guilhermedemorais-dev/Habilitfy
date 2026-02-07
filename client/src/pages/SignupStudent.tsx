import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { CheckCircle2, ChevronRight, ChevronLeft, Upload, Camera, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { SelfieCapture } from "@/components/SelfieCapture";
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

export default function SignupStudent() {
    const [step, setStep] = useState(1);
    const [, setLocation] = useLocation();
    const { user } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const { toast } = useToast();

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        cpf: "",
        phone: "",
        email: "",
        password: "",
        confirmPassword: "",
        selfieImageUrl: "",
        documentFrontImageUrl: "",
        documentBackImageUrl: "",
        isLicensed: false,
        theoreticalProofImageUrl: "",
        licenseImageUrl: "",
        acceptTerms: false,
    });

    const totalSteps = 5;

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
            requireField("phone", "Celular");
        }

        if (step === 2) {
            requireField("documentFrontImageUrl", "Frente do Documento");
            requireField("documentBackImageUrl", "Verso do Documento");
        }

        if (step === 3) {
            requireField("selfieImageUrl", "Selfie");
        }

        if (step === 4) {
            if (form.isLicensed) {
                requireField("licenseImageUrl", "Foto da CNH");
            } else {
                requireField("theoreticalProofImageUrl", "Comprovante Teórico (LADV)");
            }
        }

        if (step === 5) {
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

        if (step < 5) {
            setFieldErrors({});
            setStep(step + 1);
            return;
        }

        setIsSubmitting(true);
        try {
            await apiRequest("POST", "/api/users/register", {
                ...form,
                role: "student"
            });

            toast({
                title: "Cadastro realizado!",
                description: "Bem-vindo ao HabilitFy.",
            });
            setLocation("/dashboard/aluno");
        } catch (err: any) {
            setError(err?.message || "Não foi possível enviar o cadastro.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const stepTitles: Record<number, string> = {
        1: "Dados Pessoais",
        2: "Documento de Identificação",
        3: "Verificação Facial",
        4: "Status da Habilitação",
        5: "Criar Conta",
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
                <h1 className="text-2xl font-bold text-gray-900">Cadastro de Aluno</h1>
                <p className="text-gray-500 text-sm mt-1">Passo {step} de {totalSteps}</p>
                <div className="mt-4">
                    <h2 className="text-lg font-semibold text-gray-800 border-b-2 border-[#3B82F6] pb-2 inline-block">
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
                                    <Label className="text-sm font-medium text-gray-700">Celular</Label>
                                    <Input
                                        value={form.phone}
                                        onChange={(e) => updateForm("phone", maskPhone(e.target.value))}
                                        placeholder="(00) 00000-0000"
                                        className={`h-14 rounded-2xl bg-gray-50 border-gray-200 ${getError("phone") ? "border-red-500" : ""}`}
                                    />
                                    {getError("phone") && <p className="text-xs text-red-600">{getError("phone")}</p>}
                                </div>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <p className="text-gray-600 text-sm mb-4">
                                    Tire uma foto legível do seu RG ou CNH (frente e verso).
                                </p>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-700">Frente do Documento</Label>
                                        <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${form.documentFrontImageUrl ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                                            <div className="flex flex-col items-center justify-center py-5">
                                                <Upload className={`w-8 h-8 mb-2 ${form.documentFrontImageUrl ? 'text-green-500' : 'text-gray-400'}`} />
                                                <p className="text-sm text-gray-500">
                                                    {form.documentFrontImageUrl ? "Documento enviado ✓" : "Clique para enviar FRENTE"}
                                                </p>
                                            </div>
                                            <Input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => handleFile("documentFrontImageUrl", e.target.files)}
                                            />
                                        </label>
                                        {getError("documentFrontImageUrl") && <p className="text-xs text-red-600">{getError("documentFrontImageUrl")}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-700">Verso do Documento</Label>
                                        <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${form.documentBackImageUrl ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                                            <div className="flex flex-col items-center justify-center py-5">
                                                <Upload className={`w-8 h-8 mb-2 ${form.documentBackImageUrl ? 'text-green-500' : 'text-gray-400'}`} />
                                                <p className="text-sm text-gray-500">
                                                    {form.documentBackImageUrl ? "Documento enviado ✓" : "Clique para enviar VERSO"}
                                                </p>
                                            </div>
                                            <Input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => handleFile("documentBackImageUrl", e.target.files)}
                                            />
                                        </label>
                                        {getError("documentBackImageUrl") && <p className="text-xs text-red-600">{getError("documentBackImageUrl")}</p>}
                                    </div>
                                </div>
                            </>
                        )}

                        {step === 3 && (
                            <>
                                <SelfieCapture onCapture={(img) => updateForm('selfieImageUrl', img)} />
                                {getError("selfieImageUrl") && <p className="text-xs text-red-600 text-center mt-4">{getError("selfieImageUrl")}</p>}
                            </>
                        )}

                        {step === 4 && (
                            <>
                                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <Checkbox
                                        id="isLicensed"
                                        checked={form.isLicensed}
                                        onCheckedChange={(checked) => updateForm("isLicensed", checked as boolean)}
                                        className="mt-1"
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                        <Label htmlFor="isLicensed" className="text-base font-medium cursor-pointer">
                                            Já possuo CNH (Habilitado)
                                        </Label>
                                        <p className="text-sm text-gray-500">
                                            Marque se você já tem carteira e quer adicionar categorias ou renovar.
                                        </p>
                                    </div>
                                </div>

                                {form.isLicensed ? (
                                    <div className="space-y-2 mt-4">
                                        <Label className="text-sm font-medium text-gray-700">Foto da CNH Aberta</Label>
                                        <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${form.licenseImageUrl ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                                            <div className="flex flex-col items-center justify-center py-5">
                                                <Upload className={`w-8 h-8 mb-2 ${form.licenseImageUrl ? 'text-green-500' : 'text-gray-400'}`} />
                                                <p className="text-sm text-gray-500">
                                                    {form.licenseImageUrl ? "CNH enviada ✓" : "Clique para enviar CNH"}
                                                </p>
                                            </div>
                                            <Input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => handleFile("licenseImageUrl", e.target.files)}
                                            />
                                        </label>
                                        {getError("licenseImageUrl") && <p className="text-xs text-red-600">{getError("licenseImageUrl")}</p>}
                                    </div>
                                ) : (
                                    <div className="space-y-4 mt-4">
                                        <div className="bg-yellow-50 p-3 rounded-2xl text-sm text-yellow-800 border border-yellow-200">
                                            Para iniciar as aulas práticas, você precisa ter passado no exame teórico e possuir a LADV.
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-700">Foto do LADV ou Comprovante Teórico</Label>
                                            <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${form.theoreticalProofImageUrl ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                                                <div className="flex flex-col items-center justify-center py-5">
                                                    <Upload className={`w-8 h-8 mb-2 ${form.theoreticalProofImageUrl ? 'text-green-500' : 'text-gray-400'}`} />
                                                    <p className="text-sm text-gray-500">
                                                        {form.theoreticalProofImageUrl ? "Comprovante enviado ✓" : "Clique para enviar LADV"}
                                                    </p>
                                                </div>
                                                <Input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={(e) => handleFile("theoreticalProofImageUrl", e.target.files)}
                                                />
                                            </label>
                                            {getError("theoreticalProofImageUrl") && <p className="text-xs text-red-600">{getError("theoreticalProofImageUrl")}</p>}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {step === 5 && (
                            <>
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
                                            Declaro que as informações são verdadeiras e aceito os <Link href="/termos" className="text-[#3B82F6] hover:underline font-medium">Termos de Uso</Link> e <Link href="/privacidade" className="text-[#3B82F6] hover:underline font-medium">Política de Privacidade</Link>.
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
                        className="flex-1 h-14 rounded-2xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold text-base shadow-lg shadow-blue-500/25"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Cadastrando..." : step === 5 ? "Criar Conta" : "Próximo"}
                        {!isSubmitting && step < 5 && <ChevronRight className="w-4 h-4 ml-1" />}
                    </Button>
                </div>
                <div className="text-center mt-3">
                    <p className="text-xs text-gray-500">
                        Já tem uma conta? <Link href="/login" className="text-[#3B82F6] font-medium hover:underline">Fazer Login</Link>
                    </p>
                </div>
            </footer>
        </div>
    );
}
