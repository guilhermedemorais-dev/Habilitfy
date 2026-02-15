import { Link, useLocation } from "wouter";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import {
  Bike,
  Bus,
  Car,
  CheckCircle2,
  Filter,
  Lock,
  MapPin,
  Search,
  ShieldCheck,
  Star,
  Truck,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getNavItems } from "@/components/layout/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import type { Instructor } from "@shared/schema";
import heroImg from "@assets/generated_images/happy_driving_lesson_in_brazil.png";
import { InstructorCard, type InstructorWithUser } from "@/components/InstructorCard";

const logoBlue = "/logo-topo.webp";

const categories = [
  { icon: Bike, label: "Moto" },
  { icon: Car, label: "Carro" },
  { icon: Bus, label: "Ônibus" },
  { icon: Truck, label: "Caminhão" },
];

const ratingOptions = [4, 4.5, 4.8];

const headerNav = [
  { label: "Início", href: "#inicio" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Para alunos", href: "#para-alunos" },
  { label: "Para instrutores", href: "#para-instrutores" },
  { label: "Quem somos", href: "#quem-somos" },
  { label: "Contato", href: "#contato" },
];

const howSteps = [
  {
    title: "Cadastro",
    description:
      "Aluno e instrutor fazem o cadastro com dados básicos para iniciar a jornada.",
  },
  {
    title: "Validação documental",
    description:
      "Documentos são analisados para garantir segurança e conformidade.",
  },
  {
    title: "Agendamento online",
    description:
      "O aluno escolhe o instrutor e agenda a aula no melhor horário.",
  },
  {
    title: "Pagamento seguro",
    description: "Pagamento dentro da plataforma, com transparência total.",
  },
  {
    title: "Avaliação",
    description:
      "Após a aula, o aluno avalia e o instrutor acompanha a evolução.",
  },
];

const whyItems = [
  {
    title: "No seu ritmo, do seu jeito",
    description:
      "Aulas adaptadas ao nível, dificuldade ou objetivo de cada aluno.",
  },
  {
    title: "Você escolhe o melhor horário",
    description:
      "Agendamento online direto na agenda do instrutor, sem burocracia.",
  },
  {
    title: "Sem pacotes engessados",
    description: "Você paga apenas pelas aulas que fazem sentido para você.",
  },
];

const complianceItems = [
  {
    title: "Apenas alunos aptos",
    description:
      "Cadastro permitido somente para quem possui aprovação no exame teórico ou CNH válida.",
    icon: UserCheck,
  },
  {
    title: "Instrutores validados",
    description: "Somente instrutores credenciados podem oferecer aulas na plataforma.",
    icon: ShieldCheck,
  },
  {
    title: "Pagamento seguro",
    description: "Todas as transações acontecem dentro do sistema.",
    icon: Lock,
  },
];

const CategoryPill = ({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      "flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold shadow-sm transition shrink-0 snap-start",
      active
        ? "border-transparent bg-[#2746e0] text-white shadow-md shadow-blue-900/20"
        : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600"
    )}
  >
    <Icon className="h-4 w-4" />
    <span>{label}</span>
  </button>
);





