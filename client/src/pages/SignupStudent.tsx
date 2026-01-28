import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useMemo, useState } from "react";
import { CheckCircle2, ChevronRight, ChevronLeft, Upload, Camera } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { WebcamCapture } from "@/components/WebcamCapture";
import { useToast } from "@/hooks/use-toast";

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
        birthDate: "",
        phone: "",
        email: "",
        password: "",
        confirmPassword: "",
        addressLine: "",
        zipCode: "",
        neighborhood: "",
        city: "",
        state: "",
        selfieImageUrl: "",
        documentFrontImageUrl: "",
        documentBackImageUrl: "",
        isLicensed: false,
        theoreticalProofImageUrl: "",
        licenseImageUrl: "",
        acceptTerms: false,
    });

    const steps = [1, 2, 3, 4, 5];

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

    const handleFile = async (
        field: keyof typeof form,
        fileList: FileList | null,
    ) => {
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
            if (typeof value === "boolean" && value) return; // For checkboxes/booleans
            nextErrors[field] = `${label} obrigatório.`;
        };

        if (step === 1) { // Authentication
            requireField("email", "E-mail");
            requireField("password", "Senha");
            requireField("confirmPassword", "Confirmação de senha");
            if (form.password && form.confirmPassword && form.password !== form.confirmPassword) {
                nextErrors["confirmPassword"] = "As senhas não conferem.";
            }
        }

        if (step === 2) { // Personal Data
            requireField("firstName", "Nome");
            requireField("lastName", "Sobrenome");
            requireField("cpf", "CPF");
            requireField("birthDate", "Data de nascimento");
            requireField("phone", "Celular");
            requireField("addressLine", "Endereço");
            requireField("zipCode", "CEP");
            requireField("neighborhood", "Bairro");
            requireField("city", "Cidade");
            requireField("state", "Estado");
        }

        if (step === 3) { // Identity Verification
            requireField("selfieImageUrl", "Selfie");
            requireField("documentFrontImageUrl", "Frente do Documento");
            requireField("documentBackImageUrl", "Verso do Documento");
        }

        if (step === 4) { // License Status
            if (form.isLicensed) {
                requireField("licenseImageUrl", "Foto da CNH");
            } else {
                requireField("theoreticalProofImageUrl", "Comprovante Teórico (LADV)");
            }
        }

        if (step === 5) { // Review
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
            // Redirect directly to dashboard as user is logged in
            setLocation("/dashboard/aluno");
        } catch (err: any) {
            setError(err?.message || "Não foi possível enviar o cadastro.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6 bg-[url('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center relative">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            <div className="w-full max-w-md relative z-10">
                <div className="bg-white rounded-xl shadow-2xl overflow-hidden p-8 animate-in fade-in zoom-in-95 duration-500">
                    {/* Header */}
                    <div className="mb-6">
                        <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors">
                            <ChevronLeft className="w-4 h-4 mr-1" /> Voltar para Home
                        </Link>
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Cadastro de Aluno</h1>
                                <p className="text-gray-500 text-sm mt-1">Passo {step} de 5</p>
                            </div>
                            {/* Progress Indicator */}
                            <div className="flex gap-1">
                                {steps.map((s) => (
                                    <div
                                        key={s}
                                        className={`h-2 w-2 rounded-full transition-all duration-300 ${s <= step ? 'bg-primary w-4' : 'bg-gray-200'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <CardContent className="p-0 space-y-6">
                        {step === 1 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-8">
                                <h2 className="font-semibold text-lg border-b pb-2">Login e Segurança</h2>

                                <div className="space-y-1">
                                    <Label>E-mail</Label>
                                    <Input
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => updateForm("email", e.target.value)}
                                        placeholder="seu@email.com"
                                        className={getError("email") ? "border-red-500" : undefined}
                                    />
                                    {getError("email") && <p className="text-xs text-red-600">{getError("email")}</p>}
                                </div>

                                <div className="space-y-1">
                                    <Label>Senha</Label>
                                    <Input
                                        type="password"
                                        value={form.password}
                                        onChange={(e) => updateForm("password", e.target.value)}
                                        className={getError("password") ? "border-red-500" : undefined}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label>Confirmar Senha</Label>
                                    <Input
                                        type="password"
                                        value={form.confirmPassword}
                                        onChange={(e) => updateForm("confirmPassword", e.target.value)}
                                        className={getError("confirmPassword") ? "border-red-500" : undefined}
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

                                <a href="/api/auth/google" className="w-full">
                                    <Button variant="outline" className="w-full gap-2" type="button">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px">
                                            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                                            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                                            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                                            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                                        </svg>
                                        Continuar com Google
                                    </Button>
                                </a>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-8">
                                <h2 className="font-semibold text-lg border-b pb-2">Dados Pessoais</h2>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label>Nome</Label>
                                        <Input
                                            value={form.firstName}
                                            onChange={(e) => updateForm("firstName", e.target.value)}
                                            placeholder="Nome"
                                            className={getError("firstName") ? "border-red-500" : undefined}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Sobrenome</Label>
                                        <Input
                                            value={form.lastName}
                                            onChange={(e) => updateForm("lastName", e.target.value)}
                                            placeholder="Sobrenome"
                                            className={getError("lastName") ? "border-red-500" : undefined}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label>CPF</Label>
                                    <Input
                                        value={form.cpf}
                                        onChange={(e) => updateForm("cpf", e.target.value)}
                                        placeholder="000.000.000-00"
                                        className={getError("cpf") ? "border-red-500" : undefined}
                                    />
                                    {getError("cpf") && <p className="text-xs text-red-600">{getError("cpf")}</p>}
                                </div>

                                <div className="space-y-1">
                                    <Label>Data de Nascimento</Label>
                                    <Input
                                        type="date"
                                        value={form.birthDate}
                                        onChange={(e) => updateForm("birthDate", e.target.value)}
                                        className={getError("birthDate") ? "border-red-500" : undefined}
                                    />
                                    {getError("birthDate") && <p className="text-xs text-red-600">{getError("birthDate")}</p>}
                                </div>

                                <div className="space-y-1">
                                    <Label>Celular</Label>
                                    <Input
                                        value={form.phone}
                                        onChange={(e) => updateForm("phone", e.target.value)}
                                        placeholder="(00) 00000-0000"
                                        className={getError("phone") ? "border-red-500" : undefined}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label>Endereço</Label>
                                    <Input
                                        value={form.addressLine}
                                        onChange={(e) => updateForm("addressLine", e.target.value)}
                                        placeholder="Rua, número"
                                        className={getError("addressLine") ? "border-red-500" : undefined}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label>CEP</Label>
                                        <Input
                                            value={form.zipCode}
                                            onChange={(e) => updateForm("zipCode", e.target.value)}
                                            placeholder="00000-000"
                                            className={getError("zipCode") ? "border-red-500" : undefined}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Bairro</Label>
                                        <Input
                                            value={form.neighborhood}
                                            onChange={(e) => updateForm("neighborhood", e.target.value)}
                                            placeholder="Bairro"
                                            className={getError("neighborhood") ? "border-red-500" : undefined}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label>Cidade</Label>
                                        <Input
                                            value={form.city}
                                            onChange={(e) => updateForm("city", e.target.value)}
                                            placeholder="Cidade"
                                            className={getError("city") ? "border-red-500" : undefined}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Estado</Label>
                                        <Input
                                            value={form.state}
                                            onChange={(e) => updateForm("state", e.target.value)}
                                            placeholder="UF"
                                            className={getError("state") ? "border-red-500" : undefined}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
                                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-blue-800 text-sm flex gap-3">
                                    <Camera className="w-5 h-5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold">Verificação de Identidade</p>
                                        <p>Precisamos de uma selfie atual e fotos do seu documento (Frente e Verso) para validar seu cadastro.</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-base font-semibold">1. Sua Selfie</Label>
                                    <div className="p-1 border rounded-xl bg-gray-50">
                                        <WebcamCapture onCapture={(img) => updateForm('selfieImageUrl', img)} label="Tirar Selfie" />
                                    </div>
                                    {form.selfieImageUrl && <p className="text-xs text-green-600 text-center font-medium">Selfie capturada com sucesso!</p>}
                                    {getError("selfieImageUrl") && <p className="text-xs text-red-600 text-center">{getError("selfieImageUrl")}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">2. Frente do Documento</Label>
                                        <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${form.documentFrontImageUrl ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-2">
                                                <Upload className={`w-8 h-8 mb-2 ${form.documentFrontImageUrl ? 'text-green-500' : 'text-gray-400'}`} />
                                                <p className="text-xs text-gray-500">Clique para enviar <span className="font-semibold">FRENTE</span></p>
                                            </div>
                                            <Input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => handleFile("documentFrontImageUrl", e.target.files)}
                                            />
                                        </label>
                                        {getError("documentFrontImageUrl") && <p className="text-xs text-red-600 text-center">{getError("documentFrontImageUrl")}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">3. Verso do Documento</Label>
                                        <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${form.documentBackImageUrl ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-2">
                                                <Upload className={`w-8 h-8 mb-2 ${form.documentBackImageUrl ? 'text-green-500' : 'text-gray-400'}`} />
                                                <p className="text-xs text-gray-500">Clique para enviar <span className="font-semibold">VERSO</span></p>
                                            </div>
                                            <Input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => handleFile("documentBackImageUrl", e.target.files)}
                                            />
                                        </label>
                                        {getError("documentBackImageUrl") && <p className="text-xs text-red-600 text-center">{getError("documentBackImageUrl")}</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
                                <h2 className="font-semibold text-lg border-b pb-2">Situação da Habilitação</h2>

                                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
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
                                        <p className="text-sm text-muted-foreground">
                                            Marque se você já tem carteira e quer apenas adicionar categorias ou renovar.
                                        </p>
                                    </div>
                                </div>

                                {form.isLicensed ? (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                                        <Label>Foto da CNH Aberta</Label>
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFile("licenseImageUrl", e.target.files)}
                                        />
                                        {getError("licenseImageUrl") && <p className="text-xs text-red-600">{getError("licenseImageUrl")}</p>}
                                    </div>
                                ) : (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                        <div className="bg-yellow-50 p-3 rounded text-sm text-yellow-800 border border-yellow-200">
                                            Para iniciar as aulas práticas, você precisa ter passado no exame teórico e possuir a LADV.
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Foto do LADV ou Comprovante Teórico</Label>
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFile("theoreticalProofImageUrl", e.target.files)}
                                            />
                                            {getError("theoreticalProofImageUrl") && <p className="text-xs text-red-600">{getError("theoreticalProofImageUrl")}</p>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 5 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 text-center py-4">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2 text-primary">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-xl text-gray-900">Quase lá!</h2>
                                    <p className="text-gray-500 text-sm">
                                        Confira seus dados e aceite os termos para finalizar.
                                    </p>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg text-left text-sm space-y-2 border border-gray-100">
                                    <div className="flex justify-between border-b pb-2 mb-2">
                                        <span className="font-semibold text-gray-700">Resumo</span>
                                        <Button variant="link" className="h-auto p-0 text-xs" onClick={() => setStep(2)}>Editar</Button>
                                    </div>
                                    <p><span className="text-gray-500">Nome:</span> <span className="font-medium">{form.firstName} {form.lastName}</span></p>
                                    <p><span className="text-gray-500">Email:</span> <span className="font-medium">{form.email}</span></p>
                                    <p><span className="text-gray-500">CPF:</span> <span className="font-medium">{form.cpf}</span></p>
                                </div>

                                <div className="flex items-start space-x-3 text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                    <Checkbox
                                        id="terms"
                                        checked={form.acceptTerms}
                                        onCheckedChange={(checked) => updateForm("acceptTerms", checked as boolean)}
                                        className="mt-1"
                                    />
                                    <Label htmlFor="terms" className="text-sm font-normal text-gray-600 leading-snug cursor-pointer">
                                        Declaro que as informações são verdadeiras e aceito os <Link href="/termos" className="text-primary hover:underline font-medium">Termos de Uso</Link> e <Link href="/privacidade" className="text-primary hover:underline font-medium">Política de Privacidade</Link> da HabilitFy.
                                    </Label>
                                </div>
                                {getError("acceptTerms") && <p className="text-xs text-red-600">{getError("acceptTerms")}</p>}
                            </div>
                        )}

                        {error && <p className="text-sm text-red-600 text-center bg-red-50 p-2 rounded">{error}</p>}

                        <div className="flex gap-3 pt-6 border-t mt-2">
                            {step > 1 && (
                                <Button
                                    variant="outline"
                                    onClick={() => setStep(step - 1)}
                                    className="flex-1"
                                >
                                    <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
                                </Button>
                            )}
                            <Button
                                onClick={handleNext}
                                className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold shadow-md hover:shadow-lg transition-all"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Cadastrando..." : step === 5 ? "Criar Conta" : "Próximo"}
                                {!isSubmitting && step < 5 && <ChevronRight className="w-4 h-4 ml-1" />}
                            </Button>
                        </div>
                    </CardContent>

                    <div className="mt-6 text-center border-t pt-4">
                        <p className="text-xs text-gray-500 mb-2">Já tem uma conta?</p>
                        <Link href="/login" className="text-sm font-medium text-primary hover:text-primary/80 hover:underline">
                            Fazer Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
