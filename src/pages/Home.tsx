import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Plus,
  FolderKanban,
  Users,
  BarChart3,
  Menu,
  X,
  Github,
  Twitter,
  Linkedin,
  Zap,
  GitBranch,
  Calendar,
  Target,
  Slack,
  Webhook,
  ArrowRight,
  CheckCircle2,
  Layout,
  Shield
} from "lucide-react";
import Logo from "../images/worknest_logo.svg";
import DashboardMockup from "../images/dashboard-mockup.png";

const Home: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
  };

  const features = [
    {
      icon: <FolderKanban className="h-6 w-6 text-indigo-600" />,
      title: "Real-time Kanban",
      description: "Sync tasks instantly across your team with live socket collaboration.",
    },
    {
      icon: <Users className="h-6 w-6 text-pink-600" />,
      title: "Team Workspaces",
      description: "Organize your organization with workspaces and role-based access.",
    },
    {
      icon: <Calendar className="h-6 w-6 text-purple-600" />,
      title: "Sprint Cycles",
      description: "Track sprints with burndown charts, velocity, and automated rollover.",
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-blue-600" />,
      title: "Advanced Analytics",
      description: "Gain insights with velocity charts, lead time analysis, and performance metrics.",
    },
    {
      icon: <GitBranch className="h-6 w-6 text-gray-800" />,
      title: "GitHub Integration",
      description: "Link repositories and automate task updates from commits and PRs.",
    },
    {
      icon: <Zap className="h-6 w-6 text-amber-500" />,
      title: "Custom Workflows",
      description: "Design custom task workflows with configurable statuses and transitions.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Background Gradients */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-200/20 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-indigo-200/20 rounded-full blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="fixed w-full z-50 transition-all duration-300 bg-white/70 backdrop-blur-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <img src={Logo} alt="WorkNest" className="h-8 group-hover:scale-105 transition-transform" />
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700">WorkNest</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">How It Works</a>
              <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">Log in</Link>
              <Link
                to="/register"
                className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-all hover:shadow-lg active:scale-95"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-600 p-2">
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-100 absolute w-full"
          >
            <div className="px-6 py-8 space-y-4">
              <a href="#features" className="block text-lg font-medium text-gray-900">Features</a>
              <a href="#how-it-works" className="block text-lg font-medium text-gray-900">How It Works</a>
              <hr className="border-gray-100"/>
              <Link to="/login" className="block text-lg font-medium text-gray-900">Log in</Link>
              <Link to="/register" className="block w-full text-center py-3 bg-indigo-600 text-white font-medium rounded-xl">Get Started</Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium mb-4 animate-fade-in-up">
              <span className="flex h-2 w-2 rounded-full bg-indigo-600 mr-2 animate-pulse"></span>
              WorkNest 2.0 is now live
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-gray-900 leading-tight">
              Project management, <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">reimagined.</span>
            </h1>
            
            <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Streamline your team's workflow with real-time collaboration, beautiful Kanban boards, and powerful analytics.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-8">
              <Link
                to="/register"
                className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-semibold text-lg hover:bg-indigo-700 transition-all hover:shadow-xl hover:shadow-indigo-200 active:scale-95 flex items-center gap-2"
              >
                Start for free <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-2xl font-semibold text-lg hover:bg-gray-50 transition-all hover:border-gray-300 active:scale-95"
              >
                View Demo
              </Link>
            </div>

            {/* Hero Dashboard Preview */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 1 }}
              className="mt-20 relative rounded-3xl overflow-hidden shadow-2xl shadow-indigo-200/50 border border-gray-200/50 bg-white/50 backdrop-blur-sm"
            >
               <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
               <img 
                 src={DashboardMockup}
                 alt="WorkNest Dashboard" 
                 className="w-full h-auto opacity-90 hover:opacity-100 transition-opacity duration-700"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFC] via-transparent to-transparent h-1/3 bottom-0 top-auto" />
            </motion.div>

          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need to ship faster.</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">Powerful features wrapped in a beautiful interface.</p>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-6 group-hover:bg-indigo-50 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed font-medium">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                 <img src={Logo} alt="WorkNest" className="h-8" />
                 <span className="text-xl font-bold text-gray-900">WorkNest</span>
              </div>
              <p className="text-gray-500 max-w-sm">The modern standard for project management. Built for teams that move fast.</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-gray-500">
                <li><a href="#" className="hover:text-indigo-600">Features</a></li>
                <li><a href="#" className="hover:text-indigo-600">Security</a></li>
                <li><a href="#" className="hover:text-indigo-600">Enterprise</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-gray-500">
                <li><a href="#" className="hover:text-indigo-600">About</a></li>
                <li><a href="#" className="hover:text-indigo-600">Blog</a></li>
                <li><a href="#" className="hover:text-indigo-600">Careers</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">© 2025 WorkNest Inc. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="text-gray-400 hover:text-gray-600"><Github className="w-5 h-5" /></a>
              <a href="#" className="text-gray-400 hover:text-gray-600"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="text-gray-400 hover:text-gray-600"><Linkedin className="w-5 h-5" /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
