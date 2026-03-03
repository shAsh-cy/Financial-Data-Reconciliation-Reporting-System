import type React from "react";

import styles from "./Button.module.css";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary";
};

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  const classes = [
    styles.button,
    variant === "primary" ? styles.primary : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return <button className={classes} {...props} />;
}

