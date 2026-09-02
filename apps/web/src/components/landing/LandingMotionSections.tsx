"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowUpRight, Check } from "@/components/public/icons";
import { MotionFloat, MotionItem, MotionReveal, MotionStagger, motion } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api-client";

export function LandingHeroContent() {
  return (
    <div className="mx-auto max-w-[900px] text-center px-4">
      <MotionReveal>
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary-200/50 dark:border-primary-500/30 bg-primary-50/50 dark:bg-primary-900/20 px-3.5 py-1.5 text-[12px] font-semibold text-primary-700 dark:text-primary-300 backdrop-blur-md shadow-sm transition-all hover:bg-primary-100/50 dark:hover:bg-primary-800/30">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-600/30 text-primary-600 dark:text-primary-400 text-[10px]">✦</span>
          ProductStudio 2.0 is now available
        </div>
      </MotionReveal>

      <MotionReveal delay={0.08}>
        <h1 className="mt-8 text-[52px] font-bold leading-[0.95] tracking-[-0.03em] text-foreground sm:text-[72px] lg:text-[88px] selection:bg-primary-500/30">
          Design engineering,
          <span className="block bg-[linear-gradient(90deg,#3b82f6,#8b5cf6_40%,#ec4899_70%,#ef4444)] bg-clip-text text-transparent pb-2 drop-shadow-sm">
            perfected.
          </span>
        </h1>
      </MotionReveal>

      <MotionReveal delay={0.16}>
        <p className="mx-auto mt-6 max-w-[620px] text-[17px] leading-relaxed text-neutral-600 dark:text-neutral-300 sm:text-[19px]">
          Build stunning web applications from a unified visual canvas. No handoffs, no compromises—just your ideas shipping to production instantly.
        </p>
      </MotionReveal>

      <MotionReveal delay={0.24}>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row shadow-primary-500/20">
          <Button asChild size="lg" className="group relative h-12 w-full overflow-hidden rounded-full px-8 text-[15px] font-bold sm:w-auto bg-primary-600 text-white hover:bg-primary-700 hover:scale-105 transition-all shadow-[0_0_40px_rgba(59,130,246,0.5)] active:scale-95 border border-primary-500/50">
            <Link href="/register">
              <span className="relative z-10 flex items-center">Start building <ArrowUpRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] -translate-x-[150%] transition-transform duration-700 ease-out group-hover:translate-x-[150%]" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="group h-12 w-full rounded-full border border-neutral-300 dark:border-neutral-700 bg-white/50 dark:bg-black/40 backdrop-blur-md px-8 text-[15px] font-bold text-foreground hover:bg-white dark:hover:bg-neutral-800 transition-all sm:w-auto active:scale-95">
            <a href="#showcase">
              Explore platform
            </a>
          </Button>
        </div>
      </MotionReveal>

      <MotionReveal delay={0.32}>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-medium text-[#8a857e] dark:text-neutral-500">
          <span className="flex items-center gap-1.5"><Check /> No credit card</span>
          <span className="flex items-center gap-1.5"><Check /> Free forever plan</span>
          <span className="flex items-center gap-1.5"><Check /> Publish in minutes</span>
        </div>
      </MotionReveal>
    </div>
  );
}

