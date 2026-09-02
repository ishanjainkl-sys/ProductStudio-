import { PublicNavbar } from "@/components/public/PublicNavbar";
import { PublicFooter } from "@/components/public/PublicFooter";
import {
  LandingHeroContent,
  LandingTrust,
  LandingFeatureCards,
  LandingHowItWorks,
  LandingTemplateShowcase,
  LandingProjectManagement,
  LandingPricingCta,
  LandingShowcaseWrap,
} from "@/components/landing/LandingMotionSections";

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-white dark:bg-[#09090b] font-sans text-foreground overflow-hidden selection:bg-primary-500/20 selection:text-primary-900 dark:selection:bg-primary-500/30 dark:selection:text-primary-100">

      {/* Vibrant Colorful Background Mesh */}
      <div className="pointer-events-none absolute inset-0 flex justify-center z-0">
        <div className="absolute -top-[10%] -left-[10%] h-[800px] w-[800px] rounded-full bg-primary-400/20 dark:bg-primary-600/20 blur-[120px] mix-blend-multiply dark:mix-blend-lighten" />
        <div className="absolute top-[20%] right-[5%] h-[600px] w-[600px] rounded-full bg-purple-400/20 dark:bg-purple-600/30 blur-[130px] mix-blend-multiply dark:mix-blend-lighten" />
        <div className="absolute bottom-[-10%] left-[20%] h-[700px] w-[700px] rounded-full bg-teal-400/20 dark:bg-teal-500/20 blur-[140px] mix-blend-multiply dark:mix-blend-lighten" />

        {/* Subtle grid over the glow */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080801a_1px,transparent_1px),linear-gradient(to_bottom,#8080801a_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_40%,#000_70%,transparent_100%)]" />
      </div>

      <div className="relative z-10 w-full">
        <PublicNavbar />
      </div>

      <main className="relative z-10 flex flex-1 flex-col overflow-hidden pb-12 pt-20 sm:pb-32 sm:pt-40">
        <LandingHeroContent />
        <div className="mx-auto mt-6">
          <LandingTrust />
        </div>

        <LandingShowcaseWrap>
          <div className="mx-auto mt-24 max-w-[1080px] px-5 sm:px-8">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[20px] sm:rounded-[36px] border border-white/20 dark:border-neutral-800/80 bg-white/40 dark:bg-[#111111]/40 backdrop-blur-xl shadow-[0_32px_80px_rgba(0,0,0,0.08)] dark:shadow-[0_32px_80px_rgba(0,0,0,0.5)] ring-1 ring-black/5 dark:ring-white/5">
              <div className="flex h-14 w-full items-center justify-between border-b border-white/40 dark:border-neutral-800/40 bg-white/60 dark:bg-[#1f1f1fc9] px-6">
                <div className="flex gap-2.5">
                  <div className="h-3 w-3 rounded-full bg-[#f26359] dark:bg-[#ff5f56] shadow-sm"></div>
                  <div className="h-3 w-3 rounded-full bg-[#f8be3a] dark:bg-[#ffbd2e] shadow-sm"></div>
                  <div className="h-3 w-3 rounded-full bg-[#3ecb4c] dark:bg-[#27c93f] shadow-sm"></div>
                </div>
                <div className="flex-1 px-8">
                  <div className="mx-auto h-6 w-full max-w-sm rounded-[6px] bg-white/60 dark:bg-black/20" />
                </div>
                <div className="w-[60px]" /> {/* Spacer for balance */}
              </div>
              <div className="h-full w-full bg-[url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3')] bg-cover bg-center transition-transform duration-700 hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent dark:from-black/40" />
              </div>
            </div>
          </div>
        </LandingShowcaseWrap>

        <div className="mx-auto w-full max-w-[1240px] px-5 pt-32 lg:px-8">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Everything you need to build faster</h2>
          </div>
          <LandingFeatureCards />
        </div>

        <LandingHowItWorks />

        <LandingTemplateShowcase />

        <LandingProjectManagement />

        <div id="pricing" className="mx-auto w-full max-w-[1240px] px-5 py-32 lg:px-8">
          <LandingPricingCta />
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
