import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Plus,
  FolderKanban,
  Users,
  BarChart3,
  FileUp,
  Bell,
  Shield,
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
} from "lucide-react";
import Logo from "../images/worknest_logo.svg";

const Home: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const features = [
    {
      icon: <FolderKanban className="h-8 w-8" />,
      title: "Real-time Kanban Board",
      description:
        "Instantly sync tasks and updates across your team with live collaboration powered by Socket.io.",
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Workspaces & Teams",
      description:
        "Organize your organization with workspaces, teams, and role-based access control.",
    },
    {
      icon: <Calendar className="h-8 w-8" />,
      title: "Sprint Cycles",
      description:
        "Plan and track sprints with burndown charts, velocity tracking, and automated rollover.",
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: "Milestones & Roadmaps",
      description:
        "Set milestones, track progress, and visualize your project timeline with roadmap views.",
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Advanced Analytics",
      description:
        "Velocity charts, burndown reports, lead time analysis, and team performance metrics.",
    },
    {
      icon: <GitBranch className="h-8 w-8" />,
      title: "GitHub Integration",
      description:
        "Link repositories, sync issues, and automate task updates from commits and PRs.",
    },
    {
      icon: <Slack className="h-8 w-8" />,
      title: "Slack Integration",
      description:
        "Get real-time notifications and updates directly in your Slack channels.",
    },
    {
      icon: <Webhook className="h-8 w-8" />,
      title: "Webhooks & API",
      description:
        "Build custom integrations with webhooks and a powerful REST API with rate limiting.",
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Custom Workflows",
      description:
        "Design custom task workflows with configurable statuses and transitions.",
    },
  ];

  const techStack = [
    "React",
    "TypeScript",
    "Node.js",
    "Express",
    "MongoDB",
    "Redis",
    "Socket.io",
    "Docker",
  ];

  const steps = [
    {
      number: "1",
      title: "Sign Up",
      description: "Create your account and set up your workspace in minutes.",
    },
    {
      number: "2",
      title: "Create Projects",
      description:
        "Organize work with customizable Kanban boards and templates.",
    },
    {
      number: "3",
      title: "Invite Team",
      description: "Collaborate with role-based permissions and secure access.",
    },
    {
      number: "4",
      title: "Manage Tasks",
      description:
        "Assign, track, and complete tasks in real-time collaboration.",
    },
  ];



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center space-x-2">
                <Link
                  to="/"
                  className="flex items-center gap-2 text-2xl font-bold text-blue-600"
                >
                  <img src={Logo} alt="WorkNest Logo" className="w-40 h-10" />
                </Link>
                {/* <FolderKanban className="h-8 w-8 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900">WorkNest</span>
               */}
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                How It Works
              </a>
              <a
                href="#tech-stack"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Tech Stack
              </a>
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-600 hover:text-gray-900"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
                <a
                  href="#features"
                  className="block px-3 py-2 text-gray-600 hover:text-gray-900"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="block px-3 py-2 text-gray-600 hover:text-gray-900"
                >
                  How It Works
                </a>
                <a
                  href="#tech-stack"
                  className="block px-3 py-2 text-gray-600 hover:text-gray-900"
                >
                  Tech Stack
                </a>
                <Link
                  to="/login"
                  className="block px-3 py-2 text-gray-600 hover:text-gray-900"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
                >
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section with Animation */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            className="text-center space-y-8"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900">
                Real-time Kanban
                <span className="text-blue-600">
                  {" "}
                  Project Management System
                </span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
                Streamline your team's workflow with real-time collaboration,
                advanced analytics, and enterprise-grade features.
              </p>
            </motion.div>

            <motion.div
              className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.5 }}
            >
              <Link
                to="/register"
                className="bg-blue-600 text-white px-8 py-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Get Started Free</span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Features Section with Animation */}
      <div id="features" className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">
              Why Choose WorkNest?
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Everything you need to manage projects and collaborate with your
              team.
            </p>
          </div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.15
                }
              },
              hidden: {}
            }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 hover:shadow-lg transition-shadow"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: index * 0.15 }}
                whileHover={{ scale: 1.05 }}
              >
                <motion.div
                  className="text-blue-600 mb-4"
                  whileHover={{ rotate: 10, scale: 1.2 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* How It Works Section with Animation */}
      <div id="how-it-works" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-4 text-xl text-gray-600">
              Get started with WorkNest in four simple steps.
            </p>
          </div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.18
                }
              },
              hidden: {}
            }}
          >
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: index * 0.18 }}
                whileHover={{ scale: 1.07 }}
              >
                <motion.div
                  className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4"
                  whileHover={{ scale: 1.2 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {step.number}
                </motion.div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      

      {/* Tech Stack Section */}
      <div id="tech-stack" className="bg-gray-50  py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Built with Modern Technology
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Powered by industry-leading technologies for performance and
            reliability.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            {techStack.map((tech, index) => (
              <span
                key={index}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <FolderKanban className="h-8 w-8 text-blue-600" />
                <span className="text-2xl font-bold text-white">WorkNest</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                The modern project management solution for teams who want to
                work smarter, not harder.
              </p>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Github className="h-6 w-6" />
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Twitter className="h-6 w-6" />
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Linkedin className="h-6 w-6" />
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Demo
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    API
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Careers
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 WorkNest. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 sm:mt-0">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
