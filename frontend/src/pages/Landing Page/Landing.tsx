import React from 'react'
import Header from './Header'
import HeroSection from './Hero'
import  Features  from './Features'
import HowItWorksSection from './HowItWorksSection'
import GetStartedSection from './GetStartedSection'
import Footer from './Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full bg-white">
      <Header />
      <HeroSection />
      <Features />
      <HowItWorksSection/>
      <GetStartedSection/>
      <Footer/>
    </div>
  )
}
