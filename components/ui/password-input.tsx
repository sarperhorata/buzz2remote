"use client";

import { useState, forwardRef } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface PasswordInputProps
  extends Omit<React.ComponentProps<typeof Input>, "type"> {
  /** Hide the toggle button (e.g. inside a form where show/hide isn't useful). */
  hideToggle?: boolean;
}

/**
 * Password input with a show/hide eye toggle on the right edge.
 * Drop-in replacement for `<Input type="password" />`.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ className, hideToggle, ...props }, ref) {
    const [visible, setVisible] = useState(false);

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          className={cn(hideToggle ? "" : "pr-10", className)}
          {...props}
        />
        {!hideToggle && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={visible ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
    );
  }
);
