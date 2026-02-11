import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Car, Globe, Clock, Image as ImageIcon, Info, MessageSquare } from "lucide-react";
import type { Instructor, Review } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface InstructorProfileTabsProps {
    instructor: Instructor & { user?: { firstName?: string; lastName?: string; profileImageUrl?: string } };
    reviews: Review[];
}

const SPECIALTY_LABELS: Record<string, string> = {
    estacionamento: "Estacionamento",
    baliza: "Baliza",
    "direcao-defensiva": "Direção Defensiva",
    "primeira-habilitacao": "Primeira Habilitação",
    reciclagem: "Reciclagem",
    noturno: "Aulas Noturnas",
    moto: "Motocicleta",
    caminhao: "Caminhão/Ônibus",
};

export function InstructorProfileTabs({ instructor, reviews }: InstructorProfileTabsProps) {
    const specialties = (instructor.specialties as string[] | null) || [];
    const languages = (instructor.languages as string[] | null) || ["Português"];
    const galleryImages = (instructor.galleryImages as string[] | null) || [];

    return (
        <Tabs defaultValue="info" className="w-full">
            <TabsList className="w-full grid grid-cols-3 bg-gray-100 rounded-xl p-1 h-auto">
                <TabsTrigger
                    value="gallery"
                    className="flex items-center gap-1.5 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg"
                >
                    <ImageIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Galeria</span>
                </TabsTrigger>
                <TabsTrigger
                    value="info"
                    className="flex items-center gap-1.5 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg"
                >
                    <Info className="w-4 h-4" />
                    <span className="hidden sm:inline">Informações</span>
                </TabsTrigger>
                <TabsTrigger
                    value="reviews"
                    className="flex items-center gap-1.5 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg"
                >
                    <Star className="w-4 h-4" />
                    <span className="hidden sm:inline">Avaliações</span>
                </TabsTrigger>
            </TabsList>

            {/* Tab Galeria */}
            <TabsContent value="gallery" className="mt-6">
                {galleryImages.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhuma publicação ainda</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-2">
                        {galleryImages.map((img, idx) => (
                            <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-slate-100">
                                <img src={img} alt={`Galeria ${idx + 1}`} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                )}
            </TabsContent>

            {/* Tab Informações */}
            <TabsContent value="info" className="mt-6 space-y-6">
                {/* Veículo */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                        <Car className="w-5 h-5 text-slate-400" />
                        <div>
                            <p className="text-xs text-slate-400 uppercase font-medium">Veículo</p>
                            <p className="font-semibold text-slate-800">{instructor.vehicleModel} {instructor.vehicleYear}</p>
                        </div>
                    </div>
                </div>

                {/* Idiomas */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-slate-400" />
                        <div>
                            <p className="text-xs text-slate-400 uppercase font-medium">Idiomas</p>
                            <p className="font-semibold text-slate-800">{languages.join(", ")}</p>
                        </div>
                    </div>
                </div>

                {/* Disponibilidade */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-slate-400" />
                        <div>
                            <p className="text-xs text-slate-400 uppercase font-medium">Disponibilidade</p>
                            <p className="font-semibold text-slate-800">{instructor.workingHours || "Seg-Sáb: 8h-18h"}</p>
                        </div>
                    </div>
                </div>

                {/* Especialidades */}
                {specialties.length > 0 && (
                    <div>
                        <h3 className="font-bold text-slate-900 mb-3">Especialidades</h3>
                        <div className="flex flex-wrap gap-2">
                            {specialties.map((spec) => (
                                <span
                                    key={spec}
                                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-200"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2" />
                                    {SPECIALTY_LABELS[spec] || spec}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </TabsContent>

            {/* Tab Avaliações */}
            <TabsContent value="reviews" className="mt-6">
                {reviews.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Ainda não há avaliações</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reviews.map((review) => (
                            <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-semibold text-sm text-slate-800">Aluno</span>
                                    <span className="text-xs text-slate-400">
                                        {review.createdAt ? format(new Date(review.createdAt), "dd/MM/yyyy", { locale: ptBR }) : ""}
                                    </span>
                                </div>
                                <div className="flex text-yellow-400 mb-2">
                                    {[...Array(review.rating)].map((_, i) => (
                                        <Star key={i} className="w-4 h-4 fill-current" />
                                    ))}
                                </div>
                                <p className="text-sm text-slate-600">{review.comment || "Avaliação enviada."}</p>
                            </div>
                        ))}
                    </div>
                )}
            </TabsContent>
        </Tabs>
    );
}
