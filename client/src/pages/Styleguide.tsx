import { useEffect, useRef, useState, type ReactNode } from "react"
import { Moon, Sun } from "lucide-react"
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
                <h1 className="text-3xl font-bold">Design Tokens</h1>
                <p className="text-sm text-muted-foreground">
                  Tokens derived from the HabilitFy brand palette and logo.
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

          <Section title="Components" subtitle="Core shadcn/ui components using tokens.">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Card Title</CardTitle>
                  <CardDescription>Supporting text for the card content.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Button>Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="destructive">Destructive</Button>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2">
                  <Badge>Badge</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                </CardFooter>
              </Card>

              <div className="space-y-4 rounded-xl border bg-card p-6">
                <Alert>
                  <AlertTitle>Alert title</AlertTitle>
                  <AlertDescription>
                    Alerts use the foreground and border tokens for clarity.
                  </AlertDescription>
                </Alert>

                <Alert variant="destructive">
                  <AlertTitle>Destructive alert</AlertTitle>
                  <AlertDescription>
                    Use for critical actions or destructive confirmations.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <div className="text-sm font-semibold">Radio group</div>
                  <RadioGroup defaultValue="option-2" className="gap-3">
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="option-1" id="option-1" />
                      <label htmlFor="option-1" className="text-sm">
                        Option one
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="option-2" id="option-2" />
                      <label htmlFor="option-2" className="text-sm">
                        Option two
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="option-3" id="option-3" />
                      <label htmlFor="option-3" className="text-sm">
                        Option three
                      </label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </StyleguideLayout>
  )
}
