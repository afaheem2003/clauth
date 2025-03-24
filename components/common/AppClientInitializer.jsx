"use client";

import { useEffect } from "react";
import Modal from "react-modal";

export default function AppClientInitializer() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      Modal.setAppElement("body");
    }
  }, []);

  return null;
}
