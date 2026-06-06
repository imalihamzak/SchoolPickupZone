import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Shield, ArrowRight } from 'lucide-react'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="w-full fixed top-0 left-0 z-50 bg-gray-900/95 backdrop-blur-md shadow-lg">
      <div className="max-w-7xl mx-auto px-6 md:px-16 py-4 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center gap-3">
        <img src="/logo.png" alt="Logo" className="h-14 w-14 shadow-lg" />

          <div className="text-2xl font-bold text-white">
            Pickup<span className="text-blue-400">Zone</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-8 text-gray-300 font-medium">
          <Link to="/features" className="hover:text-blue-400 transition-colors duration-200">Features</Link>
          <Link to="/pricing" className="hover:text-blue-400 transition-colors duration-200">Pricing</Link>
          <Link to="/about" className="hover:text-blue-400 transition-colors duration-200">About</Link>
          <Link to="/contact" className="hover:text-blue-400 transition-colors duration-200">Contact</Link>
        </nav>

        {/* Login Button */}
        <div className="hidden md:block">
          <Link to="/login">
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg">
              Login
              <ArrowRight size={16} />
            </button>
          </Link>
        </div>

        {/* Hamburger Button */}
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="text-gray-300" size={28} /> : <Menu className="text-gray-300" size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden px-6 pb-6">
          <nav className="flex flex-col gap-4 bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700 text-gray-300 text-base font-medium">
            <Link to="/features" onClick={() => setIsOpen(false)} className="hover:text-blue-400 py-2">Features</Link>
            <Link to="/pricing" onClick={() => setIsOpen(false)} className="hover:text-blue-400 py-2">Pricing</Link>
            <Link to="/about" onClick={() => setIsOpen(false)} className="hover:text-blue-400 py-2">About</Link>
            <Link to="/contact" onClick={() => setIsOpen(false)} className="hover:text-blue-400 py-2">Contact</Link>
            <Link to="/login">
              <button onClick={() => setIsOpen(false)} className="bg-blue-600 hover:bg-blue-700 text-white w-full py-3 rounded-lg font-semibold transition-all duration-200 mt-2">
                Login
              </button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
