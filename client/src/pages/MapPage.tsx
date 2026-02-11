import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, List, Map as MapIcon, ChevronLeft, SearchX, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import type { Instructor } from "@shared/schema";
import { InstructorCard, type InstructorWithUser } from "@/components/InstructorCard";
import {
  InstructorFilters,
  useFilteredInstructors,
  defaultFilters,
  saveFiltersToStorage,
  loadFiltersFromStorage,
  type FilterState
} from "@/components/filters/InstructorFilters";

// Fix Leaflet Icon
const createCustomIcon = () => {
  return divIcon({
    className: "custom-pin",
    html: `
      <div class="relative w-12 h-12 transition-transform hover:scale-110">
        <img 
          src="/marker-icon.png" 
          alt="Instrutor" 
          class="w-full h-full drop-shadow-lg"
        />
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 48], // Bottom center anchor (pin style)
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
  const [location] = useLocation();
  const [selectedInstructor, setSelectedInstructor] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Load filters from localStorage on mount
  const [filters, setFilters] = useState<FilterState>(() => {
    const saved = loadFiltersFromStorage();
    return saved || defaultFilters;
  });

  // Save filters to localStorage when they change
  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    saveFiltersToStorage(newFilters);
  }, []);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setFilters(defaultFilters);
    saveFiltersToStorage(defaultFilters);
  }, []);

  /*
  const isLoading = false;
  const instructors: InstructorWithUser[] = [
    // ... mocked data removed ...
  ] as any;
  */

  const { data: instructors = [], isLoading } = useQuery<InstructorWithUser[]>({
    queryKey: ["/api/instructors"],
  });

  // Get user's geolocation
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.log("Geolocation error:", error.message);
          // Default to Rio de Janeiro if geolocation fails
          setUserLocation([-22.9068, -43.1729]);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      // Default to Rio de Janeiro if geolocation not available
      setUserLocation([-22.9068, -43.1729]);
    }
  }, []);

  // Parse URL params for initial filter state (override localStorage)
  const queryParams = useMemo(() => {
    const search = location.split("?")[1] || "";
    return new URLSearchParams(search);
  }, [location]);

  // Apply URL params to filters on mount (takes priority over localStorage)
  useEffect(() => {
    const urlCategories = (queryParams.get("categories") || "")
      .split(",")
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean);
    const urlMinRating = Number(queryParams.get("minRating")) || 0;
    const urlMinPrice = Number(queryParams.get("minPrice")) || 0;
    const urlMaxPrice = Number(queryParams.get("maxPrice")) || 0;
    const urlSearch = queryParams.get("q") || "";

    if (urlCategories.length > 0 || urlMinRating > 0 || urlMinPrice > 0 || urlMaxPrice > 0 || urlSearch) {
      setFilters(prev => ({
        ...prev,
        categories: urlCategories.length > 0 ? urlCategories : prev.categories,
        minRating: urlMinRating > 0 ? urlMinRating : prev.minRating,
        minPrice: urlMinPrice > 0 ? urlMinPrice : prev.minPrice,
        maxPrice: urlMaxPrice > 0 ? urlMaxPrice : prev.maxPrice,
        searchQuery: urlSearch || prev.searchQuery,
      }));
    }
  }, [queryParams]);

  // Filter instructors using our hook (includes search and sort)
  const filteredInstructors = useFilteredInstructors(
    instructors,
    filters,
    userLocation,
    true // showDistance enabled for map
  );

  const center: [number, number] = userLocation || [-22.9068, -43.1729];

  const currentInstructor = filteredInstructors.find(i => i.id === selectedInstructor);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.distanceRadius !== 15 ||
      filters.minPrice > 0 ||
      filters.maxPrice > 0 ||
      filters.categories.length > 0 ||
      filters.minRating > 0 ||
      filters.searchQuery.trim() !== "" ||
      filters.sortBy !== "relevance"
    );
  }, [filters]);

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

  // Empty state component
  const EmptyState = () => (
    <Card className="border-none shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
      <CardContent className="p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-4">
          <SearchX className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="font-bold text-lg text-slate-800 mb-2">
          Nenhum instrutor encontrado
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          {hasActiveFilters
            ? "Tente ajustar seus filtros para ver mais resultados."
            : "Não há instrutores disponíveis nesta região no momento."
          }
        </p>
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            Limpar todos os filtros
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="relative h-screen w-full bg-background flex flex-col">
      {/* Header Float */}
      <div className="absolute top-0 left-0 right-0 z-[1000] p-4 flex justify-between items-start pointer-events-none">
        <Button
          size="icon"
          variant="secondary"
          className="bg-white shadow-md pointer-events-auto rounded-full h-10 w-10"
          asChild
        >
          <Link href="/">
            <ChevronLeft className="w-5 h-5 text-slate-700" />
          </Link>
        </Button>

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
          <InstructorFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            showDistance={true}
            resultCount={filteredInstructors.length}
          />
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

            {filteredInstructors
              .filter(i => i.lat && i.lng)
              .map((instructor) => (
                <Marker
                  key={instructor.id}
                  position={[parseFloat(instructor.lat!), parseFloat(instructor.lng!)]}
                  icon={createCustomIcon()}
                  eventHandlers={{
                    click: () => setSelectedInstructor(instructor.id),
                  }}
                />
              ))}
          </MapContainer>

          {/* Empty state overlay for map when no results */}
          {filteredInstructors.length === 0 && (
            <div className="absolute inset-0 z-[500] flex items-center justify-center bg-black/20 backdrop-blur-sm">
              <div className="mx-4 w-full max-w-sm">
                <EmptyState />
              </div>
            </div>
          )}

          {/* Selected Instructor Card Float - Usando InstructorCard padrão */}
          {selectedInstructor && currentInstructor && (
            <div className="absolute bottom-20 left-4 right-4 z-[1000] animate-in slide-in-from-bottom-10 fade-in duration-300">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -top-3 -right-3 z-10 h-8 w-8 rounded-full bg-white shadow-lg hover:bg-slate-100"
                  onClick={() => setSelectedInstructor(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <InstructorCard
                  instructor={currentInstructor}
                  className="shadow-2xl border-none"
                />
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="pt-20 pb-24 px-4 overflow-y-auto h-full">
          <div className="flex items-center justify-between mb-4 px-2">
            <h1 className="text-2xl font-bold">Instrutores Próximos</h1>
            <span className="text-sm text-slate-500">
              {filteredInstructors.length} resultado{filteredInstructors.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="space-y-4">
            {filteredInstructors.length === 0 ? (
              <EmptyState />
            ) : (
              filteredInstructors.map((instructor) => (
                <InstructorCard
                  key={instructor.id}
                  instructor={instructor}
                  className={cn(
                    "mb-4 border-none shadow-sm active:scale-[0.98] transition-transform",
                    selectedInstructor === instructor.id && "ring-2 ring-primary"
                  )}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
