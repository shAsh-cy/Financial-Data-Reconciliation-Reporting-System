/**
 * Input — MUI TextField wrapper preserving native input props for legacy form usage.
 */

import type React from "react";
import { TextField } from "@mui/material";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({
  className,
  value,
  onChange,
  type,
  placeholder,
  disabled,
  autoComplete,
  name,
  id,
  ...rest
}: InputProps) {
  return (
    <TextField
      size="small"
      fullWidth
      {...(className !== undefined ? { className } : {})}
      value={value ?? ""}
      {...(onChange !== undefined ? { onChange } : {})}
      {...(type !== undefined ? { type } : {})}
      {...(placeholder !== undefined ? { placeholder } : {})}
      {...(disabled !== undefined ? { disabled } : {})}
      {...(name !== undefined ? { name } : {})}
      {...(id !== undefined ? { id } : {})}
      slotProps={{
        htmlInput: { ...(autoComplete !== undefined ? { autoComplete } : {}), ...rest },
      }}
    />
  );
}
