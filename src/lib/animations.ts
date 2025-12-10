export const spring = {
  type: "spring",
  stiffness: 300,
  damping: 30,
} as const;

export const softSpring = {
  type: "spring",
  stiffness: 200,
  damping: 25,
} as const;

export const bouncySpring = {
  type: "spring",
  stiffness: 400,
  damping: 20,
} as const;

export const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: softSpring,
};

export const slideInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: softSpring,
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: spring,
};

export const listItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: softSpring },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

export const containerStagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  },
  exit: { opacity: 0 }
};
