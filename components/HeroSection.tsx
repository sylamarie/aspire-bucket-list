interface HeroSectionProps {
  onAddClick: () => void
}

export default function HeroSection({ onAddClick }: HeroSectionProps) {
  return (
    <section className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 flex flex-col items-center justify-center text-white px-4 relative overflow-hidden">
      {/* decorative blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-400/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="relative z-10 text-center max-w-xl">
        <p className="text-violet-300 text-sm font-medium tracking-widest uppercase mb-4">
          My Bucket List
        </p>
        <h1 className="text-8xl font-black tracking-tight mb-6 drop-shadow-sm">
          Aspire
        </h1>
        <p className="text-lg text-violet-200 mb-12 leading-relaxed">
          The 3 things I&apos;m living for
        </p>
        <button
          onClick={onAddClick}
          className="inline-flex items-center gap-2 bg-white text-violet-700 font-semibold px-8 py-4 rounded-full shadow-xl hover:bg-violet-50 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200"
        >
          ✨ Add to my list
        </button>
      </div>

      {/* scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-violet-300/60 text-xs">
        <span>scroll</span>
        <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
          <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  )
}
