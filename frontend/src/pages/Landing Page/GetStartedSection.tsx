import React from 'react'
import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin, ArrowRight, Shield, Users, Clock, Star, CheckCircle, GraduationCap, Heart } from 'lucide-react'

export default function GetStartedSection() {
  return (
    <section id="get-started" className="py-20 px-6 md:px-16 bg-gradient-to-b from-gray-50 via-white to-blue-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 opacity-5">
          <GraduationCap className="text-blue-500" size={120} />
        </div>
        <div className="absolute bottom-10 right-10 opacity-5">
          <Heart className="text-purple-500" size={100} />
        </div>
        <div className="absolute top-1/2 right-1/4 opacity-5">
          <Shield className="text-green-500" size={90} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Main CTA */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm text-blue-800 px-6 py-3 rounded-full text-sm font-medium mb-6 shadow-lg border border-blue-200">
            <Shield size={16} />
            Ready to Get Started?
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Transform Your School's 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 block">Pickup Process Today</span>
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Join hundreds of schools already using PickupZone to simplify and secure 
            their daily student pickup operations.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <Link to="/signup">
              <button className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
                Start Free Trial
                <ArrowRight size={20} />
              </button>
            </Link>
            <a href="#contact" className="inline-flex items-center justify-center gap-3 border-2 border-gray-300 text-gray-700 hover:border-blue-600 hover:text-blue-600 px-10 py-4 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg transform hover:scale-105">
              Schedule Demo
              <ArrowRight size={20} />
            </a>
          </div>

          {/* Enhanced Trust Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-blue-100 hover:shadow-2xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                <Shield className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">99.9% Secure</h3>
              <p className="text-gray-600">Bank-level security with encrypted data and secure authentication</p>
              <div className="flex items-center justify-center gap-1 mt-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="text-yellow-400 fill-current" size={16} />
                ))}
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-green-100 hover:shadow-2xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                <Users className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">500+ Schools</h3>
              <p className="text-gray-600">Trusted by educational institutions worldwide for student safety</p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <CheckCircle className="text-green-500" size={16} />
                <span className="text-sm text-gray-600">Verified Schools</span>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-purple-100 hover:shadow-2xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                <Clock className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">24/7 Support</h3>
              <p className="text-gray-600">Round-the-clock assistance with dedicated support team</p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Available Now</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Contact Info */}
        <div id="contact" className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/30 p-12">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-6 py-3 rounded-full text-sm font-medium mb-6 shadow-lg">
              <Mail size={16} />
              Get in Touch
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Need Help Getting Started?</h3>
            <p className="text-gray-600 text-lg">Our team is here to help you implement PickupZone at your school.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Mail className="text-white" size={28} />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Email Support</h4>
              <p className="text-gray-600 text-sm mb-4">Get help with setup and implementation</p>
              <a href="mailto:support@pickupzone.com" className="text-blue-600 hover:text-blue-700 font-medium text-lg">
                support@pickupzone.com
              </a>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Phone className="text-green-600" size={28} />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Phone Support</h4>
              <p className="text-gray-600 text-sm mb-4">Speak directly with our team</p>
              <a href="tel:+923001234567" className="text-blue-600 hover:text-blue-700 font-medium text-lg">
                +92 300 1234567
              </a>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                <MapPin className="text-purple-600" size={28} />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Visit Us</h4>
              <p className="text-gray-600 text-sm mb-4">Come see us at our office</p>
              <p className="text-blue-600 font-medium text-lg">Business Incubation Center</p>
              <p className="text-gray-600 text-sm">ORIC, Pakistan</p>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-12 pt-8 border-t border-gray-200">
            <p className="text-gray-600 mb-6">Ready to get started? We'll have you up and running in no time.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/signup">
                <button className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl">
                  Start Free Trial
                  <ArrowRight size={18} />
                </button>
              </Link>
              <Link to="/login">
                <button className="inline-flex items-center justify-center gap-3 border-2 border-gray-300 text-gray-700 hover:border-blue-600 hover:text-blue-600 px-8 py-3 rounded-lg font-semibold transition-all duration-200">
                  Sign In
                  <ArrowRight size={18} />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
