import { PublicNavbar } from "@/components/public/PublicNavbar";
import { PublicFooter } from "@/components/public/PublicFooter";
import {
  LandingHeroContent,
  LandingFeatureCards,
  LandingPricingCta,
  LandingShowcaseWrap,
} from "@/components/landing/LandingMotionSections";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col selection:bg-primary-500/10 selection:text-primary-900 dark:selection:bg-primary-500/20 dark:selection:text-primary-200">
      <PublicNavbar />
      <main className="landing-grid flex flex-1 flex-col overflow-hidden pb-12 pt-20 sm:pb-24 sm:pt-32">
        <LandingHeroContent />
        <LandingShowcaseWrap>
          <div className="mx-auto mt-20 max-w-[1080px] px-5 sm:px-8">
            <div className="aspect-[16/9] w-full overflow-hidden rounded-[20px] sm:rounded-[32px] border border-[#e4e0da] dark:border-neutral-800 bg-[#fbfaf9] dark:bg-[#111111] shadow-[0_32px_80px_rgba(30,25,20,0.12)] dark:shadow-[0_32px_80px_rgba(0,0,0,0.5)]">
              <div className="flex h-12 w-full items-center gap-2 border-b border-[#e4e0da] dark:border-neutral-800 bg-white dark:bg-[#1A1A1A] px-5">
                <div className="flex gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#f26359] dark:bg-[#ff5f56]"></div>
                  <div className="h-3 w-3 rounded-full bg-[#f8be3a] dark:bg-[#ffbd2e]"></div>
                  <div className="h-3 w-3 rounded-full bg-[#3ecb4c] dark:bg-[#27c93f]"></div>
                </div>
              </div>
              <div className="h-full w-full bg-[url('https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=2072&ixlib=rb-4.0.3')] bg-cover bg-center opacity-50 dark:opacity-30"></div>
            </div>
          </div>
        </LandingShowcaseWrap>
        <div className="mx-auto w-full max-w-[1240px] px-5 pt-32 lg:px-8">
          <LandingFeatureCards />
        </div>
        <div id="pricing" className="mx-auto w-full max-w-[1240px] px-5 pt-32 lg:px-8">
          <LandingPricingCta />
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
