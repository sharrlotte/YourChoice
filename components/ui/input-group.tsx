import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const InputGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex w-full flex-col rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 overflow-hidden", className)}
        {...props}
      />
    )
  }
)
InputGroup.displayName = "InputGroup"

const InputGroupInput = React.forwardRef<HTMLInputElement, React.ComponentProps<typeof Input>>(
  ({ className, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        className={cn("border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none rounded-none", className)}
        {...props}
      />
    )
  }
)
InputGroupInput.displayName = "InputGroupInput"

const InputGroupTextarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<typeof Textarea>>(
  ({ className, ...props }, ref) => {
    return (
      <Textarea
        ref={ref}
        className={cn("min-h-[80px] w-full resize-none border-0 bg-transparent p-3 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none", className)}
        {...props}
      />
    )
  }
)
InputGroupTextarea.displayName = "InputGroupTextarea"

const InputGroupAddon = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { align?: "start" | "end" | "block-end" }>(
  ({ className, align = "end", ...props }, ref) => {
    if (align === "block-end") {
        return (
            <div
                ref={ref}
                className={cn(
                  "flex items-center p-2 border-t bg-muted/20 justify-between",
                  className
                )}
                {...props}
              />
        )
    }
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center p-2",
          className
        )}
        {...props}
      />
    )
  }
)
InputGroupAddon.displayName = "InputGroupAddon"

const InputGroupText = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn("text-xs text-muted-foreground", className)}
        {...props}
      />
    )
  }
)
InputGroupText.displayName = "InputGroupText"

const InputGroupButton = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>(
  ({ className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn("", className)}
        {...props}
      />
    )
  }
)
InputGroupButton.displayName = "InputGroupButton"

export {
  InputGroup,
  InputGroupInput,
  InputGroupTextarea,
  InputGroupAddon,
  InputGroupText,
  InputGroupButton
}
