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
  category: "Moto" | "Carro" | "Ônibus" | "Caminhão";
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
    category: "Carro",
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
    category: "Carro",
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
    category: "Carro",
    vehicle: "Fiat Argo 2021",
    vehicleType: "Manual",
    neighborhood: "Tijuca, RJ",
    lat: -22.9255,
    lng: -43.2323,
    bio: "Aulas dinâmicas e focadas na aprovação do Detran. Conheço todos os percursos de prova.",
    verified: true,
  },
  {
    id: "4",
    name: "Rafaela Mota",
    photo: femaleInstructor,
    rating: 4.8,
    reviewsCount: 72,
    price: 65,
    category: "Moto",
    vehicle: "Honda CG 160 2022",
    vehicleType: "Manual",
    neighborhood: "Centro, RJ",
    lat: -22.9035,
    lng: -43.2096,
    bio: "Instrutora de moto com foco em controle e segurança. Aulas objetivas e personalizadas.",
    verified: true,
  },
  {
    id: "5",
    name: "Marcos Oliveira",
    photo: maleInstructor,
    rating: 4.6,
    reviewsCount: 41,
    price: 140,
    category: "Ônibus",
    vehicle: "Mercedes-Benz OF 1721",
    vehicleType: "Manual",
    neighborhood: "Barra da Tijuca, RJ",
    lat: -23.0003,
    lng: -43.3659,
    bio: "Experiência em veículos pesados e treinamento para habilitação profissional.",
    verified: true,
  },
  {
    id: "6",
    name: "Diego Almeida",
    photo: maleInstructor,
    rating: 4.9,
    reviewsCount: 58,
    price: 160,
    category: "Caminhão",
    vehicle: "Volkswagen Delivery 2020",
    vehicleType: "Manual",
    neighborhood: "São Cristóvão, RJ",
    lat: -22.895,
    lng: -43.2209,
    bio: "Aulas práticas para caminhão com foco em manobras e direção defensiva.",
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
