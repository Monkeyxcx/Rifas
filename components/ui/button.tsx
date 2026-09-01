import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-sans font-semibold text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-rose/60 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] select-none",
  {
    variants: {
      variant: {
        default:
          "bg-brand-rose text-white hover:bg-[#E02148] shadow-cta",
        primary:
          "bg-brand-rose text-white hover:bg-[#E02148] shadow-cta",
        gradient:
          "bg-gradient-cta text-white shadow-cta hover:brightness-110",
        secondary:
          "bg-transparent text-brand-rose border-2 border-brand-rose hover:bg-rose-50",
        outline:
          "border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 hover:border-slate-300",
        ghost: "hover:bg-slate-100 text-slate-700 hover:text-slate-900",
        success: "bg-success text-white hover:brightness-110",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link: "text-brand-rose underline-offset-4 hover:underline p-0 h-auto"
      },
      size: {
        sm: "h-9 px-4",
        default: "h-11 px-6 text-base",
        lg: "h-14 px-8 text-lg",
        icon: "h-10 w-10 p-0"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
