import { Star, MapPin, Car, Shield, Clock } from "lucide-react";
import maleInstructor from "@assets/generated_images/male_driving_instructor_portrait.png";
import femaleInstructor from "@assets/generated_images/female_driving_instructor_portrait.png";

export interface Instructor {
  id: string;
  name: string;
  photo: string;
  rating: number;
  reviewsCount: number;
  price: number;
  vehicle: string;
  vehicleType: "Manual" | "Automatico";
  neighborhood: string;
  lat: number;
  lng: number;
  bio: string;
  verified: boolean;
}

export const instructors: Instructor[] = [
  {
    id: "1",
    name: "Carlos Silva",
    photo: maleInstructor,
    rating: 4.9,
    reviewsCount: 124,
    price: 80,
    vehicle: "Hyundai HB20 2023",
    vehicleType: "Manual",
    neighborhood: "Copacabana, RJ",
    lat: -22.9694,
    lng: -43.1868,
    bio: "Instrutor credenciado há 10 anos. Especialista em baliza e direção defensiva. Paciente e calmo.",
    verified: true,
  },
  {
    id: "2",
    name: "Fernanda Costa",
    photo: femaleInstructor,
    rating: 5.0,
    reviewsCount: 89,
    price: 95,
    vehicle: "Honda Fit 2022",
    vehicleType: "Automatico",
    neighborhood: "Botafogo, RJ",
    lat: -22.9519,
    lng: -43.1843,
    bio: "Aula prática para habilitados e iniciantes. Foco em perder o medo de dirigir no trânsito intenso.",
    verified: true,
  },
  {
    id: "3",
    name: "Roberto Almeida",
    photo: maleInstructor, // Reusing male image for mock
    rating: 4.7,
    reviewsCount: 56,
    price: 75,
    vehicle: "Fiat Argo 2021",
    vehicleType: "Manual",
    neighborhood: "Tijuca, RJ",
    lat: -22.9255,
    lng: -43.2323,
    bio: "Aulas dinâmicas e focadas na aprovação do Detran. Conheço todos os percursos de prova.",
    verified: true,
  },
];

export const reviews = [
  {
    id: 1,
    user: "Ana P.",
    rating: 5,
    text: "O Carlos é excelente! Tinha muito medo de ladeira e ele me ajudou a superar. Recomendo demais!",
    date: "2 dias atrás",
  },
  {
    id: 2,
    user: "João M.",
    rating: 5,
    text: "Aula muito produtiva. O carro é novo e fácil de dirigir.",
    date: "1 semana atrás",
  },
];
