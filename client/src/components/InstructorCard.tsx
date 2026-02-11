
import { Link } from "wouter";
import { Star, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Instructor } from "@shared/schema";
import { cn } from "@/lib/utils";

// Tipo estendido para incluir dados do usuário (join)
export type InstructorWithUser = Instructor & {
    name?: string;
    photo?: string;
    user?: {
        id: string;
        firstName?: string | null;
        lastName?: string | null;
        email?: string | null;
        profileImageUrl?: string | null;
    } | null;
    distance?: number; // Propriedade opcional para distância
};

interface InstructorCardProps {
    instructor: InstructorWithUser;
    className?: string;
}

export function InstructorCard({ instructor, className }: InstructorCardProps) {
    const categoryLabel = instructor.vehicleType || "Carro";

    const instructorName =
        instructor.name ||
        `${instructor.user?.firstName || ""} ${instructor.user?.lastName || ""}`.trim() ||
        instructor.user?.email ||
        "Instrutor";

    const instructorPhoto =
        instructor.photo || instructor.user?.profileImageUrl || "";

    const ratingValue = Number(instructor.rating || 5.0);
    const priceValue = Number(instructor.pricePerHour || 0);

    // Função auxiliar para gerar um índice baseado no ID (string ou number)
    const getHashIndex = (id: string | number | undefined, max: number) => {
        if (!id) return 0;
        const str = String(id);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0; // Converte para 32bit integer
        }
        return Math.abs(hash) % max;
    };

    // MOCK: Tags baseadas no ID (para variedade visual)
    const mockTags = [
        ["Paciente", "Carro Novo"],
        ["Pontual", "Didático"],
        ["Experiente", "Noite"],
        ["Calmo", "Iniciantes"],
    ];
    // Use instructor.id safely
    const tags = mockTags[getHashIndex(instructor.id, mockTags.length)] || ["Profissional"];

    // MOCK: Distância (se não vier na prop)
    const displayDistance = instructor.distance
        ? `${instructor.distance.toFixed(1)} km`
        : `${(getHashIndex(instructor.id, 50) / 10 + 0.5).toFixed(1)} km`;

    return (
        <div className={cn("group relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md", className)}>

            {/* Badge de Categoria (Topo Direito) */}
            <div className="absolute top-4 right-4">
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200">
                    {categoryLabel}
                </Badge>
            </div>

            <div className="flex items-center gap-3">
                <div className="h-14 w-14 overflow-hidden rounded-xl bg-slate-100 border border-slate-100">
                    {instructorPhoto ? (
                        <img
                            src={instructorPhoto}
                            alt={`Foto de ${instructorName}`}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg font-bold text-slate-400 bg-slate-50">
                            {instructorName.charAt(0)}
                        </div>
                    )}
                </div>
                <div>
                    <h3 className="text-base font-bold text-slate-900 leading-tight">
                        {instructorName}
                    </h3>
                    <div className="flex items-center gap-1 text-xs font-medium text-amber-500 mt-1">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <span>
                            {ratingValue.toFixed(1)} <span className="text-slate-400 font-normal">({instructor.reviewsCount || 12})</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Tags / Soft Skills */}
            <div className="mt-3 flex flex-wrap gap-1.5">
                {tags.map(tag => (
                    <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {tag}
                    </span>
                ))}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-3">
                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{instructor.neighborhood}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium ml-5">
                        ~ {displayDistance}
                    </div>
                </div>

                <div className="text-right">
                    <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Valor/Aula</span>
                    <span className="text-lg font-bold text-emerald-600">
                        R$ {priceValue.toFixed(0)}
                    </span>
                </div>
            </div>

            <Button className="mt-4 w-full rounded-xl font-semibold shadow-sm shadow-blue-500/20" size="sm" asChild>
                <Link href={`/instrutor/${instructor.id}`}>Ver Agenda</Link>
            </Button>
        </div>
    );
}
