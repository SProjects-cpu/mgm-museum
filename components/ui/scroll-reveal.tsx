"use client";

import React, { useEffect, useRef, useMemo, ReactNode, RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps {
  children: ReactNode;
  scrollContainerRef?: RefObject<HTMLElement>;
  enableBlur?: boolean;
  baseOpacity?: number;
  baseRotation?: number;
  blurStrength?: number;
  containerClassName?: string;
  textClassName?: string;
  rotationEnd?: string;
  wordAnimationEnd?: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'div';
}

const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  scrollContainerRef,
  enableBlur = true,
  baseOpacity = 0.1,
  baseRotation = 3,
  blurStrength = 4,
  containerClassName = '',
  textClassName = '',
  rotationEnd = 'bottom bottom',
  wordAnimationEnd = 'bottom bottom',
  as = 'h2',
}) => {
  const containerRef = useRef<HTMLElement>(null);

  const splitText = useMemo(() => {
    const text = typeof children === 'string' ? children : '';
    return text.split(/(\s+)/).map((word, index) => {
      if (word.match(/^\s+$/)) return word;
      return (
        <span className="word" key={index}>
          {word}
        </span>
      );
    });
  }, [children]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const scroller =
      scrollContainerRef && scrollContainerRef.current
        ? scrollContainerRef.current
        : window;

    // Only add rotation if baseRotation is not 0
    if (baseRotation !== 0) {
      gsap.fromTo(
        el,
        { transformOrigin: '0% 50%', rotate: baseRotation },
        {
          ease: 'none',
          rotate: 0,
          scrollTrigger: {
            trigger: el,
            scroller,
            start: 'top 80%',
            end: 'top 30%',
            scrub: 1,
          },
        }
      );
    }

    // Word opacity animation with stagger
    const wordElements = el.querySelectorAll<HTMLElement>('.word');
    gsap.fromTo(
      wordElements,
      { opacity: baseOpacity, willChange: 'opacity' },
      {
        ease: 'none',
        opacity: 1,
        stagger: {
          each: 0.02,
          from: 'start',
        },
        scrollTrigger: {
          trigger: el,
          scroller,
          start: 'top 80%',
          end: 'top 20%',
          scrub: 1,
        },
      }
    );

    // Blur animation with stagger
    if (enableBlur) {
      gsap.fromTo(
        wordElements,
        { filter: `blur(${blurStrength}px)`, willChange: 'filter' },
        {
          ease: 'none',
          filter: 'blur(0px)',
          stagger: {
            each: 0.02,
            from: 'start',
          },
          scrollTrigger: {
            trigger: el,
            scroller,
            start: 'top 80%',
            end: 'top 20%',
            scrub: 1,
          },
        }
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [
    scrollContainerRef,
    enableBlur,
    baseRotation,
    baseOpacity,
    rotationEnd,
    wordAnimationEnd,
    blurStrength,
  ]);

  const Component = as;

  return (
    <Component
      ref={containerRef as any}
      className={`scroll-reveal ${containerClassName}`}
    >
      <span className={`scroll-reveal-text ${textClassName}`}>{splitText}</span>
    </Component>
  );
};

export default ScrollReveal;
