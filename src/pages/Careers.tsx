import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Rocket, Brain, Gamepad2, Globe, Trophy, ExternalLink, Check } from "lucide-react";
import { Logo } from "@/components/Logo";

const Careers = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const whyWorkWithUs = [
    {
      icon: Rocket,
      title: "Early-Stage Impact",
      description: "Your work won't get buried in layers of approval. What you build ships fast and reaches real users."
    },
    {
      icon: Brain,
      title: "AI at the Core",
      description: "From AI game generation to social discovery feeds, you'll work on cutting-edge AI use cases — not buzzwords."
    },
    {
      icon: Gamepad2,
      title: "Where Gaming Meets Social",
      description: "We're rethinking gaming like short-form content: swipe, play, remix, share."
    },
    {
      icon: Globe,
      title: "Builder Culture",
      description: "We value curiosity, ownership, and people who learn faster than they wait."
    },
    {
      icon: Trophy,
      title: "Proven Momentum",
      description: "Top hackathon wins, working MVP, and a vision backed by execution — not just slides."
    }
  ];

  const roles = [
    "AI / ML Engineers",
    "Game Developers (Unity, Web-based, experimental engines)",
    "Full Stack / Mobile Developers",
    "Product Designers (Gaming + Social UX)",
    "Growth, Community & Creator Managers",
    "Interns & Student Builders (high ownership)"
  ];

  const benefits = [
    "Real ownership from Day 1",
    "Chance to shape a category-defining product",
    "Flexible work culture (results > hours)",
    "Exposure to founders, hackathons, investors & early users",
    "A front-row seat to the future of AI-native entertainment"
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Logo variant="horizontal" size="sm" forceWhite />
          </div>
          <Button
            onClick={() => navigate('/auth?mode=signup')}
            className="bg-white text-black hover:bg-white/90"
          >
            Sign Up
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Careers at{" "}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Oplus
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-white/80 mb-8">
            Build the Future of AI-Powered Social Gaming
          </p>
          <p className="text-lg text-white/60 max-w-3xl mx-auto leading-relaxed">
            At Oplus, we're not just building games — we're building a new way to create, play, and connect. 
            We're combining AI, gaming, and social interaction to turn anyone into a game creator and every game into a shared experience.
          </p>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-12 px-6 bg-white/5">
        <div className="container mx-auto max-w-3xl text-center">
          <p className="text-xl text-white/80 italic">
            "If you're excited by fast experimentation, bold ideas, and shaping something from zero to one — you'll feel at home here."
          </p>
        </div>
      </section>

      {/* Why Work With Us */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Work With Us?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyWorkWithUs.map((item, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-all duration-300"
              >
                <item.icon className="w-10 h-10 text-purple-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-white/60">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who We're Looking For */}
      <section className="py-20 px-6 bg-gradient-to-b from-purple-900/20 to-transparent">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
            Who We're Looking For
          </h2>
          <p className="text-center text-white/60 mb-8">
            We don't hire by titles — we hire by mindset.
          </p>
          <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
            <p className="text-lg text-white/80 mb-6">You'll fit in if you are:</p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Check className="w-4 h-4 text-purple-400 mt-1 flex-shrink-0" />
                <span className="text-white/80">A problem solver who loves breaking and rebuilding things</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-4 h-4 text-purple-400 mt-1 flex-shrink-0" />
                <span className="text-white/80">Curious about AI, gaming, social platforms, or creator ecosystems</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-4 h-4 text-purple-400 mt-1 flex-shrink-0" />
                <span className="text-white/80">Comfortable with ambiguity and fast iteration</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-4 h-4 text-purple-400 mt-1 flex-shrink-0" />
                <span className="text-white/80">Excited to build products users actually want to spend time on</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Open Roles */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Roles We're Actively Exploring
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {roles.map((role, index) => (
              <div
                key={index}
                className="p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300"
              >
                <span className="text-white/90">{role}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-white/60 mt-8 italic">
            Don't see your role listed? If you believe you add value, we want to hear from you.
          </p>
        </div>
      </section>

      {/* What You'll Get */}
      <section className="py-20 px-6 bg-white/5">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            What You'll Get
          </h2>
          <div className="space-y-4">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 rounded-xl bg-black/30 border border-white/10"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <span className="text-white/90">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Internship Program */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-3xl p-8 md:p-12 border border-purple-500/20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Internship Program
            </h2>
            <p className="text-xl text-white/70 mb-6">
              4-week experience-focused internship for students and early-career builders
            </p>
            <p className="text-white/60 mb-8">
              Work closely with the founding team • Certificate of Appreciation • Potential team consideration
            </p>
            <button
              onClick={() => navigate('/careers/internships')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-black font-semibold text-lg hover:scale-105 transition-transform duration-300"
            >
              View Internship Details
              <ArrowLeft className="w-5 h-5 rotate-180" />
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Build With Us?
          </h2>
          <p className="text-xl text-white/60 mb-10">
            We're always open to passionate builders, creators, and thinkers.
          </p>
          <a
            href="https://oplusai.vercel.app/careers/internships"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-lg hover:scale-105 transition-transform duration-300 shadow-lg shadow-purple-500/25"
          >
            Explore Opportunities
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/10">
        <div className="container mx-auto text-center text-white/40 text-sm">
          © 2025 Oplus. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Careers;
