import React from 'react'
import { Link } from 'react-router-dom'
import { Mail, MapPin, Phone, Shield, ArrowRight } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-16 px-6 md:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid gap-10 md:grid-cols-4 sm:grid-cols-2">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
            <img src="/logo.png" alt="Logo" className="h-14 w-14 shadow-lg" />

              <div className="text-2xl font-bold">
                Pickup<span className="text-blue-400">Zone</span>
              </div>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              The most trusted school pickup management system. Ensuring student safety 
              through secure QR codes, real-time verification, and comprehensive tracking.
            </p>
            <div className="flex gap-4">
              <Link to="/signup">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2">
                  Get Started
                  <ArrowRight size={16} />
                </button>
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Quick Links</h3>
            <ul className="space-y-3 text-gray-400">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Login</Link></li>
              <li><Link to="/signup" className="hover:text-white transition-colors">Sign Up</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Contact Info</h3>
            <ul className="space-y-4 text-gray-400">
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                  <Mail size={16} />
                </div>
                <a href="mailto:support@pickupzone.com" className="hover:text-white transition-colors">
                  support@pickupzone.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                  <Phone size={16} />
                </div>
                <a href="tel:+923001234567" className="hover:text-white transition-colors">
                  +92 300 1234567
                </a>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                  <MapPin size={16} />
                </div>
                <span>Business Incubation Center, ORIC</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gray-400 text-sm">
            © {new Date().getFullYear()} PickupZone. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-gray-400 text-sm">
            <span>Powered by</span>
            <a 
              href="https://softechinc.ai/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
            >
              Softech Inc
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
