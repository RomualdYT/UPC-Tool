import React from 'react';
import { motion } from 'framer-motion';

// Animation de hover pour les boutons
export const ButtonHover = ({ children, className = '', ...props }) => (
  <motion.button
    className={`transition-all duration-200 ${className}`}
    whileHover={{ 
      scale: 1.02,
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
    }}
    whileTap={{ 
      scale: 0.98,
      boxShadow: '0 5px 15px -3px rgba(0, 0, 0, 0.1)',
    }}
    {...props}
  >
    {children}
  </motion.button>
);

// Animation de hover pour les cartes
export const CardHover = ({ children, className = '', ...props }) => (
  <motion.div
    className={`transition-all duration-300 ${className}`}
    whileHover={{ 
      y: -4,
      boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.1)',
    }}
    transition={{ 
      type: "spring", 
      stiffness: 300, 
      damping: 30 
    }}
    {...props}
  >
    {children}
  </motion.div>
);

// Animation de flottement
export const FloatingAnimation = ({ children, className = '', duration = 3, delay = 0 }) => (
  <motion.div
    className={className}
    animate={{
      y: [0, -10, 0],
    }}
    transition={{
      duration: duration,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut",
      delay: delay
    }}
  >
    {children}
  </motion.div>
);

// Animation de pulsation
export const PulseAnimation = ({ children, className = '', scale = 1.05, duration = 2 }) => (
  <motion.div
    className={className}
    animate={{
      scale: [1, scale, 1],
    }}
    transition={{
      duration: duration,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut"
    }}
  >
    {children}
  </motion.div>
);

// Animation de rotation
export const RotateAnimation = ({ children, className = '', degrees = 360, duration = 2 }) => (
  <motion.div
    className={className}
    animate={{
      rotate: [0, degrees]
    }}
    transition={{
      duration: duration,
      repeat: Infinity,
      ease: "linear"
    }}
  >
    {children}
  </motion.div>
);

// Animation de bounce
export const BounceAnimation = ({ children, className = '', bounce = 10, duration = 0.5 }) => (
  <motion.div
    className={className}
    animate={{
      y: [0, -bounce, 0]
    }}
    transition={{
      duration: duration,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeOut"
    }}
  >
    {children}
  </motion.div>
);

// Animation de fade in avec délai
export const FadeInUp = ({ children, className = '', delay = 0, duration = 0.5 }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ 
      duration: duration,
      delay: delay,
      ease: "easeOut"
    }}
  >
    {children}
  </motion.div>
);

// Animation de slide depuis la gauche
export const SlideInLeft = ({ children, className = '', delay = 0, duration = 0.5 }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, x: -50 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ 
      duration: duration,
      delay: delay,
      ease: "easeOut"
    }}
  >
    {children}
  </motion.div>
);

// Animation de slide depuis la droite
export const SlideInRight = ({ children, className = '', delay = 0, duration = 0.5 }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, x: 50 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ 
      duration: duration,
      delay: delay,
      ease: "easeOut"
    }}
  >
    {children}
  </motion.div>
);

// Animation de scale in
export const ScaleIn = ({ children, className = '', delay = 0, duration = 0.5 }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ 
      duration: duration,
      delay: delay,
      ease: "easeOut"
    }}
  >
    {children}
  </motion.div>
);

// Animation de typing effect
export const TypingEffect = ({ text, className = '', speed = 0.05 }) => {
  const letters = Array.from(text);
  
  return (
    <motion.span className={className}>
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.25,
            delay: index * speed,
            ease: "easeOut"
          }}
        >
          {letter}
        </motion.span>
      ))}
    </motion.span>
  );
};

// Animation de stagger pour les listes
export const StaggerContainer = ({ children, className = '', staggerDelay = 0.1 }) => (
  <motion.div
    className={className}
    initial="hidden"
    animate="visible"
    variants={{
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: staggerDelay
        }
      }
    }}
  >
    {children}
  </motion.div>
);

export const StaggerItem = ({ children, className = '' }) => (
  <motion.div
    className={className}
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 30
        }
      }
    }}
  >
    {children}
  </motion.div>
);

// Animation de gradient qui bouge
export const AnimatedGradient = ({ children, className = '' }) => (
  <motion.div
    className={`bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 ${className}`}
    animate={{
      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
    }}
    transition={{
      duration: 5,
      repeat: Infinity,
      ease: "linear"
    }}
    style={{
      backgroundSize: '200% 200%'
    }}
  >
    {children}
  </motion.div>
);

// Animation de shake pour les erreurs
export const ShakeAnimation = ({ children, className = '', trigger = false }) => (
  <motion.div
    className={className}
    animate={trigger ? {
      x: [-10, 10, -10, 10, 0],
      transition: { duration: 0.5 }
    } : {}}
  >
    {children}
  </motion.div>
);

export default {
  ButtonHover,
  CardHover,
  FloatingAnimation,
  PulseAnimation,
  RotateAnimation,
  BounceAnimation,
  FadeInUp,
  SlideInLeft,
  SlideInRight,
  ScaleIn,
  TypingEffect,
  StaggerContainer,
  StaggerItem,
  AnimatedGradient,
  ShakeAnimation
};