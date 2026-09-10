import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "btn-chunky bg-primary text-primary-foreground font-semibold hover:btn-chunky-hover active:btn-chunky-press",
        destructive:
          "btn-chunky bg-destructive text-destructive-foreground font-semibold hover:btn-chunky-hover active:btn-chunky-press",
        outline:
          "rounded-2xl border-2 border-foreground/15 bg-background font-semibold hover:bg-accent hover:text-accent-foreground hover:-translate-y-0.5 active:translate-y-0 transition-transform",
        secondary:
          "btn-chunky bg-secondary text-secondary-foreground font-semibold hover:btn-chunky-hover active:btn-chunky-press",
        coral:
          "btn-chunky bg-coral text-coral-foreground font-bold uppercase tracking-wide hover:btn-chunky-hover active:btn-chunky-press",
        teal: "btn-chunky bg-teal text-teal-foreground font-bold uppercase tracking-wide hover:btn-chunky-hover active:btn-chunky-press",
        sun: "btn-chunky bg-sun text-sun-foreground font-bold uppercase tracking-wide hover:btn-chunky-hover active:btn-chunky-press",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2 rounded-2xl",
        sm: "h-9 px-4 text-xs rounded-xl",
        lg: "h-14 px-8 text-lg rounded-2xl",
        xl: "h-16 px-10 text-xl rounded-3xl",
        icon: "h-11 w-11 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
