import React from 'react'
import { UserPlus, ShieldCheck, Smartphone, QrCode, BellRing, CheckCircle } from 'lucide-react'

const steps = [
  {
    icon: <UserPlus size={36} />,
    title: 'Register & Setup',
    desc: 'Parents create accounts and add student & guardian profiles with verification.',
    color: 'from-blue-500 to-blue-600'
  },
  {
    icon: <ShieldCheck size={36} />,
    title: 'Admin Approval',
    desc: 'School administrators review and approve all registered profiles for security.',
    color: 'from-green-500 to-green-600'
  },
  {
    icon: <Smartphone size={36} />,
    title: 'Device Registration',
    desc: 'Security staff register authorized scanning devices with unique identifiers.',
    color: 'from-purple-500 to-purple-600'
  },
  {
    icon: <QrCode size={36} />,
    title: 'QR Code Scanning',
    desc: 'Guards scan student QR codes to verify authorized pickup personnel.',
    color: 'from-orange-500 to-orange-600'
  },
  {
    icon: <BellRing size={36} />,
    title: 'Instant Notifications',
    desc: 'Parents and administrators receive real-time pickup confirmations.',
    color: 'from-teal-500 to-teal-600'
  },
]

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 px-6 md:px-16 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <CheckCircle size={16} />
            Simple Process
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            How PickupZone 
            <span className="text-blue-600 block">Works</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our streamlined 5-step process ensures secure, efficient student pickups 
            with complete transparency and real-time tracking.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {steps.map((step, i) => (
            <div key={i} className="text-center relative">
              {/* Connection Line */}
              {i < steps.length - 1 && (
                <div className="hidden xl:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-gray-300 to-gray-200 z-0"></div>
              )}
              
              <div className="relative z-10">
                <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center text-white shadow-lg mb-4`}>
                  {step.icon}
                </div>
                <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Implementation Support Included
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Our team provides complete setup assistance, staff training, and ongoing support 
            to ensure smooth implementation at your school.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
              <CheckCircle className="text-green-500" size={16} />
              <span className="text-gray-700">Free Setup</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
              <CheckCircle className="text-green-500" size={16} />
              <span className="text-gray-700">Staff Training</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
              <CheckCircle className="text-green-500" size={16} />
              <span className="text-gray-700">24/7 Support</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
