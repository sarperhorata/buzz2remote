import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, DollarSign, FileText, Search, ArrowRight, Briefcase, Building2, Users, Zap, Shield, Globe } from "lucide-react";
import { BeeIcon } from "@/components/BeeIcon";

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero text-white min-h-[85vh] flex items-center">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Morphing blobs */}
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/[0.07] animate-morph" style={{ animationDuration: "8s" }} />
          <div className="absolute top-1/3 -left-32 w-72 h-72 bg-white/[0.05] animate-morph" style={{ animationDuration: "12s", animationDelay: "2s" }} />
          <div className="absolute -bottom-20 right-1/3 w-56 h-56 bg-white/[0.04] animate-morph" style={{ animationDuration: "10s", animationDelay: "4s" }} />

          {/* Orbiting particles */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-3 h-3 rounded-full bg-amber-300/30 animate-orbit" style={{ animationDuration: "20s" }} />
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-2 h-2 rounded-full bg-yellow-300/20 animate-orbit" style={{ animationDuration: "30s", animationDirection: "reverse" }} />
          </div>

          {/* Floating sparkle dots */}
          <div className="absolute top-[15%] left-[10%] w-1.5 h-1.5 rounded-full bg-white/40 animate-float" style={{ animationDuration: "4s" }} />
          <div className="absolute top-[25%] right-[15%] w-1 h-1 rounded-full bg-white/30 animate-float" style={{ animationDuration: "5s", animationDelay: "1s" }} />
          <div className="absolute bottom-[30%] left-[20%] w-2 h-2 rounded-full bg-white/20 animate-float" style={{ animationDuration: "7s", animationDelay: "2s" }} />
          <div className="absolute top-[60%] right-[25%] w-1.5 h-1.5 rounded-full bg-white/25 animate-float" style={{ animationDuration: "6s", animationDelay: "3s" }} />
          <div className="absolute top-[40%] left-[60%] w-1 h-1 rounded-full bg-white/30 animate-float" style={{ animationDuration: "4.5s", animationDelay: "0.5s" }} />

          {/* Gradient sweep */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        </div>

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36">
          <div className="text-center max-w-3xl mx-auto animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5 text-sm font-medium mb-8 border border-white/20 shimmer-line">
              <Sparkles className="size-4" />
              AI-Powered Job Matching
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight leading-tight">
              Find Your Perfect
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-300">
                Remote Job
              </span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
              Thousands of remote positions from top companies worldwide.
              AI-powered matching to find your ideal role.
            </p>

            {/* Search Bar in Hero */}
            <div className="max-w-xl mx-auto mb-8">
              <div className="flex items-center bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-1.5 shadow-2xl">
                <div className="flex items-center flex-1 px-3">
                  <Search className="size-5 text-white/60 shrink-0" />
                  <span className="ml-3 text-white/50 text-sm">Search jobs, companies, skills...</span>
                </div>
                <Button asChild className="gradient-primary border-0 text-stone-900 font-bold shadow-lg hover:shadow-xl transition-all rounded-lg animate-pulse-glow">
                  <Link href="/jobs">
                    Browse Jobs
                    <ArrowRight className="size-4 ml-1.5" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" asChild className="gradient-primary text-stone-900 hover:opacity-90 font-bold shadow-xl text-base h-12 px-8 border-0">
                <Link href="/jobs">
                  <Briefcase className="size-5 mr-2" />
                  Browse Jobs
                </Link>
              </Button>
              <Button size="lg" asChild className="bg-white/15 backdrop-blur-sm text-white hover:bg-white/25 font-semibold text-base h-12 px-8 border border-white/30">
                <Link href="/register">Create Account</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative -mt-12 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Briefcase, label: "Remote Jobs", value: "5,000+" },
              { icon: Building2, label: "Companies", value: "500+" },
              { icon: Users, label: "Job Seekers", value: "10,000+" },
            ].map((stat) => (
              <div key={stat.label} className="glass-card p-5 text-center hover-lift shimmer-line">
                <stat.icon className="size-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-28 bg-dot-pattern bg-animated-mesh">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Why <span className="gradient-text">Buzz2Remote</span>?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to land your dream remote job, powered by AI.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "AI-Powered Matching",
                desc: "Our AI analyzes your skills and experience to find the best matching remote jobs for you.",
                icon: Sparkles,
                gradient: "from-amber-500 to-yellow-400",
              },
              {
                title: "Salary Estimation",
                desc: "Get accurate salary ranges for any remote position based on market data and your experience.",
                icon: DollarSign,
                gradient: "from-amber-600 to-orange-500",
              },
              {
                title: "Smart CV Analysis",
                desc: "Upload your CV and get instant AI-powered feedback to improve your chances of landing a job.",
                icon: FileText,
                gradient: "from-yellow-500 to-amber-400",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="glass-card p-7 hover-lift group"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="size-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-mesh">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              How It <span className="gradient-text">Works</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Three simple steps to your next remote career.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-violet-500/30 via-pink-500/30 to-rose-500/30" />

            {[
              { step: "01", title: "Create Profile", desc: "Sign up and tell us about your skills, experience, and what you're looking for.", icon: Users },
              { step: "02", title: "Get Matched", desc: "Our AI scans thousands of jobs to find the ones that fit you perfectly.", icon: Zap },
              { step: "03", title: "Apply & Land", desc: "Apply with one click and track your applications all in one place.", icon: Shield },
            ].map((item, i) => (
              <div key={item.step} className="text-center relative">
                <div className="w-24 h-24 mx-auto mb-6 rounded-2xl gradient-primary flex items-center justify-center shadow-xl relative">
                  <item.icon className="size-10 text-white" />
                  <span className="absolute -top-2 -right-2 bg-white dark:bg-card text-primary text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-lg border-2 border-primary/20">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted by section */}
      <section className="py-16 border-y bg-muted/20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-sm font-medium text-muted-foreground mb-6 tracking-wider uppercase">Trusted by teams worldwide</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-14 opacity-40">
            {["Google", "Meta", "Stripe", "Shopify", "GitHub", "Vercel"].map((name) => (
              <span key={name} className="text-xl md:text-2xl font-bold tracking-tight">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-dot-pattern">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden gradient-hero rounded-3xl px-8 py-16 md:px-16 text-center text-white">
            {/* Animated decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/[0.06] animate-morph" style={{ animationDuration: "10s" }} />
              <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-white/[0.04] animate-morph" style={{ animationDuration: "14s", animationDelay: "3s" }} />
              <div className="absolute top-[20%] left-[10%] w-2 h-2 rounded-full bg-white/30 animate-float" style={{ animationDuration: "4s" }} />
              <div className="absolute bottom-[30%] right-[15%] w-1.5 h-1.5 rounded-full bg-white/20 animate-float" style={{ animationDuration: "5s", animationDelay: "2s" }} />
            </div>

            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
                Ready to find your remote dream job?
              </h2>
              <p className="text-white/80 mb-8 text-lg max-w-xl mx-auto">
                Join thousands of professionals who found their perfect remote position through Buzz2Remote.
              </p>
              <Button size="lg" asChild className="bg-white text-foreground hover:bg-white/90 font-semibold shadow-xl text-base h-12 px-8 animate-pulse-glow">
                <Link href="/register">
                  Get Started Free
                  <ArrowRight className="size-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
