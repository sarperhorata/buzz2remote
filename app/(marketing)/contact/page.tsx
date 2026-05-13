import type { Metadata } from "next";
import { Mail, MessageSquare, Globe, Link2 } from "lucide-react";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero text-white py-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/5 animate-float" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Contact Us</h1>
          <p className="text-lg text-white/80">Have questions or feedback? We&apos;d love to hear from you.</p>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="grid gap-4">
          <div className="glass-card p-6 hover-lift">
            <div className="flex items-center gap-3 mb-3">
              <div className="gradient-primary rounded-xl p-2.5 text-white shadow-lg">
                <Mail className="size-5" />
              </div>
              <h2 className="font-semibold text-lg">Email</h2>
            </div>
            <p className="text-primary font-medium">support@buzz2remote.com</p>
            <p className="text-sm text-muted-foreground mt-1">We typically respond within 24 hours.</p>
          </div>

          <div className="glass-card p-6 hover-lift">
            <div className="flex items-center gap-3 mb-3">
              <div className="gradient-primary rounded-xl p-2.5 text-white shadow-lg">
                <MessageSquare className="size-5" />
              </div>
              <h2 className="font-semibold text-lg">Social Media</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Follow us for updates and remote work tips.</p>
            <div className="flex items-center gap-3">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Globe className="size-4" /> Twitter
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Link2 className="size-4" /> LinkedIn
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
