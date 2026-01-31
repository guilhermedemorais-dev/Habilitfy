import { useEffect, useRef, useState, type ReactNode } from "react"
import { Moon, Sun, Bell, Check, ChevronRight, Home, Search, Settings, User, Mail, Plus, Minus, X, AlertCircle } from "lucide-react"
import StyleguideLayout from "@/components/styleguide/StyleguideLayout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const scaleSteps = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"]

const primaryScale = scaleSteps.map((step) => ({
  label: `Primary ${step}`,
  variable: `--primary-${step}`,
}))

const neutralScale = scaleSteps.map((step) => ({
  label: `Neutral ${step}`,
  variable: `--neutral-${step}`,
}))

const semanticColors = [
  { label: "Success", variable: "--success", foreground: "--success-foreground" },
  { label: "Warning", variable: "--warning", foreground: "--warning-foreground" },
  { label: "Error", variable: "--destructive", foreground: "--destructive-foreground" },
  { label: "Info", variable: "--info", foreground: "--info-foreground" },
]

const surfaceTokens = [
  { label: "Background", variable: "--background" },
  { label: "Card", variable: "--card" },
  { label: "Popover", variable: "--popover" },
  { label: "Sidebar", variable: "--sidebar" },
]

const borderTokens = [
  { label: "Border", variable: "--border" },
  { label: "Input", variable: "--input" },
  { label: "Ring", variable: "--ring" },
]

const chartColors = [
  { label: "Chart 1", variable: "--chart-1" },
  { label: "Chart 2", variable: "--chart-2" },
  { label: "Chart 3", variable: "--chart-3" },
  { label: "Chart 4", variable: "--chart-4" },
  { label: "Chart 5", variable: "--chart-5" },
]

const radiusSamples = [
  { label: "Radius SM", value: "var(--radius-sm)" },
  { label: "Radius MD", value: "var(--radius-md)" },
  { label: "Radius LG", value: "var(--radius-lg)" },
  { label: "Radius XL", value: "var(--radius-xl)" },
  { label: "Radius Base", value: "var(--radius)" },
]

const shadowSamples = [
  { label: "Shadow SM", className: "shadow-sm" },
  { label: "Shadow MD", className: "shadow" },
  { label: "Shadow LG", className: "shadow-lg" },
]

