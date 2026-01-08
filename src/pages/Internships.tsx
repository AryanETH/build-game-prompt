import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, MapPin, Award, ChevronDown, ExternalLink, Sparkles } from "lucide-react";
import { Logo } from "@/components/Logo";

const Internships = () => {
  const navigate = useNavigate();
  const [expandedCategory, setExpandedCategory] = useState<number | null>(0);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const internshipCategories = [
    {
      emoji: "🎨",
      title: "Content & Creator",
      subtitle: "Shape the voice of Oplus",
      gradient: "from-rose-500 via-pink-500 to-purple-500",
      bgGlow: "bg-pink-500/20",
      overview: "Create engaging, Gen-Z-friendly content that explains and builds excitement around AI-powered social gaming.",
      tasks: [
        "Create short-form content (Reels / Shorts / Posts)",
        "Record demo or walkthrough videos",
        "Create memes, visuals, or storytelling content",
        "Assist in launch or campaign content",
        "Suggest creative content ideas weekly"
      ],
      skills: ["Startup content strategy", "Creator-style storytelling", "Product-first marketing", "Personal brand building"],
      deliverables: ["8–12 short-form content pieces", "2 demo or explainer videos", "1 content idea document"],
      tools: ["Instagram / YouTube Shorts", "CapCut / Canva", "Notion"],
      success: "Clear, engaging storytelling with consistent output that explains Oplus simply and creatively."
    },
    {
      emoji: "🔍",
      title: "Research & Community",
      subtitle: "Understand users, build community",
      gradient: "from-blue-500 via-cyan-500 to-teal-500",
      bgGlow: "bg-cyan-500/20",
      overview: "Help us understand users better and build an early community through research, outreach, and feedback collection.",
      tasks: [
        "Research Gen-Z gaming & creator behavior",
        "Conduct user interviews or surveys",
        "Build and manage Discord / WhatsApp communities",
        "Collect and organize feedback",
        "Share weekly insight summaries"
      ],
      skills: ["Startup research methods", "Community building", "User psychology", "Early-stage product thinking"],
      deliverables: ["1 competitor/market research report", "10–15 user conversations", "1 community growth plan", "Weekly insights"],
      tools: ["Google Forms", "Discord / WhatsApp", "Notion", "Sheets"],
      success: "Clear insights (not assumptions), honest user feedback, and a growing engaged community."
    },
    {
      emoji: "🎮",
      title: "Game Testing & Design",
      subtitle: "Make games more fun",
      gradient: "from-violet-500 via-purple-500 to-indigo-500",
      bgGlow: "bg-violet-500/20",
      overview: "Improve the quality, fun, and engagement of AI-generated games by testing gameplay and suggesting improvements.",
      tasks: [
        "Playtest AI-generated games",
        "Identify bugs, glitches, or UX issues",
        "Suggest gameplay improvements",
        "Write better prompts for game generation",
        "Rate games based on fun and engagement"
      ],
      skills: ["Game testing fundamentals", "AI game workflows", "Game design thinking", "Product feedback articulation"],
      deliverables: ["15–20 game test reports", "Bug & improvement list", "Fun-factor rating sheet", "Prompt suggestions"],
      tools: ["Oplus prototype", "Notion", "Screen recording"],
      success: "Clear, structured feedback with a strong sense of what's fun vs boring."
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px] animate-pulse delay-1000" />
      </div>

      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5"
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/careers')}
              className="text-white/70 hover:text-white hover:bg-white/10 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Logo variant="horizontal" size="sm" forceWhite />
          </div>
          <Button
            onClick={() => navigate('/auth?mode=signup')}
            className="bg-white text-black hover:bg-white/90 rounded-full px-6"
          >
            Join Oplus
          </Button>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="container mx-auto max-w-4xl text-center"
        >
          {/* Badge */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 mb-8"
          >
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
              4-Week Remote Program
            </span>
          </motion.div>
          
          {/* Title */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl md:text-7xl font-bold mb-6 tracking-tight"
          >
            <span className="text-white">Intern at </span>
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              Oplus
            </span>
          </motion.h1>
          
          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-white/50 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Real startup experience. Real impact. 
            <br className="hidden md:block" />
            Work directly with founders on what matters.
          </motion.p>

          {/* Quick Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-3"
          >
            {[
              { icon: Clock, text: "4 Weeks" },
              { icon: MapPin, text: "Remote" },
              { icon: Award, text: "Certificate" }
            ].map((item, i) => (
              <div 
                key={i}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10"
              >
                <item.icon className="w-4 h-4 text-white/40" />
                <span className="text-sm text-white/70">{item.text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Categories Section */}
      <section className="py-16 px-6 relative">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="space-y-4"
          >
            {internshipCategories.map((category, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                className="relative"
              >
                {/* Glow Effect */}
                <AnimatePresence>
                  {hoveredCard === index && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`absolute inset-0 ${category.bgGlow} rounded-3xl blur-xl -z-10`}
                    />
                  )}
                </AnimatePresence>

                <div 
                  className={`relative bg-white/[0.03] border border-white/10 rounded-3xl overflow-hidden transition-all duration-500 ${
                    hoveredCard === index ? 'border-white/20 bg-white/[0.05]' : ''
                  }`}
                >
                  {/* Header - Always Visible */}
                  <button
                    onClick={() => setExpandedCategory(expandedCategory === index ? null : index)}
                    className="w-full p-6 md:p-8 flex items-center justify-between text-left group"
                  >
                    <div className="flex items-center gap-4 md:gap-6">
                      {/* Emoji Icon */}
                      <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br ${category.gradient} p-[1px]`}>
                        <div className="w-full h-full rounded-2xl bg-[#0a0a0a] flex items-center justify-center text-3xl md:text-4xl">
                          {category.emoji}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-xl md:text-2xl font-bold text-white mb-1">
                          {category.title}
                        </h3>
                        <p className="text-white/40 text-sm md:text-base">
                          {category.subtitle}
                        </p>
                      </div>
                    </div>

                    <motion.div
                      animate={{ rotate: expandedCategory === index ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors"
                    >
                      <ChevronDown className="w-5 h-5 text-white/50" />
                    </motion.div>
                  </button>

                  {/* Expandable Content */}
                  <AnimatePresence>
                    {expandedCategory === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 md:px-8 pb-8 pt-2">
                          {/* Overview */}
                          <p className="text-white/60 text-lg mb-8 leading-relaxed">
                            {category.overview}
                          </p>

                          {/* Grid Content */}
                          <div className="grid md:grid-cols-2 gap-6">
                            {/* What You'll Do */}
                            <div className="space-y-3">
                              <h4 className="text-sm font-semibold text-white/30 uppercase tracking-wider">
                                What you'll do
                              </h4>
                              <ul className="space-y-2">
                                {category.tasks.map((task, i) => (
                                  <motion.li 
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="flex items-start gap-3 text-white/70"
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${category.gradient} mt-2 flex-shrink-0`} />
                                    <span className="text-sm">{task}</span>
                                  </motion.li>
                                ))}
                              </ul>
                            </div>

                            {/* Skills */}
                            <div className="space-y-3">
                              <h4 className="text-sm font-semibold text-white/30 uppercase tracking-wider">
                                Skills you'll gain
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {category.skills.map((skill, i) => (
                                  <motion.span
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs"
                                  >
                                    {skill}
                                  </motion.span>
                                ))}
                              </div>
                            </div>

                            {/* Deliverables */}
                            <div className="space-y-3">
                              <h4 className="text-sm font-semibold text-white/30 uppercase tracking-wider">
                                Deliverables
                              </h4>
                              <ul className="space-y-2">
                                {category.deliverables.map((item, i) => (
                                  <li key={i} className="flex items-center gap-2 text-white/70 text-sm">
                                    <span className="text-green-400">✓</span>
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Tools */}
                            <div className="space-y-3">
                              <h4 className="text-sm font-semibold text-white/30 uppercase tracking-wider">
                                Tools
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {category.tools.map((tool, i) => (
                                  <span
                                    key={i}
                                    className="px-3 py-1.5 rounded-lg bg-white/[0.03] text-white/50 text-xs"
                                  >
                                    {tool}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Success Note */}
                          <div className={`mt-8 p-4 rounded-2xl bg-gradient-to-r ${category.gradient} bg-opacity-10 border border-white/5`}>
                            <p className="text-white/70 text-sm">
                              <span className="text-white font-medium">Success looks like: </span>
                              {category.success}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What you'll walk away with</h2>
            <p className="text-white/50">More than just a line on your resume</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-4"
          >
            {[
              { emoji: "🎓", title: "Certificate", desc: "Official Certificate of Appreciation" },
              { emoji: "🚀", title: "Real Experience", desc: "Work on a live product with real users" },
              { emoji: "💼", title: "Team Consideration", desc: "Top performers may join the team" }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 text-center hover:border-white/20 transition-colors"
              >
                <div className="text-4xl mb-4">{item.emoji}</div>
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-white/50 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="container mx-auto max-w-3xl"
        >
          <div className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 border border-white/10 text-center overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-purple-500/20 rounded-full blur-[100px]" />
            
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to start?
              </h2>
              <p className="text-white/50 mb-8 max-w-md mx-auto">
                Apply now and become part of something exciting. No experience required—just curiosity and drive.
              </p>
              
              <motion.a
                href="https://forms.gle/fBV9FjTWnFeM1kc96"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-black font-semibold hover:bg-white/90 transition-colors"
              >
                Apply Now
                <ExternalLink className="w-4 h-4" />
              </motion.a>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="container mx-auto text-center text-white/30 text-sm">
          © 2025 Oplus. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Internships;
