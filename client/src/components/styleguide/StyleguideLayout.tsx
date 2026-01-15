import type { ReactNode } from "react"
import { Link, useLocation } from "wouter"
import { cn } from "@/lib/utils"
import { navigation } from "@/components/styleguide/navigation"

export default function StyleguideLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="w-full border-b bg-card p-6 lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:border-b-0 lg:border-r lg:overflow-y-auto">
        <div className="flex items-center justify-between">
          <Link href="/styleguide" className="text-lg font-bold tracking-tight">
            Design System
          </Link>
        </div>

        <nav className="mt-6 flex flex-col gap-6">
          {navigation.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {section.title}
              </h3>
              <ul className="mt-3 flex flex-col gap-1">
                {section.items.map((item) => {
                  const isActive = location === item.href
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        )}
                      >
                        {item.name}
                      </Link>
                    </li>
                  )
                })}
                {section.items.length === 0 && (
                  <li className="text-xs text-muted-foreground">
                    Components will be added in Prompt 2.
                  </li>
                )}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <main className="flex-1 lg:ml-64">{children}</main>
    </div>
  )
}