function ColorSwatch({
  label,
  variable,
  className,
}: {
  label: string
  variable: string
  className?: string
}) {
  return (
    <div className={cn("rounded-lg border bg-card p-3 text-card-foreground", className)}>
      <div
        className="h-16 w-full rounded-md border"
        style={{ background: `hsl(var(${variable}))` }}
      />
      <div className="mt-2 text-xs font-semibold">{label}</div>
      <div className="text-[11px] text-muted-foreground">{variable}</div>
    </div>
  )
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">{title}</h2>
        {subtitle ? (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

export default function Styleguide() {
  const initialTheme = useRef<boolean | null>(null)
  const [isDark, setIsDark] = useState(false)
  const [sliderValue, setSliderValue] = useState([50])
  const [progressValue, setProgressValue] = useState(60)

  useEffect(() => {
    const root = document.documentElement
    initialTheme.current = root.classList.contains("dark")
    setIsDark(initialTheme.current)
    return () => {
      if (initialTheme.current !== null) {
        root.classList.toggle("dark", initialTheme.current)
      }
    }
  }, [])

  useEffect(() => {
    if (initialTheme.current === null) return
    document.documentElement.classList.toggle("dark", isDark)
  }, [isDark])

  return (
    <StyleguideLayout>
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-10 lg:px-10">
          <header className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">Design Tokens & Components</h1>
                <p className="text-sm text-muted-foreground">
                  Tokens e componentes do design system HabilitFy.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsDark((value) => !value)}
                aria-pressed={isDark}
                className="flex items-center gap-2"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {isDark ? "Light mode" : "Dark mode"}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">Primary: Blue</Badge>
              <Badge variant="secondary">Accent: Green</Badge>
              <Badge variant="secondary">Warning: Yellow</Badge>
              <Badge variant="secondary">Radius: 12px</Badge>
              <Badge variant="secondary">Shadows: Subtle</Badge>
            </div>
          </header>

          <Section title="Primary Scale" subtitle="Blue brand scale from 50 to 900.">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {primaryScale.map((swatch) => (
                <ColorSwatch
                  key={swatch.variable}
                  label={swatch.label}
                  variable={swatch.variable}
                />
              ))}
            </div>
          </Section>

          <Section title="Neutral Scale" subtitle="Warm greys for surfaces and text.">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {neutralScale.map((swatch) => (
                <ColorSwatch
                  key={swatch.variable}
                  label={swatch.label}
                  variable={swatch.variable}
                />
              ))}
            </div>
          </Section>

          <Section title="Surface Tokens" subtitle="Base background and surface colors.">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {surfaceTokens.map((swatch) => (
                <ColorSwatch
                  key={swatch.variable}
                  label={swatch.label}
                  variable={swatch.variable}
                />
              ))}
            </div>
          </Section>

          <Section title="Borders & Focus" subtitle="Borders, inputs, and focus rings.">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {borderTokens.map((swatch) => (
                <ColorSwatch
                  key={swatch.variable}
                  label={swatch.label}
                  variable={swatch.variable}
                />
              ))}
            </div>
          </Section>

          <Section title="Semantic Colors" subtitle="Status colors for UI feedback.">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {semanticColors.map((swatch) => (
                <div key={swatch.variable} className="rounded-lg border bg-card p-3">
                  <div
                    className="flex items-center justify-between rounded-md px-3 py-2 text-xs font-semibold"
                    style={{
                      background: `hsl(var(${swatch.variable}))`,
                      color: `hsl(var(${swatch.foreground}))`,
                    }}
                  >
                    <span>{swatch.label}</span>
                    <span className="text-[11px] opacity-90">{swatch.variable}</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Chart Colors" subtitle="Distinct colors for data visualization.">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {chartColors.map((swatch) => (
                <ColorSwatch
                  key={swatch.variable}
                  label={swatch.label}
                  variable={swatch.variable}
                />
              ))}
            </div>
          </Section>

          <Section title="Typography" subtitle="Headings and body text samples.">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-3 rounded-xl border bg-card p-6">
                <h1 className="text-4xl font-bold">Heading 1</h1>
                <h2 className="text-3xl font-bold">Heading 2</h2>
                <h3 className="text-2xl font-bold">Heading 3</h3>
                <h4 className="text-xl font-bold">Heading 4</h4>
              </div>
              <div className="space-y-4 rounded-xl border bg-card p-6">
                <p className="text-base leading-relaxed">
                  Body text uses the sans family with a calm rhythm for long
                  reading and descriptive content.
                </p>
                <p className="text-sm text-muted-foreground">
                  Small text is used for hints, captions, and secondary labels.
                </p>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Eyebrow label
                </p>
              </div>
            </div>
          </Section>

          <Section title="Radius" subtitle="Rounded corners for cards and controls.">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {radiusSamples.map((sample) => (
                <div
                  key={sample.label}
                  className="flex flex-col items-center gap-3 rounded-lg border bg-card p-4"
                >
                  <div
                    className="h-16 w-16 border bg-muted"
                    style={{ borderRadius: sample.value }}
                  />
                  <div className="text-xs font-semibold">{sample.label}</div>
                  <div className="text-[11px] text-muted-foreground">{sample.value}</div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Shadows" subtitle="Subtle depth for elevation cues.">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shadowSamples.map((sample) => (
                <div
                  key={sample.label}
                  className={cn(
                    "flex items-center justify-between rounded-lg border bg-card p-6",
                    sample.className
                  )}
                >
                  <span className="text-sm font-semibold">{sample.label}</span>
                  <span className="text-xs text-muted-foreground">{sample.className}</span>
                </div>
              ))}
            </div>
          </Section>

          <Separator className="my-4" />

          {/* BUTTONS */}
          <Section title="Buttons" subtitle="Variantes de botões do sistema.">
            <div className="rounded-xl border bg-card p-6">
              <div className="flex flex-wrap gap-3">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
              <Separator className="my-4" />
              <div className="flex flex-wrap gap-3 items-center">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon"><Plus className="h-4 w-4" /></Button>
              </div>
              <Separator className="my-4" />
              <div className="flex flex-wrap gap-3">
                <Button disabled>Disabled</Button>
                <Button variant="outline" disabled>Disabled Outline</Button>
              </div>
            </div>
          </Section>

          {/* INPUTS */}
          <Section title="Inputs" subtitle="Campos de entrada de texto.">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border bg-card p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="input-default">Default Input</Label>
                  <Input id="input-default" placeholder="Digite aqui..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="input-disabled">Disabled Input</Label>
                  <Input id="input-disabled" placeholder="Desabilitado" disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="input-with-icon">Com ícone</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="input-with-icon" placeholder="Buscar..." className="pl-9" />
                  </div>
                </div>
              </div>
              <div className="rounded-xl border bg-card p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="textarea">Textarea</Label>
                  <Textarea id="textarea" placeholder="Digite sua mensagem..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="select">Select</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma opção" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="option1">Opção 1</SelectItem>
                      <SelectItem value="option2">Opção 2</SelectItem>
                      <SelectItem value="option3">Opção 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </Section>

          {/* CHECKBOXES, SWITCHES, RADIOS */}
          <Section title="Selections" subtitle="Checkboxes, Switches e Radio buttons.">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-xl border bg-card p-6 space-y-4">
                <h4 className="font-semibold text-sm">Checkboxes</h4>
                <div className="flex items-center space-x-2">
                  <Checkbox id="check1" />
                  <Label htmlFor="check1">Opção 1</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="check2" defaultChecked />
                  <Label htmlFor="check2">Opção 2 (checked)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="check3" disabled />
                  <Label htmlFor="check3">Disabled</Label>
                </div>
              </div>
              <div className="rounded-xl border bg-card p-6 space-y-4">
                <h4 className="font-semibold text-sm">Switches</h4>
                <div className="flex items-center space-x-2">
                  <Switch id="switch1" />
                  <Label htmlFor="switch1">Notificações</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="switch2" defaultChecked />
                  <Label htmlFor="switch2">Dark Mode</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="switch3" disabled />
                  <Label htmlFor="switch3">Disabled</Label>
                </div>
              </div>
              <div className="rounded-xl border bg-card p-6 space-y-4">
                <h4 className="font-semibold text-sm">Radio Group</h4>
                <RadioGroup defaultValue="opt1" className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="opt1" id="r1" />
                    <Label htmlFor="r1">Opção A</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="opt2" id="r2" />
                    <Label htmlFor="r2">Opção B</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="opt3" id="r3" />
                    <Label htmlFor="r3">Opção C</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </Section>

          {/* SLIDER & PROGRESS */}
          <Section title="Slider & Progress" subtitle="Controles de range e progresso.">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border bg-card p-6 space-y-4">
                <h4 className="font-semibold text-sm">Slider</h4>
                <Slider value={sliderValue} onValueChange={setSliderValue} max={100} step={1} />
                <p className="text-sm text-muted-foreground">Valor: {sliderValue[0]}</p>
              </div>
              <div className="rounded-xl border bg-card p-6 space-y-4">
                <h4 className="font-semibold text-sm">Progress</h4>
                <Progress value={progressValue} />
                <p className="text-sm text-muted-foreground">{progressValue}% completo</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setProgressValue(Math.max(0, progressValue - 10))}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setProgressValue(Math.min(100, progressValue + 10))}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </Section>

          {/* TOGGLE & TOGGLE GROUP */}
          <Section title="Toggle & Toggle Group" subtitle="Botões de alternância.">
            <div className="rounded-xl border bg-card p-6 space-y-6">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Toggle Individual</h4>
                <div className="flex gap-2">
                  <Toggle aria-label="Toggle bold"><strong>B</strong></Toggle>
                  <Toggle aria-label="Toggle italic"><em>I</em></Toggle>
                  <Toggle aria-label="Toggle underline"><u>U</u></Toggle>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Toggle Group (Single)</h4>
                <ToggleGroup type="single" defaultValue="center">
                  <ToggleGroupItem value="left">Left</ToggleGroupItem>
                  <ToggleGroupItem value="center">Center</ToggleGroupItem>
                  <ToggleGroupItem value="right">Right</ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Toggle Group (Multiple)</h4>
                <ToggleGroup type="multiple">
                  <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
                  <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
                  <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          </Section>

          {/* TABS */}
          <Section title="Tabs" subtitle="Navegação em abas.">
            <div className="rounded-xl border bg-card p-6">
              <Tabs defaultValue="account" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="account">Conta</TabsTrigger>
                  <TabsTrigger value="password">Senha</TabsTrigger>
                  <TabsTrigger value="settings">Configurações</TabsTrigger>
                </TabsList>
                <TabsContent value="account" className="mt-4">
                  <p className="text-sm text-muted-foreground">Gerencie as informações da sua conta aqui.</p>
                </TabsContent>
                <TabsContent value="password" className="mt-4">
                  <p className="text-sm text-muted-foreground">Altere sua senha de acesso.</p>
                </TabsContent>
                <TabsContent value="settings" className="mt-4">
                  <p className="text-sm text-muted-foreground">Personalize suas preferências.</p>
                </TabsContent>
              </Tabs>
            </div>
          </Section>

          {/* BADGES */}
          <Section title="Badges" subtitle="Labels e tags de status.">
            <div className="rounded-xl border bg-card p-6">
              <div className="flex flex-wrap gap-3">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
              </div>
            </div>
          </Section>

          {/* AVATARS */}
          <Section title="Avatars" subtitle="Imagens de perfil e placeholders.">
            <div className="rounded-xl border bg-card p-6">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarFallback>AB</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">LG</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </Section>

          {/* SKELETON */}
          <Section title="Skeleton" subtitle="Placeholders de carregamento.">
            <div className="rounded-xl border bg-card p-6 space-y-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
              </div>
              <Skeleton className="h-[100px] w-full" />
            </div>
          </Section>

          {/* ALERTS */}
          <Section title="Alerts" subtitle="Mensagens de feedback ao usuário.">
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Default Alert</AlertTitle>
                <AlertDescription>Informação neutra para o usuário.</AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro!</AlertTitle>
                <AlertDescription>Algo deu errado. Tente novamente.</AlertDescription>
              </Alert>
            </div>
          </Section>

          {/* CARDS */}
          <Section title="Cards" subtitle="Containers de conteúdo.">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Card Title</CardTitle>
                  <CardDescription>Descrição do card com informações adicionais.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Conteúdo do card com informações relevantes.</p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline">Cancelar</Button>
                  <Button>Salvar</Button>
                </CardFooter>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Card Simples</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar><AvatarFallback>U1</AvatarFallback></Avatar>
                    <div>
                      <p className="text-sm font-medium">Usuário 1</p>
                      <p className="text-xs text-muted-foreground">user@email.com</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Section>

          {/* DIALOGS & DRAWERS */}
          <Section title="Dialog & Drawer" subtitle="Modais e painéis deslizantes.">
            <div className="rounded-xl border bg-card p-6">
              <div className="flex flex-wrap gap-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">Abrir Dialog</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Título do Dialog</DialogTitle>
                      <DialogDescription>
                        Esta é a descrição do dialog. Você pode adicionar formulários ou conteúdo aqui.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <p className="text-sm">Conteúdo do modal...</p>
                    </div>
                    <DialogFooter>
                      <Button variant="outline">Cancelar</Button>
                      <Button>Confirmar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Drawer>
                  <DrawerTrigger asChild>
                    <Button variant="outline">Abrir Drawer</Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>Título do Drawer</DrawerTitle>
                      <DrawerDescription>Painel deslizante para ações ou formulários.</DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4">
                      <p className="text-sm">Conteúdo do drawer...</p>
                    </div>
                    <DrawerFooter>
                      <Button>Confirmar</Button>
                      <DrawerClose asChild>
                        <Button variant="outline">Fechar</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              </div>
            </div>
          </Section>

          {/* DROPDOWN & TOOLTIP */}
          <Section title="Dropdown & Tooltip" subtitle="Menus contextuais e dicas.">
            <div className="rounded-xl border bg-card p-6">
              <div className="flex flex-wrap gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">Menu Dropdown</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem><User className="mr-2 h-4 w-4" /> Perfil</DropdownMenuItem>
                    <DropdownMenuItem><Settings className="mr-2 h-4 w-4" /> Configurações</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">Sair</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline">Hover para Tooltip</Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Esta é uma dica útil!</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </Section>

        </div>
      </div>
    </StyleguideLayout>
  )
}

