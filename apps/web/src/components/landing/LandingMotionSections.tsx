"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, Check } from "@/components/public/icons";
import { MotionFloat, MotionItem, MotionReveal, MotionStagger, motion } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function LandingHeroContent() {
  return (
    <div className="mx-auto max-w-[880px] text-center">
      <MotionReveal>
        <div className="inline-flex items-center gap-2 rounded-full border border-[#dedbd5] dark:border-neutral-800 bg-card/80 bg-white/75 px-3.5 py-2 text-[11px] font-semibold text-[#625d56] dark:text-neutral-300 shadow-sm backdrop-blur">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">✦</span>
          The new standard for visual building
        </div>
      </MotionReveal>

      <MotionReveal delay={0.08}>
        <h1 className="mt-7 text-[48px] font-semibold leading-[0.96] tracking-[-0.065em] text-foreground sm:text-[70px] lg:text-[88px]">
          Your vision, built
          <span className="block bg-[linear-gradient(90deg,#3b6ff0_10%,#2345af_55%,#0f1f4d)] dark:bg-[linear-gradient(90deg,#88aeff_10%,#5a8fff_55%,#b5c4ed)] bg-clip-text text-transparent">
            without limits.
          </span>
        </h1>
      </MotionReveal>

      <MotionReveal delay={0.16}>
        <p className="mx-auto mt-7 max-w-[600px] text-[16px] leading-7 text-[#6f6a63] dark:text-neutral-400 sm:text-[18px]">
          Design, build, and ship exceptional websites from one powerful canvas. No handoffs, no compromises—just ideas brought to life.
        </p>
      </MotionReveal>

      <MotionReveal delay={0.24}>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-auto w-full rounded-full px-7 py-4 text-[13px] font-bold shadow-[0_10px_25px_rgba(59,111,240,0.27)] dark:shadow-[0_10px_25px_rgba(59,111,240,0.15)] sm:w-auto">
            <Link href="/register" className="group">
              Start building for free <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-auto w-full rounded-full border-[#d8d4ce] bg-white/75 dark:border-neutral-800 dark:bg-[#1A1A1A]/80 dark:text-white px-7 py-4 text-[13px] font-bold text-[#3b3834] backdrop-blur hover:bg-white dark:hover:bg-[#252525] sm:w-auto">
            <a href="#showcase">
              See what&apos;s possible <span className="text-[#8c8780] dark:text-neutral-500">↓</span>
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
        <MotionItem key={number}>
          <Card className="group rounded-[22px] border-[#e7e3dd] bg-[#faf9f7] dark:border-neutral-800/80 dark:bg-[#111111] p-7 transition-all hover:-translate-y-1 hover:border-[#d4cec5] dark:hover:border-neutral-700 hover:shadow-[0_18px_45px_rgba(30,25,20,0.08)] dark:hover:shadow-[0_18px_45px_rgba(0,0,0,0.4)]">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-[#9a958d] dark:text-neutral-500">{number}</span>
              <span className="grid h-9 w-9 place-items-center rounded-full border border-[#e2ded7] dark:border-neutral-700/80 dark:bg-[#1A1A1A] bg-white text-primary-600 dark:text-primary-400 transition-transform group-hover:rotate-45">
                <ArrowUpRight />
              </span>
            </div>
            <h3 className="mt-16 text-xl font-semibold tracking-[-0.025em] text-foreground">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-[#777169] dark:text-neutral-400">{body}</p>
          </Card>
        </MotionItem>
      ))}
    </MotionStagger>
  );
}

export function LandingPricingCta() {
  return (
    <MotionReveal>
      <div className="mx-auto flex max-w-[1160px] flex-col items-center overflow-hidden rounded-[28px] bg-primary-900 dark:bg-primary-950/40 dark:border dark:border-primary-900/30 px-6 py-16 text-center text-white shadow-lg sm:px-12 sm:py-20">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary-300 dark:text-primary-400">Build what&apos;s next</p>
        <h2 className="mt-4 max-w-[720px] text-4xl font-semibold leading-[1.05] tracking-[-0.05em] sm:text-6xl">
          Your best work starts with a blank canvas.
        </h2>
        <p className="mt-6 max-w-[500px] text-sm leading-6 text-white/55 dark:text-neutral-300">
          Join the next generation of teams building faster, smarter, and without limits.
        </p>
        <Button asChild size="lg" className="mt-9 h-auto rounded-full bg-white dark:bg-primary-600 dark:hover:bg-primary-500 dark:text-white px-7 py-4 text-[13px] font-bold text-[#181716] hover:bg-white/95">
          <Link href="/register" className="group">
            Start building for free <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
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
