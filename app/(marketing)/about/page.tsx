import type { Metadata } from "next";
import { Target, Globe, Sparkles, DollarSign, FileText, BookOpen } from "lucide-react";

export const metadata: Metadata = { title: "About" };

const offerings = [
  { icon: Globe, title: "Curated Remote Jobs", desc: "Thousands of verified remote job listings from top companies worldwide." },
  { icon: Sparkles, title: "AI Job Matching", desc: "AI-powered matching based on your skills and preferences." },
  { icon: FileText, title: "Smart CV Analysis", desc: "Instant AI feedback to improve your resume and increase your chances." },
  { icon: DollarSign, title: "Salary Estimation", desc: "Data-driven salary ranges for informed negotiations." },
  { icon: BookOpen, title: "Career Resources", desc: "Remote work guides and career development resources." },
];

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero text-white py-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/5 animate-float" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">About Buzz2Remote</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Connecting talented professionals with remote opportunities from top companies worldwide.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 max-w-4xl mx-auto px-4">
        <div className="glass-card p-8 md:p-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="gradient-primary rounded-xl p-2.5 text-white shadow-lg">
              <Target className="size-5" />
            </div>
            <h2 className="text-2xl font-bold">Our Mission</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed text-lg">
            We believe that great talent exists everywhere, and geography should never be a barrier to finding
            meaningful work. Our mission is to make remote work accessible to everyone by providing the best
            tools for job discovery, application, and career development.
          </p>
        </div>
      </section>

      {/* What We Offer */}
      <section className="py-16 max-w-4xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-8 text-center">What We <span className="gradient-text">Offer</span></h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {offerings.map((item) => (
            <div key={item.title} className="glass-card p-6 hover-lift group">
              <div className="gradient-primary rounded-xl p-2.5 text-white shadow-lg w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                <item.icon className="size-5" />
              </div>
              <h3 className="font-semibold mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
