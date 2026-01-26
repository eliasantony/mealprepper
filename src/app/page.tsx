"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChefHat, Calendar, Smartphone, Sparkles, Activity, Utensils, Settings, Bell } from "lucide-react";
import { Footer } from "@/components/Layout/Footer";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden snap-start">
        {/* Background Glow - Fixed positioning to avoid clipping */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-orange-500/20 via-red-500/10 to-transparent rounded-full blur-[100px] -z-10 opacity-60 pointer-events-none translate-x-1/3" />

        <div className="container mx-auto px-4 relative z-10 py-20">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="flex-1 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 text-orange-500 font-medium text-sm mb-6 border border-orange-500/20 backdrop-blur-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>AI-Powered Meal Planning</span>
                </div>
                <h1 className="text-4xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight">
                  Master Your <br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-600">Meal Prep</span>
                </h1>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  Stop stressing about what to eat. Let our AI generate personalized meal plans, track your macros, and organize your grocery list in seconds.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <Link
                    href="/login"
                    className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold text-lg hover:scale-105 transition-transform shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2"
                  >
                    Start Planning Free
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="#features"
                    className="w-full sm:w-auto px-8 py-4 rounded-full bg-secondary/50 backdrop-blur-sm text-foreground font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center border border-border"
                  >
                    How it Works
                  </Link>
                </div>
              </motion.div>
            </div>
            <div className="flex-1 relative w-full max-w-[500px] lg:max-w-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative z-10"
              >
                {/* Floating Elements */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-12 -right-4 lg:right-12 bg-background/80 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-border z-20 hidden sm:block"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <Activity className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Daily Protein</p>
                      <p className="font-bold text-foreground">145g <span className="text-green-500 text-xs">✓</span></p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute -bottom-8 -left-4 lg:left-0 bg-background/80 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-border z-20 hidden sm:block"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                      <Utensils className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Next Meal</p>
                      <p className="font-bold text-foreground">Chicken & Rice</p>
                    </div>
                  </div>
                </motion.div>

                <div className="relative mx-auto w-full max-w-[320px] lg:max-w-[400px]">
                  <img
                    src="/app-mockup.png"
                    alt="App Mockup"
                    className="w-full h-auto drop-shadow-2xl"
                  />
                </div>
              </motion.div>

              {/* Background Glows */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-orange-500/20 via-red-500/10 to-transparent rounded-full blur-[100px] -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-secondary/20 relative overflow-hidden snap-start min-h-screen flex items-center">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">Everything you need to prep like a pro</h2>
            <p className="text-muted-foreground text-lg">
              Streamline your nutrition journey with our comprehensive suite of tools designed for efficiency and health.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Calendar className="w-8 h-8 text-orange-500" />,
                title: "Smart Scheduling",
                description: "Intuitive drag-and-drop calendar to organize your week. Plan breakfast, lunch, dinner, and snacks with ease."
              },
              {
                icon: <ChefHat className="w-8 h-8 text-orange-500" />,
                title: "AI Recipe Generation",
                description: "Stuck on what to cook? Let our AI suggest delicious recipes based on your ingredients and preferences."
              },
              {
                icon: <Activity className="w-8 h-8 text-orange-500" />,
                title: "Macro Tracking",
                description: "Keep your goals in check. Automatically calculate calories, protein, carbs, and fats for every meal."
              },
              {
                icon: <Settings className="w-8 h-8 text-orange-500" />,
                title: "Dietary Preferences",
                description: "Vegan, Keto, Paleo? No problem. Customize your profile to get recommendations that fit your lifestyle."
              },
              {
                icon: <Bell className="w-8 h-8 text-orange-500" />,
                title: "Smart Notifications",
                description: "Stay consistent with timely reminders and push notifications that keep you connected to your meal schedule."
              },
              {
                icon: <Smartphone className="w-8 h-8 text-orange-500" />,
                title: "PWA Integration",
                description: "Install MealPrepper on any device. Get a native-app feel with offline support and instant home-screen access."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group p-8 rounded-3xl bg-background border border-border hover:border-orange-500/50 transition-all hover:shadow-lg hover:shadow-orange-500/5"
              >
                <div className="mb-6 p-4 rounded-2xl bg-orange-500/10 w-fit group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden snap-start min-h-screen flex items-center">
        <div className="container mx-auto px-4">
          <div className="rounded-[3rem] bg-gradient-to-br from-orange-500 to-red-600 p-8 lg:p-20 text-center text-white relative overflow-hidden shadow-2xl shadow-orange-500/20">
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-3xl lg:text-6xl font-bold mb-8">Ready to transform your diet?</h2>
              <p className="text-orange-100 text-xl mb-10 leading-relaxed">
                Join users who have simplified their meal planning routine and achieved their nutrition goals.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-3 px-10 py-5 rounded-full bg-white text-orange-600 font-bold text-xl hover:bg-gray-50 transition-colors shadow-xl hover:shadow-2xl hover:-translate-y-1 transform duration-200"
              >
                Get Started Now
                <ArrowRight className="w-6 h-6" />
              </Link>
            </div>

            {/* Background patterns */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
              <div className="absolute -top-24 -left-24 w-96 h-96 bg-white rounded-full mix-blend-overlay blur-3xl" />
              <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-black rounded-full mix-blend-overlay blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
