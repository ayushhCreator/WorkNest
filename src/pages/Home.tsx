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
      title: "Team Management",
      description:
        "Invite members, assign roles, and collaborate with secure role-based permissions.",
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Advanced Analytics",
      description:
        "Visualize project progress and team performance with detailed insights and reports.",
    },
    {
      icon: <FileUp className="h-8 w-8" />,
      title: "File Attachments",
      description:
        "Upload and manage files seamlessly with secure Cloudinary cloud storage integration.",
    },
    {
      icon: <Bell className="h-8 w-8" />,
      title: "Smart Notifications",
      description:
        "Stay on top of deadlines and updates with real-time notifications and reminders.",
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Role-Based Access",
      description:
        "Control permissions with Owner, Admin, Member, and Viewer roles for secure collaboration.",
    },
  ];

  const techStack = [
    "React",
    "Node.js",
    "Express",
    "MongoDB",
    "Tailwind CSS",
    "Socket.io",
    "Cloudinary",
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

  // Productivity stats for animation
  const stats = [
    { label: "Projects Managed", value: 1200 },
    { label: "Tasks Completed", value: 8500 },
    { label: "Teams Collaborating", value: 300 },
  ];

  // Role-based access demo
  const roles = [
    { role: "Owner", color: "bg-blue-600", desc: "Full control, manage members, delete project" },
    { role: "Admin", color: "bg-green-500", desc: "Manage project, tasks, members" },
    { role: "Member", color: "bg-yellow-500", desc: "Create/edit tasks, comments, attachments" },
    { role: "Viewer", color: "bg-gray-400", desc: "Read-only access" },
  ];

  // Testimonials
  const testimonials = [
    {
      name: "Priya S.",
      company: "TechFlow",
      text: "WorkNest transformed our team's productivity. The real-time Kanban board and analytics are game changers!"
    },
    {
      name: "Rahul M.",
      company: "StartupHub",
      text: "Inviting my team and managing tasks has never been easier. Highly recommend for remote teams!"
    },
    {
      name: "Aisha K.",
      company: "DesignNest",
      text: "The role-based access and notifications keep everyone in sync. Love the UI and features!"
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
                to="/signup"
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
                  to="/signup"
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
