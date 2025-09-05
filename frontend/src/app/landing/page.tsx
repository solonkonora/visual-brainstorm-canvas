/* eslint-disable react/no-unescaped-entities */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import SocketTest from './SocketTest';
import {
  FaPalette,
  FaSun,
  FaMoon,
  FaBars,
  FaTimes,
  FaPencilAlt,
  FaComments,
  FaShapes,
  FaShareAlt,
  FaBolt,
  FaUsers,
  FaShieldAlt,
  FaDownload,
  FaHistory,
  FaChevronLeft,
  FaChevronRight,
  FaCheck,
  FaPlay,
  FaStar,
  FaQuoteLeft,
  FaGithub,
  FaTwitter,
  FaLinkedin
} from 'react-icons/fa';

const LandingPage = () => {
  const [theme, setTheme] = useState('light');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [animatedElements, setAnimatedElements] = useState(new Set());
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const slides = [
    {
      icon: FaPencilAlt,
      title: "Draw Together",
      description: "Collaborative drawing in real-time"
    },
    {
      icon: FaComments,
      title: "Chat & Collaborate",
      description: "Built-in chat for seamless communication"
    },
    {
      icon: FaShapes,
      title: "Advanced Tools",
      description: "Professional drawing and shape tools"
    },
    {
      icon: FaShareAlt,
      title: "Share Instantly",
      description: "Generate shareable links in seconds"
    }
  ];

  const features = [
    {
      icon: FaBolt,
      title: "Real-time Sync",
      description: "See changes instantly with WebSocket-powered synchronization"
    },
    {
      icon: FaUsers,
      title: "Multi-user Cursors",
      description: "See where your team members are working in real-time"
    },
    {
      icon: FaPalette,
      title: "Advanced Tools",
      description: "Professional drawing tools with customizable brushes and shapes"
    },
    {
      icon: FaShieldAlt,
      title: "Secure Sharing",
      description: "Private rooms with secure, shareable links"
    },
    {
      icon: FaDownload,
      title: "Export Options",
      description: "Export your canvas as high-quality images"
    },
    {
      icon: FaHistory,
      title: "Version History",
      description: "Undo/redo with complete version tracking"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Product Designer at TechCorp",
      content: "Visual Brainstorm Canvas has revolutionized how our remote team collaborates. The real-time features are incredible.",
      rating: 5
    },
    {
      name: "Mike Rodriguez",
      role: "Engineering Manager",
      content: "The simplicity and power of this tool amazed us. We've reduced our design meetings by 50%.",
      rating: 5
    },
    {
      name: "Emma Johnson",
      role: "UX Research Lead",
      content: "Finally, a collaborative canvas that doesn't lag or crash. Our team productivity has skyrocketed.",
      rating: 5
    }
  ];

  const stats = [
    { number: "50K+", label: "Active Users" },
    { number: "1M+", label: "Canvases Created" },
    { number: "99.9%", label: "Uptime" },
    { number: "24/7", label: "Support" }
  ];

  const useCases = [
    {
      title: "Design Teams",
      description: "Wireframing, prototyping, and design reviews",
      icon: FaPalette
    },
    {
      title: "Engineering",
      description: "Architecture diagrams and technical planning",
      icon: FaBolt
    },
    {
      title: "Marketing",
      description: "Campaign planning and content mapping",
      icon: FaUsers
    },
    {
      title: "Education",
      description: "Interactive lessons and student collaboration",
      icon: FaShapes
    }
  ];

  // Animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setAnimatedElements(prev => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Carousel functionality
  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayRef.current = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % slides.length);
      }, 4000);
    }
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, slides.length]);

  // Testimonial rotation
  useEffect(() => {
    const testimonialInterval = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(testimonialInterval);
  }, [testimonials.length]);

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % slides.length);
    pauseAutoPlay();
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
    pauseAutoPlay();
  };

  const pauseAutoPlay = () => {
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const navHeight = 80;
      const targetPosition = element.offsetTop - navHeight;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
    setIsMobileMenuOpen(false);
  };

  const isAnimated = (id: string) => animatedElements.has(id);

  return (
    <div className={`min-h-screen transition-all duration-500 ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-lg bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
                <FaPalette className="text-white text-lg" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-800 dark:text-white">
                  Visual Brainstorm Canvas
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Collaborate • Create • Connect
                </div>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection('features')}
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('use-cases')}
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
              >
                Use Cases
              </button>
              <button 
                onClick={() => scrollToSection('testimonials')}
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
              >
                Testimonials
              </button>
              <button 
                onClick={() => scrollToSection('pricing')}
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
              >
                Pricing
              </button>
              <Link href="/auth" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg">
                Get Started
              </Link>
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                {theme === 'dark' ? <FaSun className="text-yellow-500" /> : <FaMoon className="text-gray-600" />}
              </button>
            </div>
            
            <div className="md:hidden">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 text-gray-600 dark:text-gray-300"
              >
                <FaBars />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-80 backdrop-blur-lg bg-white/90 dark:bg-gray-900/90 border-l border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-8">
              <span className="text-lg font-bold text-gray-800 dark:text-white">Menu</span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-gray-600 dark:text-gray-300"
              >
                <FaTimes />
              </button>
            </div>
            <div className="space-y-6">
              {['features', 'use-cases', 'testimonials', 'pricing'].map((section) => (
                <button 
                  key={section}
                  onClick={() => scrollToSection(section)}
                  className="block w-full text-left text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-3 text-lg capitalize"
                >
                  {section.replace('-', ' ')}
                </button>
              ))}
              <Link href="/auth" className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-center">
                Get Started
              </Link>
              <button 
                onClick={toggleTheme}
                className="flex items-center space-x-3 p-3 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors w-full"
              >
                {theme === 'dark' ? <FaSun className="text-yellow-500" /> : <FaMoon className="text-gray-600" />}
                <span>Toggle Theme</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-28 pb-20 min-h-screen flex items-center bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div 
              data-animate
              id="hero-text"
              className={`transition-all duration-1000 ${isAnimated('hero-text') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            >
              <div className="inline-flex items-center px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium mb-6">
                <FaBolt className="mr-2" />
                Real-time Collaboration Platform
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
                <span className="text-gray-800 dark:text-white">Visual</span><br />
                <span className="text-blue-600">Brainstorm</span><br />
                <span className="text-gray-800 dark:text-white">Canvas</span>
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-10 leading-relaxed max-w-lg">
                Transform your team's creative process with real-time collaborative drawing. 
                Visualize complex ideas, brainstorm together, and bring concepts to life 
                without the friction of traditional tools.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-12">
                <Link href="/auth" className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 group">
                  <span>Start Creating Free</span>
                  <FaPlay className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300">
                  Watch Demo (2 min)
                </button>
              </div>
              
              <div className="flex flex-wrap gap-8 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                  <FaUsers className="text-blue-500" />
                  <span>50K+ Active Users</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FaBolt className="text-green-500" />
                  <span>99.9% Uptime</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FaShieldAlt className="text-purple-500" />
                  <span>Enterprise Security</span>
                </div>
              </div>
            </div>
            
            {/* Enhanced Carousel */}
            <div 
              data-animate
              id="hero-carousel"
              className={`transition-all duration-1000 delay-300 ${isAnimated('hero-carousel') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            >
              <div 
                className="relative overflow-hidden rounded-3xl shadow-2xl bg-white dark:bg-gray-800"
                onMouseEnter={() => setIsAutoPlaying(false)}
                onMouseLeave={() => setIsAutoPlaying(true)}
              >
                <div 
                  className="flex transition-transform duration-700 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {slides.map((slide, index) => {
                    const IconComponent = slide.icon;
                    return (
                      <div key={index} className="w-full flex-shrink-0 min-w-0">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-6 sm:p-12 h-64 sm:h-96 flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 bg-black/10"></div>
                          <div className="text-center text-white relative z-10">
                            <IconComponent className="text-5xl sm:text-8xl mb-4 sm:mb-6 animate-pulse" />
                            <h3 className="text-xl sm:text-3xl font-bold mb-2 sm:mb-4">{slide.title}</h3>
                            <p className="text-base sm:text-xl opacity-90">{slide.description}</p>
                          </div>
                          {/* Animated Background Elements */}
                          <div className="absolute top-4 right-4 w-10 h-10 sm:w-20 sm:h-20 bg-white/10 rounded-full animate-bounce"></div>
                          <div className="absolute bottom-8 left-8 w-6 h-6 sm:w-12 sm:h-12 bg-white/10 rounded-full animate-pulse delay-1000"></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Enhanced Controls */}
                <button 
                  onClick={prevSlide}
                  className="absolute left-2 sm:left-6 top-1/2 transform -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 p-2 sm:p-4 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 backdrop-blur-sm"
                >
                  <FaChevronLeft className="text-gray-700 dark:text-gray-300" />
                </button>
                <button 
                  onClick={nextSlide}
                  className="absolute right-2 sm:right-6 top-1/2 transform -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 p-2 sm:p-4 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 backdrop-blur-sm"
                >
                  <FaChevronRight className="text-gray-700 dark:text-gray-300" />
                </button>
                {/* Progress Indicators */}
                <div className="absolute bottom-3 sm:bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 sm:space-x-3">
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                        index === currentSlide ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/75'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Socket Test Component - Remove this in production */}
      <section className="py-12 bg-gray-100 dark:bg-gray-800">
        <div className="container mx-auto px-6">
          <SocketTest />
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="py-24 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-6">
          <div 
            data-animate
            id="use-cases-header"
            className={`text-center mb-20 transition-all duration-1000 ${isAnimated('use-cases-header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            <h2 className="text-5xl font-bold mb-6 text-gray-800 dark:text-white">
              Built for Every Team
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              From startups to enterprises, Visual Brainstorm Canvas adapts to your workflow
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {useCases.map((useCase, index) => {
              const IconComponent = useCase.icon;
              return (
                <div 
                  key={index}
                  data-animate
                  id={`use-case-${index}`}
                  className={`text-center p-8 rounded-2xl bg-gray-50 dark:bg-gray-900 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 group ${
                    isAnimated(`use-case-${index}`) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="text-2xl text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
                    {useCase.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {useCase.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-6">
          <div 
            data-animate
            id="testimonials-header"
            className={`text-center mb-20 transition-all duration-1000 ${isAnimated('testimonials-header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            <h2 className="text-5xl font-bold mb-6 text-gray-800 dark:text-white">
              Loved by Teams Worldwide
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              See what our users are saying about Visual Brainstorm Canvas
            </p>
          </div>
          
          <div 
            data-animate
            id="testimonials-content"
            className={`max-w-4xl mx-auto transition-all duration-1000 ${isAnimated('testimonials-content') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-gray-800 shadow-xl p-12">
              <div 
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
              >
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="w-full flex-shrink-0 text-center">
                    <FaQuoteLeft className="text-4xl text-blue-500 mx-auto mb-8 opacity-50" />
                    <blockquote className="text-2xl text-gray-700 dark:text-gray-300 mb-8 italic leading-relaxed">
                      "{testimonial.content}"
                    </blockquote>
                    <div className="flex justify-center mb-4">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <FaStar key={i} className="text-yellow-400 text-xl" />
                      ))}
                    </div>
                    <div className="font-bold text-gray-800 dark:text-white text-lg">{testimonial.name}</div>
                    <div className="text-gray-600 dark:text-gray-400">{testimonial.role}</div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-center space-x-2 mt-8">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentTestimonial ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-6">
          <div 
            data-animate
            id="pricing-header"
            className={`text-center mb-20 transition-all duration-1000 ${isAnimated('pricing-header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            <h2 className="text-5xl font-bold mb-6 text-gray-800 dark:text-white">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Choose the plan that fits your team's needs
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Starter",
                price: "$0",
                period: "/month",
                features: ["3 Active Canvases", "5 Team Members", "Basic Drawing Tools", "PNG Export", "Community Support"],
                buttonText: "Get Started Free",
                isPopular: false
              },
              {
                name: "Professional",
                price: "$15",
                period: "/month",
                features: ["Unlimited Canvases", "25 Team Members", "Advanced Tools", "All Export Formats", "Version History", "Priority Support"],
                buttonText: "Start Free Trial",
                isPopular: true
              },
              {
                name: "Enterprise",
                price: "$45",
                period: "/month",
                features: ["Everything in Pro", "Unlimited Members", "Admin Dashboard", "SSO Integration", "Custom Branding", "Dedicated Support"],
                buttonText: "Contact Sales",
                isPopular: false
              }
            ].map((plan, index) => (
              <div 
                key={index}
                data-animate
                id={`pricing-${index}`}
                className={`p-8 rounded-3xl shadow-xl transition-all duration-500 hover:scale-105 relative ${
                  plan.isPopular 
                    ? 'border-2 border-blue-500 bg-gradient-to-b from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20' 
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                } ${isAnimated(`pricing-${index}`) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                {plan.isPopular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-bold">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white text-center">
                  {plan.name}
                </h3>
                <div className="text-center mb-6">
                  <span className="text-5xl font-bold text-blue-600">{plan.price}</span>
                  <span className="text-gray-600 dark:text-gray-400">{plan.period}</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-3">
                      <FaCheck className="text-green-500 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-4 rounded-xl font-bold transition-all duration-300 ${
                  plan.isPopular
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}>
                  {plan.buttonText}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="container mx-auto px-6 text-center">
          <div 
            data-animate
            id="cta"
            className={`transition-all duration-1000 ${isAnimated('cta') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Ready to Transform Your Team's Workflow?
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-3xl mx-auto">
              Join thousands of teams already using Visual Brainstorm Canvas to collaborate more effectively.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth" className="px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-gray-100 font-bold transition-all duration-300 shadow-lg hover:shadow-xl">
                Start Free Trial
              </Link>
              <button className="px-8 py-4 bg-transparent text-white border-2 border-white rounded-xl hover:bg-white/10 font-bold transition-all duration-300">
                Schedule a Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
                  <FaPalette className="text-white text-lg" />
                </div>
                <div>
                  <div className="text-xl font-bold text-white">Visual Brainstorm Canvas</div>
                  <div className="text-xs text-gray-500">Collaborate • Create • Connect</div>
                </div>
              </div>
              <p className="mb-6 max-w-md">
                The most intuitive collaborative canvas for teams to visualize, brainstorm, 
                and bring ideas to life in real-time.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <FaGithub className="text-2xl" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <FaTwitter className="text-2xl" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <FaLinkedin className="text-2xl" />
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-bold text-white mb-6">Product</h4>
              <ul className="space-y-4">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Use Cases</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Roadmap</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold text-white mb-6">Resources</h4>
              <ul className="space-y-4">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Tutorials</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold text-white mb-6">Company</h4>
              <ul className="space-y-4">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Partners</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-sm flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} Visual Brainstorm Canvas. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;