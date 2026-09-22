import React from 'react'
import { ShieldCheck, Zap, Laptop, Users } from 'lucide-react'
import { usePageSEO, createBreadcrumbSchema } from '../utils/seo'

export const AboutPage: React.FC = () => {
  usePageSEO({
    title: 'About Us — SmartTools India',
    description: 'Learn about SmartTools India, our mission to provide fast, private, free online calculators and everyday digital tools for Indian users.',
    canonicalPath: '/about',
    schema: createBreadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'About Us', path: '/about' },
    ]),
  })
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
          Our Mission
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mt-1">
          About SmartTools India
        </h1>
        <p className="mt-3 text-base text-slate-600 leading-relaxed">
          SmartTools India was established with a singular objective: to deliver fast, free, clean, and reliable everyday utility tools tailored to students, professionals, and internet users across India.
        </p>
      </div>

      <div className="prose prose-slate max-w-none text-slate-600 space-y-6 text-sm sm:text-base leading-relaxed">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-4 shadow-2xs">
          <h2 className="text-xl font-bold text-slate-900">
            Why We Built SmartTools India
          </h2>
          <p>
            When searching for basic calculators online—such as calculating a loan EMI, finding GST rates, or converting units—users are frequently confronted with heavy ads, mandatory sign-up popups, slow loading speeds, and complex interfaces.
          </p>
          <p>
            SmartTools India removes that friction. We believe essential computational tools should be as straightforward and instantaneous as opening a notepad.
          </p>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center gap-2.5 mb-2 text-slate-900 font-semibold">
              <Zap className="h-5 w-5 text-amber-500" />
              <span>Speed and Simplicity</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600">
              Zero bloat, minimal dependencies, and lightning-fast loading across all networks including mobile 4G/5G connections.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center gap-2.5 mb-2 text-slate-900 font-semibold">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              <span>Client-Side Privacy</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600">
              Your inputs remain inside your browser. No personal finance information or dates are transmitted to remote servers.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center gap-2.5 mb-2 text-slate-900 font-semibold">
              <Laptop className="h-5 w-5 text-emerald-600" />
              <span>Mobile-First Experience</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600">
              Designed from the ground up to be seamless on both modern handheld smartphones and large desktop screens.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center gap-2.5 mb-2 text-slate-900 font-semibold">
              <Users className="h-5 w-5 text-purple-600" />
              <span>Indian Context</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600">
              Calibrated for Indian tax slabs (GST), rupee currency formatting (Lakhs/Crores), and local workflow requirements.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
