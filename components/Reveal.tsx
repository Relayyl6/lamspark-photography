import React from "react";

type RevealVariant = "up" | "down" | "left" | "right" | "fade" | "scale" | "blur";

interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: RevealVariant;
  delay?: number;
  duration?: "fast" | "normal" | "slow";
  as?: React.ElementType;
}

export function Reveal({
  children,
  variant = "up",
  delay,
  duration = "normal",
  className = "",
  as: Component = "div",
  ...props
}: RevealProps) {
  const variantClass =
    variant === "up"
      ? "reveal-up"
      : variant === "down"
      ? "reveal-down"
      : variant === "left"
      ? "reveal-left"
      : variant === "right"
      ? "reveal-right"
      : variant === "scale"
      ? "reveal-scale"
      : variant === "blur"
      ? "reveal-blur"
      : "reveal";

  const durationClass =
    duration === "fast"
      ? "duration-fast"
      : duration === "slow"
      ? "duration-slow"
      : "duration-normal";

  const style = delay ? { transitionDelay: `${delay}ms`, ...props.style } : props.style;

  return (
    <Component
      className={`${variantClass} ${durationClass} ${className}`.trim()}
      data-reveal={variant}
      data-delay={delay}
      style={style}
      {...props}
    >
      {children}
    </Component>
  );
}

interface RevealGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  stagger?: number;
  as?: React.ElementType;
}

export function RevealGroup({
  children,
  className = "",
  as: Component = "div",
  ...props
}: RevealGroupProps) {
  return (
    <Component
      className={`reveal-group ${className}`.trim()}
      data-stagger="true"
      {...props}
    >
      {children}
    </Component>
  );
}
