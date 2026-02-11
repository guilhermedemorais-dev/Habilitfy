import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { Filter, MapPin, Bike, Car, Bus, Truck, Star, Banknote, X, Search, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterState {
    distanceRadius: number;
    minPrice: number;
    maxPrice: number;
    categories: string[];
    minRating: number;
    searchQuery: string;
    sortBy: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'distance';
}

export const defaultFilters: FilterState = {
    distanceRadius: 50,
    minPrice: 0,
    maxPrice: 0,
    categories: [],
    minRating: 0,
    searchQuery: "",
    sortBy: "relevance",
};

const CATEGORIES = [
    { value: "moto", label: "Moto", icon: Bike },
    { value: "carro", label: "Carro", icon: Car },
    { value: "onibus", label: "Ônibus", icon: Bus },
    { value: "caminhao", label: "Caminhão", icon: Truck },
] as const;

const RATING_OPTIONS = [
    { value: "0", label: "Todas" },
    { value: "4.0", label: "4.0+" },
    { value: "4.5", label: "4.5+" },
    { value: "4.8", label: "4.8+" },
];

const SORT_OPTIONS = [
    { value: "relevance", label: "Relevância" },
    { value: "price_asc", label: "Menor preço" },
    { value: "price_desc", label: "Maior preço" },
    { value: "rating", label: "Melhor avaliação" },
    { value: "distance", label: "Mais próximo" },
] as const;

interface InstructorFiltersProps {
    filters: FilterState;
    onFiltersChange: (filters: FilterState) => void;
    showDistance?: boolean;
    resultCount?: number;
    trigger?: React.ReactNode;
}

export function InstructorFilters({
    filters,
    onFiltersChange,
    showDistance = false,
    resultCount,
    trigger,
}: InstructorFiltersProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [localFilters, setLocalFilters] = useState<FilterState>(filters);

    const handleOpen = useCallback((open: boolean) => {
        if (open) {
            setLocalFilters(filters);
        }
        setIsOpen(open);
    }, [filters]);

    const handleApply = useCallback(() => {
        onFiltersChange(localFilters);
        setIsOpen(false);
    }, [localFilters, onFiltersChange]);

    const handleClear = useCallback(() => {
        setLocalFilters(defaultFilters);
    }, []);

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (filters.distanceRadius !== 50 && showDistance) count++;
        if (filters.minPrice > 0) count++;
        if (filters.maxPrice > 0) count++;
        if (filters.categories.length > 0) count++;
        if (filters.minRating > 0) count++;
        if (filters.searchQuery.trim()) count++;
        if (filters.sortBy !== "relevance") count++;
        return count;
    }, [filters, showDistance]);

    const defaultTrigger = (
        <Button
            variant="secondary"
            size="icon"
            className={cn(
                "bg-white shadow-md rounded-full h-10 w-10 text-slate-700 relative",
                activeFiltersCount > 0 && "ring-2 ring-primary ring-offset-2"
            )}
        >
            <Filter className="w-4 h-4" />
            {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {activeFiltersCount}
                </span>
            )}
        </Button>
    );

    return (
        <Drawer open={isOpen} onOpenChange={handleOpen}>
            <DrawerTrigger asChild>
                {trigger || defaultTrigger}
            </DrawerTrigger>
            <DrawerContent className="max-h-[90vh]">
                <DrawerHeader className="border-b pb-4">
                    <div className="flex items-center justify-between">
                        <DrawerTitle className="text-lg font-bold">Filtrar instrutores</DrawerTitle>
                        <DrawerClose asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <X className="h-4 w-4" />
                            </Button>
                        </DrawerClose>
                    </div>
                </DrawerHeader>

                <div className="px-4 py-5 space-y-6 overflow-y-auto">
                    {/* Search Field */}
                    <div className="relative">
                        <Input
                            type="text"
                            placeholder="Digite seu bairro ou cidade"
                            value={localFilters.searchQuery}
                            onChange={(e) => setLocalFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                            className="h-12 pl-4 pr-14 rounded-xl border-slate-200 bg-slate-50/50 text-base placeholder:text-slate-400 focus:bg-white focus:border-primary/30 transition-colors"
                        />
                        {localFilters.searchQuery ? (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600"
                                onClick={() => setLocalFilters(prev => ({ ...prev, searchQuery: "" }))}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        ) : (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                                <Search className="h-4 w-4 text-white" />
                            </div>
                        )}
                    </div>

                    {/* Distance Radius */}
                    {showDistance && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-primary" />
                                <Label className="text-sm font-semibold">Raio de distância</Label>
                            </div>
                            <Slider
                                value={[localFilters.distanceRadius]}
                                onValueChange={(value) => setLocalFilters(prev => ({ ...prev, distanceRadius: value[0] }))}
                                min={1}
                                max={50}
                                step={1}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>1 km</span>
                                <span className="font-semibold text-foreground">{localFilters.distanceRadius} km</span>
                                <span>50 km</span>
                            </div>
                            <Separator />
                        </div>
                    )}

                    {/* Categories */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-primary" />
                            <Label className="text-sm font-semibold">Categoria</Label>
                        </div>
                        <ToggleGroup
                            type="multiple"
                            value={localFilters.categories}
                            onValueChange={(value) => setLocalFilters(prev => ({ ...prev, categories: value }))}
                            className="flex flex-wrap gap-2 justify-start"
                        >
                            {CATEGORIES.map(({ value, label, icon: Icon }) => (
                                <ToggleGroupItem
                                    key={value}
                                    value={value}
                                    className="rounded-full px-4 py-2 h-9 data-[state=on]:bg-primary data-[state=on]:text-white"
                                >
                                    <Icon className="h-4 w-4 mr-2" />
                                    {label}
                                </ToggleGroupItem>
                            ))}
                        </ToggleGroup>
                    </div>

                    <Separator />

                    {/* Price Range */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Banknote className="h-4 w-4 text-primary" />
                            <Label className="text-sm font-semibold">Faixa de preço</Label>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Mínimo</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={localFilters.minPrice || ""}
                                        onChange={(e) => setLocalFilters(prev => ({ ...prev, minPrice: Number(e.target.value) || 0 }))}
                                        className="pl-9 h-10"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Máximo</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                                    <Input
                                        type="number"
                                        placeholder="200"
                                        value={localFilters.maxPrice || ""}
                                        onChange={(e) => setLocalFilters(prev => ({ ...prev, maxPrice: Number(e.target.value) || 0 }))}
                                        className="pl-9 h-10"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Rating */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-primary" />
                            <Label className="text-sm font-semibold">Avaliação mínima</Label>
                        </div>
                        <RadioGroup
                            value={String(localFilters.minRating)}
                            onValueChange={(value) => setLocalFilters(prev => ({ ...prev, minRating: Number(value) }))}
                            className="flex flex-wrap gap-2"
                        >
                            {RATING_OPTIONS.map(({ value, label }) => (
                                <div key={value} className="flex items-center">
                                    <RadioGroupItem
                                        value={value}
                                        id={`rating-${value}`}
                                        className="peer sr-only"
                                    />
                                    <Label
                                        htmlFor={`rating-${value}`}
                                        className={cn(
                                            "rounded-full border px-4 py-2 text-sm font-medium cursor-pointer transition-all",
                                            "peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-white peer-data-[state=checked]:border-primary",
                                            "hover:border-primary/50"
                                        )}
                                    >
                                        {label}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>

                    <Separator />

                    {/* Sort By */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <ArrowUpDown className="h-4 w-4 text-primary" />
                            <Label className="text-sm font-semibold">Ordenar por</Label>
                        </div>
                        <Select
                            value={localFilters.sortBy}
                            onValueChange={(value: FilterState['sortBy']) => setLocalFilters(prev => ({ ...prev, sortBy: value }))}
                        >
                            <SelectTrigger className="w-full h-11">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                {SORT_OPTIONS.map(({ value, label }) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DrawerFooter className="border-t pt-4">
                    <div className="flex gap-3 w-full">
                        <Button
                            variant="outline"
                            className="flex-1 h-11"
                            onClick={handleClear}
                        >
                            Limpar filtros
                        </Button>
                        <Button
                            className="flex-1 h-11"
                            onClick={handleApply}
                        >
                            {resultCount !== undefined
                                ? `Ver ${resultCount} resultado${resultCount !== 1 ? "s" : ""}`
                                : "Aplicar filtros"
                            }
                        </Button>
                    </div>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}

// localStorage keys
const FILTERS_STORAGE_KEY = "habilitfy_instructor_filters";

// Save filters to localStorage
export function saveFiltersToStorage(filters: FilterState): void {
    try {
        localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
    } catch (e) {
        console.warn("Failed to save filters to localStorage:", e);
    }
}

// Load filters from localStorage
export function loadFiltersFromStorage(): FilterState | null {
    try {
        const saved = localStorage.getItem(FILTERS_STORAGE_KEY);
        if (saved) {
            return JSON.parse(saved) as FilterState;
        }
    } catch (e) {
        console.warn("Failed to load filters from localStorage:", e);
    }
    return null;
}

// Clear filters from localStorage
export function clearFiltersFromStorage(): void {
    try {
        localStorage.removeItem(FILTERS_STORAGE_KEY);
    } catch (e) {
        console.warn("Failed to clear filters from localStorage:", e);
    }
}

// Utility function for distance calculation (Haversine formula)
export function getDistanceFromLatLonInKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Hook for filtering AND sorting instructors
export function useFilteredInstructors<T extends {
    lat?: string | null;
    lng?: string | null;
    pricePerHour: string;
    rating?: string | null;
    vehicleType?: string | null;
    fullName?: string | null;
    city?: string | null;
    neighborhood?: string | null;
}>(
    instructors: T[],
    filters: FilterState,
    userLocation: [number, number] | null,
    showDistance: boolean
): T[] {
    return useMemo(() => {
        // First filter
        let filtered = instructors.filter((instructor) => {
            // Search query filter
            if (filters.searchQuery.trim()) {
                const query = filters.searchQuery.toLowerCase();
                const name = (instructor.fullName || "").toLowerCase();
                const city = (instructor.city || "").toLowerCase();
                const neighborhood = (instructor.neighborhood || "").toLowerCase();
                if (!name.includes(query) && !city.includes(query) && !neighborhood.includes(query)) {
                    return false;
                }
            }

            // Distance filter
            if (showDistance && userLocation && instructor.lat && instructor.lng) {
                const distance = getDistanceFromLatLonInKm(
                    userLocation[0],
                    userLocation[1],
                    parseFloat(instructor.lat),
                    parseFloat(instructor.lng)
                );
                if (distance > filters.distanceRadius) return false;
            }

            // Price filters
            const price = Number(instructor.pricePerHour || 0);
            if (filters.minPrice > 0 && price < filters.minPrice) return false;
            if (filters.maxPrice > 0 && price > filters.maxPrice) return false;

            // Category filter
            if (filters.categories.length > 0) {
                const vehicleType = (instructor.vehicleType || "").toLowerCase();
                const matchesCategory = filters.categories.some((cat) =>
                    vehicleType.includes(cat.toLowerCase())
                );
                if (!matchesCategory) return false;
            }

            // Rating filter
            const rating = Number(instructor.rating || 0);
            if (filters.minRating > 0 && rating < filters.minRating) return false;

            return true;
        });

        // Then sort
        if (filters.sortBy !== "relevance") {
            filtered = [...filtered].sort((a, b) => {
                switch (filters.sortBy) {
                    case "price_asc":
                        return Number(a.pricePerHour || 0) - Number(b.pricePerHour || 0);
                    case "price_desc":
                        return Number(b.pricePerHour || 0) - Number(a.pricePerHour || 0);
                    case "rating":
                        return Number(b.rating || 0) - Number(a.rating || 0);
                    case "distance":
                        if (!userLocation) return 0;
                        const distA = a.lat && a.lng
                            ? getDistanceFromLatLonInKm(userLocation[0], userLocation[1], parseFloat(a.lat), parseFloat(a.lng))
                            : Infinity;
                        const distB = b.lat && b.lng
                            ? getDistanceFromLatLonInKm(userLocation[0], userLocation[1], parseFloat(b.lat), parseFloat(b.lng))
                            : Infinity;
                        return distA - distB;
                    default:
                        return 0;
                }
            });
        }

        return filtered;
    }, [instructors, filters, userLocation, showDistance]);
}
