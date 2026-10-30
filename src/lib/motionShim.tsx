import React, { forwardRef } from 'react';

// Discard all framer-motion specific animation and layout props
// while preserving standard HTML attributes, className, style, onClick, etc.
const MOTION_PROP_KEYS = new Set([
  'initial',
  'animate',
  'exit',
  'transition',
  'variants',
  'whileHover',
  'whileTap',
  'whileFocus',
  'whileInView',
  'whileDrag',
  'layout',
  'layoutId',
  'layoutDependency',
  'layoutScroll',
  'onAnimationStart',
  'onAnimationComplete',
  'onUpdate',
  'onLayoutAnimationStart',
  'onLayoutAnimationComplete',
  'drag',
  'dragConstraints',
  'dragElastic',
  'dragMomentum',
  'dragPropagation',
  'dragTransition',
  'onDrag',
  'onDragStart',
  'onDragEnd',
  'viewport',
  'transformTemplate',
  'custom',
  'inherit'
]);

function createMotionComponent(tag: string) {
  const Component = forwardRef<any, any>((props, ref) => {
    const cleanProps: any = ref ? { ref } : {};
    for (const key in props) {
      if (!MOTION_PROP_KEYS.has(key)) {
        cleanProps[key] = props[key];
      }
    }
    return React.createElement(tag, cleanProps);
  });
  Component.displayName = `motion.${tag}`;
  return Component;
}

const componentCache: Record<string, any> = {};

export const motion: any = new Proxy({}, {
  get: (_target, prop: string) => {
    if (typeof prop !== 'string') return undefined;
    if (!componentCache[prop]) {
      componentCache[prop] = createMotionComponent(prop);
    }
    return componentCache[prop];
  }
});

export const m = motion;

export const AnimatePresence: React.FC<{ children?: React.ReactNode; mode?: string; initial?: boolean }> = ({ children }) => {
  return <>{children}</>;
};

export const MotionConfig: React.FC<{ children?: React.ReactNode; [key: string]: any }> = ({ children }) => {
  return <>{children}</>;
};

export default motion;
