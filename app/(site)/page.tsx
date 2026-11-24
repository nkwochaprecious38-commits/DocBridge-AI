import Link from "next/link";
import { DashboardPreview } from "@/components/DashboardPreview";
import { FEATURE_CARDS, PROBLEMS, STEPS } from "@/lib/content";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <>
      <section className="bg-mist">
        <div className="container-x section grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Document intelligence</p>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight sm:text-5xl">Turn Your Documents Into Business Intelligence.</h1>
            <p className="mt-5 max-w-xl text-lg text-navy/75">DocBridge transforms complex documents into structured, searchable, and actionable information. Upload, extract, organize, and understand your business documents from one intelligent workspace.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="btn-primary">Get Started</Link>
              <Link href="/platform" className="btn-secondary">Explore the Platform</Link>
            </div>
          </div>
          <DashboardPreview />
        </div>
      </section>

      <section className="section">
        <div className="container-x">
          <p className="eyebrow">The challenge</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold sm:text-4xl">Important information is trapped inside documents.</h2>
          <p className="mt-4 max-w-2xl text-navy/70">Teams spend hours reading, retyping and searching for details that should already be organized and available.</p>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PROBLEMS.map((p) => (<li key={p} className="card px-5 py-4 text-sm font-medium">{p}</li>))}
          </ul>
        </div>
      </section>

      <section className="bg-navy text-white">
        <div className="container-x section grid gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow !text-aqua">The platform</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">A connected document intelligence environment.</h2>
          </div>
          <p className="text-lg text-white/80">DocBridge turns disconnected documents into usable business knowledge. Every file is parsed, classified, summarized and indexed by page, so your team can find answers, verify them against the source, and automate the steps that follow.</p>
        </div>
      </section>

      <section className="section">
        <div className="container-x">
          <p className="eyebrow">Capabilities</p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Everything you need to understand your documents.</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURE_CARDS.map((f) => (
              <div key={f.title} className="card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand"><f.icon className="h-5 w-5" /></div>
                <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy/70">{f.text}</p>
              </div>
            ))}
          </div>
          <Link href="/features" className="mt-8 inline-flex items-center gap-2 font-heading text-sm font-semibold text-brand">See all features <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <section className="bg-mist">
        <div className="container-x section">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">From upload to automation in four steps.</h2>
          <ol className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.t} className="card p-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal font-heading text-sm font-bold text-white">{i + 1}</div>
                <h3 className="mt-4 font-bold">{s.t}</h3>
                <p className="mt-2 text-sm text-navy/70">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="container-x">
          <div className="rounded-2xl bg-navy px-6 py-14 text-center text-white sm:px-12">
            <h2 className="text-3xl font-bold sm:text-4xl">Create an account and explore DocBridge.</h2>
            <p className="mx-auto mt-4 max-w-xl text-white/80">Upload your first documents and see structured information, summaries and cited answers in your own workspace.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/signup" className="btn bg-brand text-white hover:bg-blue-600">Get Started</Link>
              <Link href="/pricing" className="btn border border-white/30 text-white hover:bg-white/10">View Pricing</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
