
export const prismMotion = {
  variants: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeIn"
      },
    },
  },
};

export const fadeFooter = {
  variants:{
      hidden: {
        opacity: 0,
        y: 30,
      },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.6,
          ease: [0.16, 1, 0.3, 1],
          delayChildren: 0.05,
        },
      },
  }
}

export const fadeFromLeft = {
  variants: {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: "easeIn",
        delay: 0.1
      }
    }
  }
};

export const fadeFromRight = {
  variants: {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: "easeIn",
        delay: 0.4
      }
    }
  }
};
export const appear = {
  variants: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: "easeIn",
        delay: 0.1
      }
    }
  }
};

export const gridVariants = {
  hidden: {opacity:0.8},
  visible: {
    opacity:1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.97,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};