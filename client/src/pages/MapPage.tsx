import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Filter, Navigation, List, Map as MapIcon, ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { useQuery } from "@tanstack/react-query";
import type { Instructor } from "@shared/schema";

// Fix Leaflet Icon
const createCustomIcon = (price: number) => {
  return divIcon({
    className: "custom-pin",
    html: `<div class="bg-primary text-white font-bold text-xs px-2 py-1 rounded-lg shadow-lg border-2 border-white transform -translate-x-1/2 -translate-y-full whitespace-nowrap">R$ ${price}</div><div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-primary mx-auto"></div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });
};

function MapController({ coords }: { coords: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(coords, 14, { duration: 2 });
  }, [coords, map]);
  return null;
}

export default function MapPage() {
  const [selectedInstructor, setSelectedInstructor] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  
  const { data: instructors = [], isLoading } = useQuery<Instructor[]>({
    queryKey: ["/api/instructors"],
  });
  
  const center: [number, number] = [-22.9068, -43.1729];

  const currentInstructor = instructors.find(i => i.id === selectedInstructor);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando instrutores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-gray-100 flex flex-col">
      {/* Header Float */}
      <div className="absolute top-0 left-0 right-0 z-[1000] p-4 flex justify-between items-start pointer-events-none">
        <Link href="/">
            <Button size="icon" variant="secondary" className="bg-white shadow-md pointer-events-auto rounded-full h-10 w-10">
                <ChevronLeft className="w-5 h-5 text-slate-700" />
            </Button>
        </Link>
        
        <div className="flex gap-2 pointer-events-auto">
             <Button 
                variant="secondary" 
                size="sm" 
                className="bg-white shadow-md rounded-full px-4 font-medium text-slate-700"
                onClick={() => setViewMode(viewMode === "map" ? "list" : "map")}
             >
                {viewMode === "map" ? <List className="w-4 h-4 mr-2" /> : <MapIcon className="w-4 h-4 mr-2" />}
                {viewMode === "map" ? "Lista" : "Mapa"}
             </Button>
             <Button variant="secondary" size="icon" className="bg-white shadow-md rounded-full h-10 w-10 text-slate-700">
                <Filter className="w-4 h-4" />
             </Button>
        </div>
      </div>

      {viewMode === "map" ? (
        <>
            <MapContainer 
                center={center} 
                zoom={13} 
                className="w-full h-full z-0" 
                zoomControl={false}
            >
                <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                <MapController coords={center} />
                
                {instructors
                  .filter(i => i.lat && i.lng)
                  .map((instructor) => (
                    <Marker
                        key={instructor.id}
                        position={[parseFloat(instructor.lat!), parseFloat(instructor.lng!)]}
                        icon={createCustomIcon(parseFloat(instructor.pricePerHour))}
                        eventHandlers={{
                        click: () => setSelectedInstructor(instructor.id),
                        }}
                    />
                  ))}
            </MapContainer>

            {/* Selected Instructor Card Float */}
            {selectedInstructor && currentInstructor && (
                <div className="absolute bottom-20 left-4 right-4 z-[1000] animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <Card className="border-none shadow-2xl rounded-2xl overflow-hidden">
                        <CardContent className="p-0 flex h-32">
                            <div className="w-32 h-full relative bg-gradient-to-br from-green-100 to-yellow-100 flex items-center justify-center">
                                {currentInstructor.vehicleImageUrl ? (
                                  <img src={currentInstructor.vehicleImageUrl} className="w-full h-full object-cover" alt="Veículo" />
                                ) : (
                                  <span className="text-3xl">🚗</span>
                                )}
                                <div className="absolute top-2 left-2 bg-yellow-400 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                    {currentInstructor.rating || "5.0"} ★
                                </div>
                            </div>
                            <div className="flex-1 p-4 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-slate-900 leading-tight">Instrutor</h3>
                                        <span className="font-bold text-primary">R${currentInstructor.pricePerHour}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">{currentInstructor.vehicleModel} • {currentInstructor.vehicleType}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{currentInstructor.neighborhood}</p>
                                </div>
                                <div className="flex gap-2 mt-2">
                                     <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-8 flex-1 text-xs border-slate-200"
                                        onClick={() => setSelectedInstructor(null)}
                                    >
                                        Fechar
                                    </Button>
                                    <Link href={`/instrutor/${currentInstructor.id}`} className="flex-1">
                                        <Button size="sm" className="w-full h-8 text-xs bg-primary hover:bg-green-700 text-white shadow-sm">
                                            Ver Perfil
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </>
      ) : (
          <div className="pt-20 pb-24 px-4 overflow-y-auto h-full">
              <h1 className="text-2xl font-bold mb-4 px-2">Instrutores Próximos</h1>
              <div className="space-y-4">
                  {instructors.map((instructor) => (
                      <Link key={instructor.id} href={`/instrutor/${instructor.id}`}>
                        <Card className="border-none shadow-sm active:scale-[0.98] transition-transform">
                            <CardContent className="p-4 flex gap-4">
                                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-green-100 to-yellow-100 flex items-center justify-center overflow-hidden">
                                  {instructor.vehicleImageUrl ? (
                                    <img src={instructor.vehicleImageUrl} className="w-full h-full object-cover" alt="Veículo" />
                                  ) : (
                                    <span className="text-3xl">🚗</span>
                                  )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between">
                                        <h3 className="font-bold text-slate-900">Instrutor Profissional</h3>
                                        <div className="flex items-center gap-1 text-yellow-600 font-bold text-sm">
                                            <Star className="w-3 h-3 fill-current" />
                                            {instructor.rating || "5.0"}
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-500">{instructor.vehicleModel} • {instructor.vehicleType}</p>
                                    <p className="text-sm text-slate-400 mt-1">{instructor.neighborhood}</p>
                                    <div className="mt-2 flex items-center justify-between">
                                        <span className="font-bold text-primary">R$ {instructor.pricePerHour}<span className="text-xs font-normal text-slate-400">/aula</span></span>
                                        <Button size="sm" variant="ghost" className="h-7 text-primary hover:text-primary hover:bg-green-50 px-2">Ver detalhes</Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                      </Link>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
}
