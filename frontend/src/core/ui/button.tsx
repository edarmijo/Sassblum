import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps } from "class-variance-authority";

import { cn } from "./utils";
import { buttonVariants } from "./button-variants";
import { useMagneticPointer } from "../hooks/useMagneticPointer";

function Button({
  className,
  variant,
  size,
  asChild = false,
  onPointerEnter,
  onPointerMove,
  onPointerLeave,
  onPointerCancel,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";
  const magnetic = useMagneticPointer<HTMLButtonElement>();

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      onPointerEnter={(event: React.PointerEvent<HTMLButtonElement>) => {
        magnetic.onPointerEnter(event);
        onPointerEnter?.(event);
      }}
      onPointerMove={(event: React.PointerEvent<HTMLButtonElement>) => {
        magnetic.onPointerMove(event);
        onPointerMove?.(event);
      }}
      onPointerLeave={(event: React.PointerEvent<HTMLButtonElement>) => {
        magnetic.onPointerLeave(event);
        onPointerLeave?.(event);
      }}
      onPointerCancel={(event: React.PointerEvent<HTMLButtonElement>) => {
        magnetic.onPointerCancel(event);
        onPointerCancel?.(event);
      }}
      {...props}
    />
  );
}

export { Button };
