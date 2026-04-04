import { useNavigate } from 'react-router-dom';
import { Heart, Shield, Stethoscope, Phone, Video, ArrowRight, Check, ChevronRight, Activity, Users, Building2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

export default function Landing() {
  const { t } = useApp();
  const navigate = useNavigate();

  const features = [
    { icon: Stethoscope, title: 'Symptom Checker', desc: 'AI-powered health assessment with severity analysis and recommendations', color: 'bg-primary/10 text-primary' },
    { icon: Phone, title: 'Emergency Services', desc: 'One-tap emergency calling with ambulance, police, and hospital contacts', color: 'bg-destructive/10 text-destructive' },
    { icon: Users, title: 'Health Worker Tools', desc: 'Patient registration, visit tracking, follow-up reminders for ASHA workers', color: 'bg-success/10 text-success' },
    { icon: Video, title: 'Telemedicine', desc: 'Connect patients with doctors remotely for asynchronous consultations', color: 'bg-accent/10 text-accent-foreground' },
  ];

  const pricingTiers = [
    {
      name: t('landing.pricing.free'),
      desc: t('landing.pricing.freeDesc'),
      price: t('landing.pricing.freePrice'),
      period: '',
      features: ['Symptom Checker', 'First Aid Guides', 'Emergency Contacts', 'Find Nearby Doctors'],
      popular: false,
    },
    {
      name: t('landing.pricing.healthCenter'),
      desc: t('landing.pricing.healthCenterDesc'),
      price: '₹499',
      period: '/mo',
      features: ['Everything in Free', 'Patient Registration', 'Visit Tracking & Reports', 'Follow-up Reminders', 'Up to 5 Health Workers'],
      popular: true,
    },
    {
      name: t('landing.pricing.hospital'),
      desc: t('landing.pricing.hospitalDesc'),
      price: '₹1,999',
      period: '/mo',
      features: ['Everything in Health Center', 'Telemedicine', 'Doctor Queue Management', 'Referral System', 'Unlimited Users', 'Priority Support'],
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border glass">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Activity className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold text-foreground">RuralCare</span>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="rounded-lg gradient-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105"
          >
            {t('landing.hero.cta')}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 opacity-5 gradient-hero" />
        <div className="container mx-auto px-4 text-center relative">
          <div className="animate-fade-in-up">
            <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
              🏥 Trusted by 500+ villages across India
            </span>
            <h1 className="text-4xl font-extrabold leading-tight text-foreground sm:text-5xl lg:text-6xl">
              {t('landing.hero.title')}{' '}
              <span className="gradient-text">{t('landing.hero.highlight')}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              {t('landing.hero.subtitle')}
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <button
                onClick={() => navigate('/login')}
                className="gradient-primary rounded-lg px-8 py-3 text-base font-semibold text-primary-foreground shadow-elevated transition-transform hover:scale-105 flex items-center gap-2"
              >
                {t('landing.hero.cta')} <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="rounded-lg border border-border bg-card px-8 py-3 text-base font-semibold text-foreground transition-colors hover:bg-muted"
              >
                {t('landing.hero.secondary')}
              </button>
            </div>
          </div>

          {/* Floating dashboard mockup */}
          <div className="mt-16 animate-fade-in-up-delay-2">
            <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-elevated animate-float">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Active Patients', value: '1,247', change: '+12%' },
                  { label: 'Consultations Today', value: '38', change: '+5%' },
                  { label: 'Follow-ups Due', value: '15', change: '-3%' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl bg-muted p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                    <span className="text-xs text-success font-medium">{stat.change}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-muted/50 py-12">
        <div className="container mx-auto grid grid-cols-2 gap-6 px-4 md:grid-cols-4">
          {[
            { value: '500+', label: t('landing.stats.villages') },
            { value: '50,000+', label: t('landing.stats.patients') },
            { value: '2,000+', label: t('landing.stats.workers') },
            { value: '300+', label: t('landing.stats.doctors') },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-extrabold gradient-text">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">{t('landing.features.title')}</h2>
            <p className="mt-3 text-muted-foreground">{t('landing.features.subtitle')}</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <div key={i} className={`animate-fade-in-up-delay-${i % 4} rounded-2xl border border-border bg-card p-6 shadow-card transition-transform hover:-translate-y-1 hover:shadow-elevated`}>
                <div className={`mb-4 inline-flex rounded-xl p-3 ${f.color}`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold text-foreground mb-12">{t('landing.howItWorks.title')}</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            {[
              { step: '1', title: t('landing.howItWorks.step1'), desc: t('landing.howItWorks.step1Desc') },
              { step: '2', title: t('landing.howItWorks.step2'), desc: t('landing.howItWorks.step2Desc') },
              { step: '3', title: t('landing.howItWorks.step3'), desc: t('landing.howItWorks.step3Desc') },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full gradient-primary text-primary-foreground text-xl font-bold shadow-soft">
                    {item.step}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground max-w-[200px]">{item.desc}</p>
                </div>
                {i < 2 && <ChevronRight className="hidden md:block h-6 w-6 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold text-foreground mb-12">{t('landing.pricing.title')}</h2>
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl border p-6 transition-transform hover:-translate-y-1 ${
                  tier.popular
                    ? 'border-primary bg-primary/5 shadow-elevated'
                    : 'border-border bg-card shadow-card'
                }`}
              >
                {tier.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full gradient-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-semibold text-foreground">{tier.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{tier.desc}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-foreground">{tier.price}</span>
                  {tier.period && <span className="text-muted-foreground">{tier.period}</span>}
                </div>
                <ul className="mt-6 space-y-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="h-4 w-4 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/login')}
                  className={`mt-6 w-full rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                    tier.popular
                      ? 'gradient-primary text-primary-foreground'
                      : 'border border-border bg-card text-foreground hover:bg-muted'
                  }`}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="gradient-primary py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground">{t('landing.cta.title')}</h2>
          <p className="mt-3 text-primary-foreground/80">{t('landing.cta.subtitle')}</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-8 rounded-lg bg-card px-8 py-3 text-base font-semibold text-foreground shadow-lg transition-transform hover:scale-105"
          >
            {t('landing.hero.cta')}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="container mx-auto grid grid-cols-2 gap-8 px-4 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-primary" />
              <span className="font-bold text-foreground">RuralCare</span>
            </div>
            <p className="text-sm text-muted-foreground">Healthcare for every village in India.</p>
          </div>
          {[
            { title: t('landing.footer.product'), items: ['Features', 'Pricing', 'Mobile App'] },
            { title: t('landing.footer.company'), items: ['About', 'Blog', 'Careers'] },
            { title: t('landing.footer.support'), items: ['Help Center', 'Contact', 'Privacy'] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-semibold text-foreground mb-3">{col.title}</h4>
              <ul className="space-y-2">
                {col.items.map((item) => (
                  <li key={item} className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="container mx-auto mt-8 border-t border-border pt-6 px-4 text-center text-sm text-muted-foreground">
          © 2026 RuralCare. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
