import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const FieldGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-4", className)}
        {...props}
      />
    )
  }
)
FieldGroup.displayName = "FieldGroup"

const Field = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-2", className)}
        {...props}
      />
    )
  }
)
Field.displayName = "Field"

const FieldLabel = React.forwardRef<React.ElementRef<typeof Label>, React.ComponentPropsWithoutRef<typeof Label>>(
  ({ className, ...props }, ref) => {
    return (
      <Label
        ref={ref}
        className={cn("", className)}
        {...props}
      />
    )
  }
)
FieldLabel.displayName = "FieldLabel"

const FieldDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn("text-xs text-muted-foreground", className)}
        {...props}
      />
    )
  }
)
FieldDescription.displayName = "FieldDescription"

export {
  FieldGroup,
  Field,
  FieldLabel,
  FieldDescription
}