export function LandingFeatureCards() {
  const items = [
    ["01", "Design with freedom", "A fluid visual canvas with precise controls, responsive layouts, and reusable components."],
    ["02", "Built for systems", "Create a governed component library that keeps every page consistent and on-brand."],
    ["03", "Ship with confidence", "Production-ready output, instant previews, and publishing without the engineering bottleneck."],
  ] as const;

  return (
    <MotionStagger className="grid gap-4 md:grid-cols-3">
      {items.map(([number, title, body]) => (
        <MotionItem key={number} className="h-full">
          <Card className="group relative h-full rounded-[16px] border border-neutral-200/60 bg-white/50 dark:border-white/[0.08] dark:bg-white/[0.02] p-8 transition-all hover:bg-neutral-50 dark:hover:bg-white/[0.04]">
            <div className="relative flex flex-col h-full">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-300">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={number === "01" ? "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" : number === "02" ? "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" : "M13 10V3L4 14h7v7l9-11h-7z"} />
                </svg>
              </span>
              <h3 className="mt-8 text-lg font-medium tracking-tight text-foreground">{title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-neutral-500 dark:text-[#A1A1AA]">{body}</p>
            </div>
          </Card>
        </MotionItem>
      ))}
    </MotionStagger>
  );
}

export function LandingTrust() {
  return (
    <MotionReveal delay={0.35}>
      <div className="mt-16 text-center text-sm font-medium text-neutral-500 dark:text-neutral-400">
        <p>Trusted by creators and developers building the next generation of web experiences.</p>
      </div>
    </MotionReveal>
  );
}

export function LandingHowItWorks() {
  const steps = [
    { num: "01", title: "Choose a template", desc: "Start from a proven foundation or a blank canvas." },
    { num: "02", title: "Customize your project", desc: "Use our visual canvas to design and build freely." },
    { num: "03", title: "Launch your website", desc: "Publish instantly and share your vision with the world." }
  ];

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-24 sm:py-32 lg:px-8 border-t border-neutral-200/50 dark:border-white/5 mt-32">
      <MotionReveal>
        <div className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">How it works</h2>
          <p className="mt-4 text-neutral-500 dark:text-[#A1A1AA]">Three simple steps to go from idea to production.</p>
        </div>
      </MotionReveal>
      <MotionStagger className="mt-20 grid gap-12 md:grid-cols-3 relative">
        <div className="hidden md:block absolute top-[24px] left-[16%] right-[16%] h-[1px] bg-gradient-to-r from-transparent via-neutral-200 dark:via-white/10 to-transparent" />
        {steps.map((step) => (
          <MotionItem key={step.num} className="relative z-10">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-[#0a0a0a] text-neutral-900 dark:text-white font-medium text-sm shadow-[0_0_0_1px_rgba(0,0,0,0.08)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.1)]">
                {step.num}
              </div>
              <h3 className="mt-6 text-[17px] font-medium tracking-tight text-foreground">{step.title}</h3>
              <p className="mt-2 text-[14px] text-neutral-500 dark:text-[#A1A1AA] max-w-[240px]">{step.desc}</p>
            </div>
          </MotionItem>
        ))}
      </MotionStagger>
    </div>
  );
}

export function LandingTemplateShowcase() {
  const [templates, setTemplates] = useState<{ id: string; name: string; description: string | null; }[]>([]);

  useEffect(() => {
    api.get<any[]>("/api/templates").then(res => {
      setTemplates(res.slice(0, 3)); // show top 3
    }).catch(() => { });
  }, []);

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-24 sm:py-32 lg:px-8">
      <MotionReveal>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Start from a template</h2>
            <p className="mt-3 text-[16px] text-muted-foreground max-w-xl">
              Don&apos;t start from scratch. Use one of our professionally crafted templates to jumpstart your next project.
            </p>
          </div>
          <Button asChild variant="outline" className="shrink-0 rounded-full dark:border-neutral-700 bg-white dark:bg-black/40">
            <Link href="/register">View all templates</Link>
          </Button>
        </div>
      </MotionReveal>

      {templates.length > 0 ? (
        <MotionStagger className="grid gap-6 md:grid-cols-3">
          {templates.map((t, index) => {
            const gradients = [
              "from-blue-500/20 to-purple-500/20",
              "from-emerald-500/20 to-teal-500/20",
              "from-rose-500/20 to-orange-500/20"
            ];
            const borderColors = [
              "border-blue-500/30",
              "border-emerald-500/30",
              "border-rose-500/30"
            ];
            const bgClass = index < gradients.length ? gradients[index] : gradients[0];
            const borderClass = index < borderColors.length ? borderColors[index] : borderColors[0];

            return (
              <MotionItem key={t.id}>
                <Card className="group overflow-hidden rounded-[16px] bg-transparent border border-neutral-200 dark:border-white/10 transition-all hover:bg-neutral-50 dark:hover:bg-white/[0.02]">
                  <div className={`aspect-[16/10] bg-gradient-to-br ${bgClass} overflow-hidden relative border-b border-neutral-200 dark:border-white/10 p-4 flex flex-col justify-between`}>
                    {/* Fake UI Header */}
                    <div className="flex items-center justify-between w-full opacity-60">
                      <div className="w-16 h-3 rounded-full bg-foreground/20" />
                      <div className="flex gap-2">
                        <div className="w-6 h-1.5 rounded-full bg-foreground/20" />
                        <div className="w-6 h-1.5 rounded-full bg-foreground/20" />
                      </div>
                    </div>
                    {/* Fake UI Body */}
                    <div className="flex-1 flex items-center justify-center">
                      <div className={`w-32 h-20 rounded-lg border ${borderClass} bg-background/50 backdrop-blur-sm shadow-sm flex flex-col items-center justify-center p-3 gap-2`}>
                        <div className="w-20 h-2 rounded-full bg-foreground/30" />
                        <div className="w-12 h-1.5 rounded-full bg-foreground/20" />
                        <div className="mt-2 w-16 h-4 rounded-md bg-primary-500/40" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-card cursor-pointer group-hover:bg-neutral-50 dark:group-hover:bg-[#0c0c0c] transition-colors">
                    <h3 className="font-semibold text-foreground text-[15px] group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{t.name}</h3>
                    <p className="mt-1 text-[13px] text-neutral-500 dark:text-neutral-400 line-clamp-1">{t.description || "A clean startup template."}</p>
                  </div>
                </Card>
              </MotionItem>
            );
          })}
        </MotionStagger>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map(i => <div key={i} className="aspect-[4/3] bg-neutral-100 dark:bg-neutral-900 rounded-[20px] animate-pulse" />)}
        </div>
      )}
    </div>
  );
}

export function LandingProjectManagement() {
  return (
    <div className="mx-auto max-w-[1240px] px-5 py-24 sm:py-32 lg:px-8 border-t border-neutral-200/50 dark:border-white/5">
      <div className="grid gap-16 lg:grid-cols-2 lg:items-center w-full">
        <MotionReveal>
          <div className="flex flex-col justify-center">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">All your projects in one place</h2>
            <p className="mt-5 text-[16px] leading-relaxed text-neutral-500 dark:text-[#A1A1AA] max-w-md">
              A unified dashboard to seamlessly manage client work, personal web experiments, and full-scale SaaS platforms.
              Organize, update, and deploy instantly.
            </p>
            <ul className="mt-8 space-y-4">
              {["Visual dashboard interface", "Real-time updates", "One-click deployment"].map((feature, i) => (
                <li key={i} className="flex items-center text-neutral-600 dark:text-neutral-400 text-sm">
                  <div className="mr-3 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-white">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </MotionReveal>

        <MotionReveal delay={0.1}>
          <div className="relative aspect-square sm:aspect-[4/3] w-full overflow-hidden rounded-[20px] bg-neutral-100 dark:bg-[#111] border border-neutral-200/50 dark:border-white/5 p-6 shadow-sm">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.02)_0%,transparent_100%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02)_0%,transparent_100%)]" />
            <div className="relative h-full w-full rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] shadow-xl overflow-hidden flex flex-col">
              <div className="h-12 border-b border-neutral-100 dark:border-white/5 flex items-center px-4 justify-between bg-neutral-50 dark:bg-white/[0.02]">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="h-5 w-32 rounded bg-neutral-200/50 dark:bg-white/10 flex items-center px-2">
                  <div className="h-2 w-16 bg-neutral-400/30 dark:bg-white/20 rounded-sm" />
                </div>
              </div>

              <div className="flex-1 p-5 grid grid-cols-2 gap-4">
                {[
                  { bg: "bg-blue-500/10", accent: "bg-blue-500/50" },
                  { bg: "bg-purple-500/10", accent: "bg-purple-500/50" },
                  { bg: "bg-emerald-500/10", accent: "bg-emerald-500/50" },
                  { bg: "bg-amber-500/10", accent: "bg-amber-500/50" }
                ].map((color, idx) => (
                  <div key={idx} className="flex flex-col gap-3 group/mockup">
                    <div className={`w-full aspect-video rounded-lg ${color.bg} border border-neutral-100 dark:border-white/5 flex items-center justify-center shadow-inner`}>
                      <div className={`w-12 h-12 rounded-full ${color.accent} opacity-50 blur-xl group-hover/mockup:opacity-80 transition-opacity`} />
                    </div>
                    <div className="h-3 w-2/3 rounded bg-neutral-200 dark:bg-white/10" />
                    <div className="h-2 w-1/3 rounded bg-neutral-100 dark:bg-white/5" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </MotionReveal>
      </div>
    </div>
  );
}

export function LandingPricingCta() {
  return (
    <MotionReveal>
      <div className="mx-auto flex max-w-[1050px] flex-col items-center overflow-hidden rounded-[32px] bg-primary-900/5 dark:bg-[#060b17] border border-primary-900/10 dark:border-primary-900/30 px-6 py-24 text-center sm:px-12 relative shadow-lg">
        <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-primary-400/20 dark:bg-primary-600/30 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none mix-blend-multiply dark:mix-blend-lighten" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] bg-purple-400/20 dark:bg-purple-600/20 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/2 pointer-events-none mix-blend-multiply dark:mix-blend-lighten" />

        <h2 className="max-w-[700px] text-4xl font-bold leading-[1.05] tracking-[-0.03em] sm:text-5xl lg:text-6xl relative z-10 text-foreground">
          Ready to build without limits?
        </h2>
        <p className="mt-6 max-w-[500px] text-[17px] leading-relaxed text-neutral-600 dark:text-neutral-400 relative z-10">
          Join the standard for next generation visual development.
        </p>
        <Button asChild size="lg" className="group mt-10 h-12 rounded-full overflow-hidden bg-primary-600 text-white hover:bg-primary-700 hover:scale-105 transition-all shadow-[0_0_30px_rgba(59,130,246,0.4)] px-10 text-[15px] font-bold relative z-10 active:scale-95">
          <Link href="/register">
            <span className="relative z-10 flex items-center">Get started now <ArrowUpRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] -translate-x-[150%] transition-transform duration-700 ease-out group-hover:translate-x-[150%]" />
          </Link>
        </Button>
      </div>
    </MotionReveal>
  );
}

export function LandingShowcaseWrap({ children }: { children: ReactNode }) {
  return (
    <div id="showcase">
      <MotionReveal delay={0.4}>
        <MotionFloat>{children}</MotionFloat>
      </MotionReveal>
    </div>
  );
}

export { motion };
