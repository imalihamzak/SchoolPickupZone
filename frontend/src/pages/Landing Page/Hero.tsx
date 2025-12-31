import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Shield, Users, Clock, CheckCircle } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="min-h-screen flex items-center px-4 sm:px-6 md:px-16 pt-32 md:pt-24 pb-12 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left Content */}
        <div className="text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6 shadow-lg">
            <Shield size={16} />
            Trusted by 500+ Schools
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Secure School 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 block">Pickup Management</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0">
            Revolutionary QR-based system for safe, efficient student pickups. 
            Real-time verification, instant notifications, and complete audit trails.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 mb-12">
            <Link to="/signup">
              <button className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 w-full sm:w-auto">
                Start Free Trial
                <ArrowRight size={20} />
              </button>
            </Link>
            
            <Link to="/login">
              <button className="flex items-center justify-center gap-3 border-2 border-gray-300 text-gray-700 hover:border-blue-600 hover:text-blue-600 px-8 py-4 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg transform hover:scale-105 w-full sm:w-auto">
                Sign In
                <ArrowRight size={20} />
              </button>
            </Link>
          </div>

          {/* Enhanced Stats with better background colors */}
          <div className="grid grid-cols-3 gap-6 text-center lg:text-left">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg">
              <div className="text-3xl font-bold">99.9%</div>
              <div className="text-blue-100 text-sm">Security Rate</div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg">
              <div className="text-3xl font-bold">500+</div>
              <div className="text-green-100 text-sm">Schools</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
              <div className="text-3xl font-bold">50k+</div>
              <div className="text-purple-100 text-sm">Daily Pickups</div>
            </div>
          </div>
        </div>

        {/* Right Content - Enhanced Feature Card */}
        <div className="relative">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-100 p-10 space-y-8 min-h-[500px]">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-xl shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <Shield size={28} />
                <h3 className="text-2xl font-bold">Smart Pickup System</h3>
              </div>
              <p className="text-blue-100 text-lg">Complete safety & efficiency solution</p>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="text-green-500 mt-1 flex-shrink-0" size={24} />
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg">QR Code Verification</h4>
                  <p className="text-gray-600 text-base">Instant guardian authentication</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <CheckCircle className="text-green-500 mt-1 flex-shrink-0" size={24} />
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg">Real-Time Notifications</h4>
                  <p className="text-gray-600 text-base">Instant alerts to parents & staff</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <CheckCircle className="text-green-500 mt-1 flex-shrink-0" size={24} />
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg">Complete Audit Trail</h4>
                  <p className="text-gray-600 text-base">Full pickup history & analytics</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Enhanced floating elements */}
          <div className="absolute -top-4 -right-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white p-3 rounded-full shadow-lg animate-pulse">
            <Users size={24} />
          </div>
          <div className="absolute -bottom-4 -left-4 bg-gradient-to-r from-green-500 to-teal-500 text-white p-3 rounded-full shadow-lg animate-pulse" style={{animationDelay: '1s'}}>
            <Clock size={24} />
          </div>
        </div>
      </div>
    </section>
  )
}
