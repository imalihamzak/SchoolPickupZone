import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, QrCode, Bell, Activity, Users, Clock, GraduationCap, Heart, Lock, Eye, UserCheck, School } from 'lucide-react'

const features = [
  {
    icon: <QrCode size={32} />,
    title: 'QR-Based Authentication',
    desc: 'Secure QR codes linked to authorized guardians with real-time verification system.',
    color: 'from-blue-500 to-blue-600'
  },
  {
    icon: <ShieldCheck size={32} />,
    title: 'Device Authorization',
    desc: 'Only registered devices and verified guards can scan and authorize student pickups.',
    color: 'from-green-500 to-green-600'
  },
  {
    icon: <Bell size={32} />,
    title: 'Instant Notifications',
    desc: 'Real-time alerts to parents and administrators for every pickup transaction.',
    color: 'from-purple-500 to-purple-600'
  },
  {
    icon: <Activity size={32} />,
    title: 'Complete Audit Trail',
    desc: 'Detailed pickup history with timestamps, device info, and scanner identification.',
    color: 'from-orange-500 to-orange-600'
  },
  {
    icon: <Users size={32} />,
    title: 'Multi-User Management',
    desc: 'Support for parents, guardians, administrators, and security staff roles.',
    color: 'from-teal-500 to-teal-600'
  },
  {
    icon: <Clock size={32} />,
    title: 'Real-Time Tracking',
    desc: 'Live pickup status updates and comprehensive reporting dashboard.',
    color: 'from-pink-500 to-pink-600'
  },
]

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-6 md:px-16 bg-gradient-to-b from-white via-blue-50 to-purple-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* School-related icons */}
        <div className="absolute top-20 left-10 opacity-10">
          <GraduationCap className="text-blue-500" size={80} />
        </div>
        <div className="absolute bottom-20 right-10 opacity-10">
          <School className="text-purple-500" size={70} />
        </div>
        <div className="absolute top-40 right-1/4 opacity-10">
          <Heart className="text-pink-500" size={60} />
        </div>
        <div className="absolute bottom-40 left-1/4 opacity-10">
          <Lock className="text-green-500" size={65} />
        </div>
        <div className="absolute top-60 left-1/3 opacity-10">
          <Eye className="text-orange-500" size={55} />
        </div>
        <div className="absolute bottom-60 right-1/3 opacity-10">
          <UserCheck className="text-teal-500" size={75} />
        </div>
        
        {/* QR Code pattern */}
        <div className="absolute top-1/2 left-20 opacity-5">
          <QrCode className="text-blue-600" size={100} />
        </div>
        <div className="absolute top-1/3 right-20 opacity-5">
          <QrCode className="text-purple-600" size={90} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm text-blue-800 px-6 py-3 rounded-full text-sm font-medium mb-6 shadow-lg border border-blue-200">
            <ShieldCheck size={16} />
            Powerful Features
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Everything You Need for 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 block">Secure Pickups</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From QR code generation to real-time tracking and comprehensive reporting, 
            PickupZone provides all the tools needed for safe and efficient student pickups.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <div
              key={i}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8 group border border-white/20 hover:border-blue-200"
            >
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Enhanced Bottom CTA */}
        <div className="text-center mt-20">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/30 p-10 max-w-5xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <GraduationCap className="text-white" size={24} />
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                  <Heart className="text-white" size={24} />
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center">
                  <ShieldCheck className="text-white" size={24} />
                </div>
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Transform Your School's Pickup Process?
            </h3>
            <p className="text-gray-600 mb-8 text-lg">
              Join hundreds of schools already using PickupZone for safer, more efficient student pickups.
            </p>
            <Link to="/signup">
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
                Start Your Free Trial
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
