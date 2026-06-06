import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import "./parent-modal.css";

export default function ParentModalPortal({ children }: { children: ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}
