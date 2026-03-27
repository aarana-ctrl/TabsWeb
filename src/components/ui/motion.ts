// Framer Motion spring presets — mirror of iOS Extension Animation presets.
// tabsSnap:   response=0.26  dampingFraction=0.70
// tabsSpring: response=0.36  dampingFraction=0.76
// tabsFluid:  response=0.46  dampingFraction=0.80
// tabsBounce: response=0.40  dampingFraction=0.60
//
// Framer Motion stiffness ≈ (2π / response)²  damping ≈ 2 * sqrt(stiffness) * df

export const spring = {
  snap: {
    type: 'spring' as const,
    stiffness: 580,
    damping: 28,
    mass: 1,
  },
  std: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 26,
    mass: 1,
  },
  fluid: {
    type: 'spring' as const,
    stiffness: 185,
    damping: 26,
    mass: 1,
  },
  bounce: {
    type: 'spring' as const,
    stiffness: 250,
    damping: 18,
    mass: 1,
  },
}

// Fade + scale entrance (used on cards, rows)
export const fadeUp = {
  initial: { opacity: 0, y: 12, scale: 0.98 },
  animate: { opacity: 1, y: 0,  scale: 1 },
  exit:    { opacity: 0, y: -6, scale: 0.98 },
  transition: spring.std,
}

// Slide-up sheet (mobile modal)
export const slideUp = {
  initial: { y: '100%', opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit:    { y: '100%', opacity: 0 },
  transition: spring.fluid,
}

// Scale pop (FAB items, badges)
export const scalePop = {
  initial: { scale: 0.7, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit:    { scale: 0.7, opacity: 0 },
  transition: spring.bounce,
}