const DesktopSidebar = () => {
  const [location] = useLocation();
  const { user } = useAuth();
  const navItems = getNavItems(user?.role);

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-20 flex-col items-center bg-slate-950 py-6 text-white md:flex">
      <nav className="mt-6 flex flex-1 flex-col items-center justify-center gap-3">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              title={item.label}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl transition",
                isActive
                  ? "border border-blue-500/40 bg-blue-600/25 text-blue-200 shadow-lg shadow-blue-900/20"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="sr-only">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default function Home() {
  const [, setLocation] = useLocation();
  const [searchValue, setSearchValue] = useState("");
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const { data: apiInstructors = [], isLoading: instructorsLoading } = useQuery<
    InstructorWithUser[]
  >({
    queryKey: ["/api/instructors"],
  });
  const featuredInstructors = apiInstructors.slice(0, 4);

  const hasActiveFilters =
    activeCategories.length > 0 ||
    minRating !== null ||
    minPrice.trim() !== "" ||
    maxPrice.trim() !== "";

  const toggleCategory = (label: string) => {
    setActiveCategories((prev) =>
      prev.includes(label)
        ? prev.filter((category) => category !== label)
        : [...prev, label],
    );
  };

  const goToMap = () => {
    const params = new URLSearchParams();
    const search = searchValue.trim();

    if (search) params.set("q", search);
    if (activeCategories.length > 0) {
      params.set("categories", activeCategories.join(","));
    }
    if (minRating !== null) params.set("minRating", String(minRating));
    if (minPrice.trim() !== "") params.set("minPrice", minPrice.trim());
    if (maxPrice.trim() !== "") params.set("maxPrice", maxPrice.trim());

    const query = params.toString();
    setLocation(`/mapa${query ? `?${query}` : ""}`);
  };

  const clearFilters = () => {
    setActiveCategories([]);
    setMinRating(null);
    setMinPrice("");
    setMaxPrice("");
  };

  return (
    <div className="min-h-screen bg-background text-slate-900">
      <DesktopSidebar />

      <div className="md:ml-20">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center px-4 md:px-8">
            <div className="flex w-24 items-center md:w-28">
              <img
                src={logoBlue}
                alt="HabilitFy"
                className="h-7 w-auto max-w-full object-contain md:h-8"
              />
            </div>
            <nav className="hidden flex-1 items-center justify-center gap-6 text-sm font-semibold text-slate-600 md:flex">
              {headerNav.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="transition hover:text-slate-900"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="hidden w-24 md:block md:w-28" />
          </div>
        </header>

        <main
          id="inicio"
          className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-24 pt-8 md:px-8"
        >
          <section className="relative overflow-hidden rounded-[28px] bg-slate-950 text-white shadow-xl">
            <img
              src={heroImg}
              alt="Aula prática de direção"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-950/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/65 to-slate-900/30" />
            <div className="relative z-10 max-w-3xl px-6 py-12 md:px-12 md:py-16">
              <h1
                className="text-3xl font-semibold leading-tight text-[#589dff] md:text-4xl lg:text-5xl"
                style={{ textShadow: "0 2px 12px rgba(0,0,0,0.35)" }}
              >
                Mais liberdade para aprender e mais autonomia para ensinar
              </h1>
              <p
                className="mt-5 text-base text-white/80 md:text-lg"
                style={{ textShadow: "0 2px 10px rgba(0,0,0,0.35)" }}
              >
                Conectamos alunos aptos à prática a instrutores credenciados, de
                forma autônoma e simplificada, com agendamento online, pagamento
                seguro e tudo dentro das regras do processo de habilitação.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  className="h-12 rounded-full bg-white px-6 text-sm font-semibold text-blue-600 hover:bg-slate-100"
                  asChild
                >
                  <Link href="/cadastro-aluno">Sou aluno</Link>
                </Button>
                <Button
                  className="h-12 rounded-full border border-white/20 bg-white/10 px-6 text-sm font-semibold text-white hover:bg-white/20"
                  asChild
                >
                  <Link href="/cadastro-instrutor">Sou instrutor</Link>
                </Button>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory">
              {categories.map((category) => (
                <CategoryPill
                  key={category.label}
                  {...category}
                  active={activeCategories.includes(category.label)}
                  onClick={() => toggleCategory(category.label)}
                />
              ))}
              <button
                type="button"
                onClick={() => setShowFilters((prev) => !prev)}
                aria-expanded={showFilters}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold shadow-sm transition shrink-0 snap-start",
                  showFilters || hasActiveFilters
                    ? "border-blue-200 bg-blue-50 text-[#2746e0]"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600",
                )}
              >
                <Filter className="h-4 w-4" />
                Filtros
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Digite seu bairro ou cidade"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    goToMap();
                  }
                }}
                className="w-full h-14 pl-5 pr-16 rounded-2xl border border-slate-200 bg-white text-base text-slate-700 outline-none placeholder:text-slate-400 shadow-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
              />
              <button
                type="button"
                onClick={goToMap}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 flex items-center justify-center transition-colors shadow-sm"
              >
                <Search className="h-5 w-5 text-white" />
              </button>
            </div>

            {showFilters && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Avaliação mínima
                  </span>
                  <button
                    type="button"
                    onClick={() => setMinRating(null)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-semibold transition",
                      minRating === null
                        ? "border-transparent bg-[#2746e0] text-white"
                        : "border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-600",
                    )}
                  >
                    Todas
                  </button>
                  {ratingOptions.map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setMinRating(rating)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-semibold transition",
                        minRating === rating
                          ? "border-transparent bg-[#2746e0] text-white"
                          : "border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-600",
                      )}
                    >
                      {rating.toFixed(1)}+
                    </button>
                  ))}
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Preço mínimo
                    <input
                      type="number"
                      min="0"
                      value={minPrice}
                      onChange={(event) => setMinPrice(event.target.value)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 focus:border-blue-200 focus:outline-none"
                      placeholder="R$ 0"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Preço máximo
                    <input
                      type="number"
                      min="0"
                      value={maxPrice}
                      onChange={(event) => setMaxPrice(event.target.value)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 focus:border-blue-200 focus:outline-none"
                      placeholder="R$ 200"
                    />
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                  >
                    Limpar filtros
                  </button>
                  <Button
                    size="sm"
                    className="rounded-full px-4 text-xs font-semibold"
                    onClick={() => {
                      setShowFilters(false);
                      goToMap();
                    }}
                  >
                    Aplicar filtros
                  </Button>
                </div>
              </div>
            )}
          </section>

          <section className="flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Instrutores bem avaliados
              </h3>
              <p className="text-sm text-slate-500">
                Profissionais credenciados, próximos de você e avaliados por
                alunos reais.
              </p>
            </div>
            {instructorsLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`instructor-skeleton-${index}`}
                    className="h-44 rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm animate-pulse"
                  />
                ))}
              </div>
            ) : featuredInstructors.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {featuredInstructors.map((instructor) => (
                  <InstructorCard key={instructor.id} instructor={instructor} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                Nenhum instrutor cadastrado ainda.
              </div>
            )}
          </section>

          <section
            id="como-funciona"
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
          >
            <h3 className="text-xl font-semibold text-slate-900">Como funciona</h3>
            <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
              {howSteps.map((step, index) => {
                const isActive = index === activeStep;
                return (
                  <button
                    key={step.title}
                    type="button"
                    onClick={() => setActiveStep(index)}
                    className={cn(
                      "min-w-[180px] rounded-2xl border px-4 py-4 text-left transition",
                      isActive
                        ? "border-transparent bg-[#2746e0] text-white shadow-lg shadow-blue-900/20"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-200 hover:text-blue-700",
                    )}
                  >
                    <span className={cn(
                      "text-[11px] font-semibold uppercase tracking-[0.2em]",
                      isActive ? "text-white/70" : "text-slate-400",
                    )}>
                      0{index + 1}
                    </span>
                    <p className="mt-2 text-sm font-semibold">{step.title}</p>
                  </button>
                );
              })}
            </div>
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-sm font-semibold text-slate-900">
                {howSteps[activeStep]?.title}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {howSteps[activeStep]?.description}
              </p>
              <div className="mt-4 h-1 w-full rounded-full bg-white">
                <div
                  className="h-1 rounded-full bg-[#2746e0] transition-all"
                  style={{
                    width: `${((activeStep + 1) / howSteps.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <h3 className="text-2xl font-semibold text-slate-900">
                Uma nova forma de aprender — e ensinar.
              </h3>
              <p className="mt-4 text-sm text-slate-600 md:text-base">
                O HabilitFy é um marketplace digital de aulas práticas de
                direção, criado para conectar alunos aptos à prática a
                instrutores credenciados, de forma simples, transparente e
                organizada.
              </p>
              <p className="mt-4 text-sm text-slate-600 md:text-base">
                Inspirado em modelos já consolidados internacionalmente, o
                sistema permite que alunos escolham instrutores com base em
                critérios reais — localização, avaliações e disponibilidade —
                enquanto instrutores atuam de forma independente, com autonomia
                e dentro das normas do processo de habilitação definidas pelos
                órgãos reguladores de trânsito.
              </p>
              <p className="mt-4 text-sm font-semibold text-slate-900">
                Aqui, o aprendizado se adapta à pessoa.
                <br />
                Não o contrário.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["Autonomia", "Segurança", "Praticidade"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-blue-100 bg-blue-50 px-4 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">
                  Por que o HabilitFy?
                </h3>
                <div className="mt-5 space-y-4">
                  {whyItems.map((item) => (
                    <div key={item.title} className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {item.title}
                        </p>
                        <p className="text-sm text-slate-500">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-sm">
                <h3 className="text-lg font-semibold text-white">Tudo dentro das regras.</h3>
                <p className="mt-3 text-sm text-slate-300">
                  O HabilitFy opera respeitando as normas do processo de
                  habilitação no Brasil, garantindo segurança jurídica,
                  transparência e conformidade em todas as etapas.
                </p>
                <div className="mt-6 space-y-4">
                  {complianceItems.map((item) => (
                    <div key={item.title} className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-blue-200 shrink-0">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {item.title}
                        </p>
                        <p className="text-sm text-slate-300">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section
            id="para-alunos"
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
          >
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  Para quem quer aprender a dirigir
                </h3>
                <p className="mt-3 text-sm text-slate-600 md:text-base">
                  Escolha instrutores próximos, compare avaliações reais, agende
                  aulas em poucos cliques e pratique com mais confiança.
                </p>
                <p className="mt-3 text-sm text-slate-600 md:text-base">
                  O HabilitFy é indicado para alunos que já possuem aprovação no
                  exame teórico ou CNH válida e desejam aprender ou evoluir na
                  prática de direção de forma mais flexível e organizada.
                </p>
              </div>
              <Button className="h-12 rounded-full px-6 text-sm font-semibold" asChild>
                <Link href="/cadastro-aluno">Sou aluno</Link>
              </Button>
            </div>
          </section>

          <section
            id="para-instrutores"
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
          >
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  Para quem quer ensinar com autonomia
                </h3>
                <p className="mt-3 text-sm text-slate-600 md:text-base">
                  Atue de forma independente, personalize suas aulas, organize
                  sua agenda e receba de forma segura, sem depender do modelo
                  tradicional de autoescola.
                </p>
                <p className="mt-3 text-sm text-slate-600 md:text-base">
                  O instrutor utiliza o HabilitFy exclusivamente como plataforma
                  tecnológica de intermediação, mantendo total autonomia
                  profissional.
                </p>
              </div>
              <Button className="h-12 rounded-full px-6 text-sm font-semibold" asChild>
                <Link href="/cadastro-instrutor">Sou instrutor</Link>
              </Button>
            </div>
          </section>

          <section
            id="quem-somos"
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
          >
            <h3 className="text-xl font-semibold text-slate-900">Quem somos</h3>
            <p className="mt-3 text-sm text-slate-600 md:text-base">
              O HabilitFy nasceu para modernizar o ensino prático de direção no
              Brasil, utilizando tecnologia para reduzir burocracias, aumentar a
              transparência e criar relações mais equilibradas entre alunos e
              instrutores.
            </p>
            <p className="mt-3 text-sm text-slate-600 md:text-base">
              Acreditamos que plataformas digitais devem organizar processos,
              respeitar as normas legais e facilitar conexões profissionais de
              forma clara e responsável.
            </p>
          </section>

          <footer
            id="contato"
            className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm md:p-8"
          >
            <div className="grid gap-8 md:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  HabilitFy
                </p>
                <p className="mt-3 text-sm text-slate-600">
                  HabilitFy é uma plataforma digital de intermediação entre
                  alunos aptos à prática de direção e instrutores credenciados,
                  respeitando as normas vigentes do processo de habilitação
                  definidas pelos órgãos reguladores de trânsito.
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Mapa do site
                </p>
                <ul className="mt-3 space-y-2 text-sm">
                  {headerNav.map((item) => (
                    <li key={item.href}>
                      <a
                        href={item.href}
                        className="transition hover:text-slate-900"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Links legais
                  </p>
                  <ul className="mt-3 space-y-2 text-sm">
                    <li>FAQ</li>
                    <li>Política de Privacidade (em breve)</li>
                    <li>Termos de Uso (em breve)</li>
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Empresa desenvolvedora
                  </p>
                  <p className="mt-3 text-sm text-slate-600">
                    Desenvolvido por Sophxy – Tech Solutions
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-400">
              © 2026 HabilitFy. Todos os direitos reservados.
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
