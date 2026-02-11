import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, X, Plus, Image as ImageIcon } from "lucide-react";
import type { Instructor } from "@shared/schema";

interface ProfileEditorProps {
    instructor: Instructor;
}

const AVAILABLE_SPECIALTIES = [
    { value: "estacionamento", label: "Estacionamento" },
    { value: "baliza", label: "Baliza" },
    { value: "direcao-defensiva", label: "Direção Defensiva" },
    { value: "primeira-habilitacao", label: "Primeira Habilitação" },
    { value: "reciclagem", label: "Reciclagem" },
    { value: "noturno", label: "Aulas Noturnas" },
    { value: "moto", label: "Motocicleta" },
    { value: "caminhao", label: "Caminhão/Ônibus" },
];

const AVAILABLE_LANGUAGES = [
    "Português",
    "Inglês",
    "Espanhol",
    "Libras",
];

export function ProfileEditor({ instructor }: ProfileEditorProps) {
    const queryClient = useQueryClient();

    const [bio, setBio] = useState(instructor.bio || "");
    const [yearsExperience, setYearsExperience] = useState(instructor.yearsExperience || 0);
    const [workingHours, setWorkingHours] = useState(instructor.workingHours || "Seg-Sáb: 8h-18h");
    const [responseTime, setResponseTime] = useState(instructor.responseTime || "<1h");
    const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(
        (instructor.specialties as string[] | null) || []
    );
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
        (instructor.languages as string[] | null) || ["Português"]
    );

    const updateProfileMutation = useMutation({
        mutationFn: async (data: {
            bio: string;
            yearsExperience: number;
            workingHours: string;
            responseTime: string;
            specialties: string[];
            languages: string[];
        }) => {
            const res = await fetch(`/api/instructors/${instructor.id}/profile`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Erro ao atualizar perfil");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Perfil atualizado com sucesso!");
            queryClient.invalidateQueries({ queryKey: ["/api/instructors"] });
        },
        onError: () => {
            toast.error("Erro ao atualizar perfil");
        },
    });

    const toggleSpecialty = (specialty: string) => {
        setSelectedSpecialties((prev) =>
            prev.includes(specialty)
                ? prev.filter((s) => s !== specialty)
                : [...prev, specialty]
        );
    };

    const toggleLanguage = (language: string) => {
        setSelectedLanguages((prev) =>
            prev.includes(language)
                ? prev.filter((l) => l !== language)
                : [...prev, language]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfileMutation.mutate({
            bio,
            yearsExperience,
            workingHours,
            responseTime,
            specialties: selectedSpecialties,
            languages: selectedLanguages,
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-primary" />
                    Editar Meu Perfil
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Bio */}
                    <div className="space-y-2">
                        <Label htmlFor="bio">Sobre você</Label>
                        <Textarea
                            id="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Descreva sua experiência como instrutor..."
                            rows={4}
                            className="resize-none"
                        />
                    </div>

                    {/* Anos de Experiência */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="yearsExperience">Anos de Experiência</Label>
                            <Input
                                id="yearsExperience"
                                type="number"
                                min={0}
                                max={50}
                                value={yearsExperience}
                                onChange={(e) => setYearsExperience(Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="responseTime">Tempo de Resposta</Label>
                            <Input
                                id="responseTime"
                                value={responseTime}
                                onChange={(e) => setResponseTime(e.target.value)}
                                placeholder="Ex: <1h, <30min"
                            />
                        </div>
                    </div>

                    {/* Horário de Funcionamento */}
                    <div className="space-y-2">
                        <Label htmlFor="workingHours">Horário de Funcionamento</Label>
                        <Input
                            id="workingHours"
                            value={workingHours}
                            onChange={(e) => setWorkingHours(e.target.value)}
                            placeholder="Ex: Seg-Sáb: 8h-18h"
                        />
                    </div>

                    {/* Idiomas */}
                    <div className="space-y-2">
                        <Label>Idiomas</Label>
                        <div className="flex flex-wrap gap-2">
                            {AVAILABLE_LANGUAGES.map((language) => (
                                <Badge
                                    key={language}
                                    variant={selectedLanguages.includes(language) ? "default" : "outline"}
                                    className="cursor-pointer transition-colors"
                                    onClick={() => toggleLanguage(language)}
                                >
                                    {selectedLanguages.includes(language) ? (
                                        <X className="w-3 h-3 mr-1" />
                                    ) : (
                                        <Plus className="w-3 h-3 mr-1" />
                                    )}
                                    {language}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Especialidades */}
                    <div className="space-y-2">
                        <Label>Especialidades</Label>
                        <div className="flex flex-wrap gap-2">
                            {AVAILABLE_SPECIALTIES.map((specialty) => (
                                <Badge
                                    key={specialty.value}
                                    variant={selectedSpecialties.includes(specialty.value) ? "default" : "outline"}
                                    className="cursor-pointer transition-colors"
                                    onClick={() => toggleSpecialty(specialty.value)}
                                >
                                    {selectedSpecialties.includes(specialty.value) ? (
                                        <X className="w-3 h-3 mr-1" />
                                    ) : (
                                        <Plus className="w-3 h-3 mr-1" />
                                    )}
                                    {specialty.label}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Submit */}
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={updateProfileMutation.isPending}
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {updateProfileMutation.isPending ? "Salvando..." : "Salvar Perfil"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
