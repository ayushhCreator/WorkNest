import React from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, Search, Bell, Settings, MoreHorizontal, 
  CheckCircle2, Clock, Calendar, ChevronRight, 
  BarChart3, TrendingUp, Users, ArrowRight, Mail,
  Zap, Shield, Layout, Command
} from 'lucide-react';
import { Line } from 'react-chartjs-2';

const DesignDemo = () => {
  // Chart Data
  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Velocity',
        data: [65, 59, 80, 81, 56, 95, 100],
        fill: true,
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(124, 58, 237, 0.4)');
          gradient.addColorStop(1, 'rgba(124, 58, 237, 0.0)');
          return gradient;
        },
        borderColor: '#8b5cf6',
        pointBackgroundColor: '#fff',
        pointBorderColor: '#8b5cf6',
        pointBorderWidth: 2,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { display: false, grid: { display: false } },
      x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
    },
    maintainAspectRatio: false,
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 relative overflow-hidden font-sans">
      {/* Abstract Background Splashes */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-indigo-50/80 to-transparent pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-[600px] h-[600px] bg-purple-200/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-40 -left-20 w-[400px] h-[400px] bg-blue-200/30 rounded-full blur-[80px] pointer-events-none" />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-6 relative z-10"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="pt-16 pb-12 text-center md:text-left">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100/50 border border-indigo-200 text-indigo-700 text-xs font-bold tracking-wide uppercase mb-6 backdrop-blur-sm">
            <Zap className="w-3 h-3 mr-2 fill-current" />
            WorkNest Design System 2.0
          </div>
          <h1 className="text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
            Designed for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 animate-gradient-x">Impact</span>.
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl font-medium">
            A premium, glassmorphic design language built for clarity, speed, and aesthetics.
          </p>
        </motion.div>

        {/* 1. Interface Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20">
          {/* Main Hero Card */}
          <div className="lg:col-span-8 bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-2xl shadow-indigo-100/50 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/0 pointer-events-none" />
            <div className="relative z-10">
               <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">Weekly Velocity</h3>
                    <p className="text-slate-500">Task completion rate</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-xl bg-white shadow-sm border border-slate-100 hover:scale-105 transition-transform"><Calendar className="w-5 h-5 text-slate-600"/></button>
                    <button className="p-2 rounded-xl bg-indigo-600 shadow-lg shadow-indigo-200 hover:scale-105 transition-transform"><MoreHorizontal className="w-5 h-5 text-white"/></button>
                  </div>
               </div>
               <div className="h-64 w-full">
                  <Line data={chartData} options={chartOptions} />
               </div>
            </div>
          </div>

          {/* Stats Column */}
          <div className="lg:col-span-4 space-y-6">
             <motion.div 
               whileHover={{ y: -5, scale: 1.02 }}
               className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-300 relative overflow-hidden"
             >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                      <Layout className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-indigo-100">Total Projects</span>
                  </div>
                  <h2 className="text-4xl font-extrabold mb-1">12</h2>
                  <div className="flex items-center text-indigo-200 text-sm">
                    <ArrowRight className="w-4 h-4 mr-1" /> 2 active now
                  </div>
                </div>
             </motion.div>

             <motion.div 
               whileHover={{ y: -5, scale: 1.02 }}
               className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-white shadow-xl shadow-slate-100 relative"
             >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-pink-50 rounded-lg">
                    <Users className="w-5 h-5 text-pink-600" />
                  </div>
                  <span className="font-semibold text-slate-900">Team Status</span>
                </div>
                <div className="flex -space-x-3 mb-4">
                   {[1,2,3,4].map((i) => (
                     <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 shadow-sm" style={{ backgroundImage: `url(https://i.pravatar.cc/100?img=${i+10})`, backgroundSize: 'cover' }} />
                   ))}
                   <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shadow-sm">+5</div>
                </div>
                <p className="text-sm text-slate-500">All members are online.</p>
             </motion.div>
          </div>
        </motion.div>

        {/* 2. Components Showcase */}
        <motion.div variants={itemVariants} className="mb-20">
          <div className="flex items-center space-x-2 pb-4 mb-8 border-b border-indigo-100">
             <span className="text-sm font-bold text-indigo-400 uppercase tracking-widest">UI Components</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            
            {/* Typography */}
            <div className="space-y-6">
              <h5 className="text-slate-400 font-semibold text-xs uppercase tracking-wider mb-4">Typography</h5>
              <div className="space-y-4">
                 <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Inter Bold</h1>
                    <p className="text-slate-400 text-sm">Header 1 / 36px / Tight</p>
                 </div>
                 <div>
                    <h2 className="text-2xl font-bold text-slate-900">Section Title</h2>
                    <p className="text-slate-400 text-sm">Header 2 / 24px</p>
                 </div>
                 <div>
                    <p className="text-slate-600 leading-relaxed font-medium">
                       Primary body text is designed for long-form reading, optimizing line height and letter spacing for maximum clarity on digital screens.
                    </p>
                    <p className="text-slate-400 text-sm mt-2">Body / 16px / Regular</p>
                 </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-6">
              <h5 className="text-slate-400 font-semibold text-xs uppercase tracking-wider mb-4">Interactive Elements</h5>
              <div className="space-y-4">
                <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group">
                  <Command className="w-4 h-4" />
                  <span>Primary Action</span>
                  <ChevronRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="flex gap-4">
                  <button className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl shadow-sm hover:border-indigo-300 hover:text-indigo-600 transition-all active:scale-[0.98]">
                    Secondary
                  </button>
                  <button className="flex-1 py-3 bg-indigo-50 text-indigo-700 font-semibold rounded-xl hover:bg-indigo-100 transition-all active:scale-[0.98]">
                    Ghost
                  </button>
                </div>

                <div className="relative group">
                  <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search anything..." 
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                  />
                  <div className="absolute right-3 top-3 px-2 py-0.5 rounded bg-slate-100 text-xs font-bold text-slate-500 border border-slate-200">⌘K</div>
                </div>
              </div>
            </div>

            {/* Cards */}
            <div className="space-y-6">
               <h5 className="text-slate-400 font-semibold text-xs uppercase tracking-wider mb-4">Micro-Cards</h5>
               
               <motion.div 
                 whileHover={{ x: 5 }}
                 className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer group"
               >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Project Approved</h4>
                      <p className="text-sm text-slate-500">Your roadmap was accepted.</p>
                    </div>
                  </div>
               </motion.div>

               <motion.div 
                 whileHover={{ x: 5 }}
                 className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-red-100 transition-all cursor-pointer group"
               >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 group-hover:bg-red-500 group-hover:text-white transition-colors">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Security Alert</h4>
                      <p className="text-sm text-slate-500">New login from Chrome.</p>
                    </div>
                  </div>
               </motion.div>

            </div>

          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default DesignDemo;
