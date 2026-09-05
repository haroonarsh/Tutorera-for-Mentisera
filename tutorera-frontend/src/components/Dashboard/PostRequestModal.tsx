"use client";

import { useFocusTrap } from "@/hooks/useFocusTrap";
import RequestWizard from "../marketplace/RequestWizard";
import styles from "./PostRequestModal.module.css";

type Props = { 
  onClose: () => void; 
  onSuccess: () => void;
  initialMode?: "online" | "in-person" | "both";
};

export default function PostRequestModal({ onClose, onSuccess, initialMode = "both" }: Props) {
  const modalRef = useFocusTrap(true, onClose);

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Post a tuition request">
      <div 
        ref={modalRef} 
        className={styles.modal} 
        style={{ maxWidth: 760, maxHeight: "92vh", overflowY: "auto", padding: 0, border: "none" }}
      >
        <RequestWizard 
          isModal 
          onClose={onClose} 
          onSuccess={() => {
            onSuccess();
            onClose();
          }} 
          initialMode={initialMode}
        />
      </div>
    </div>
  );
}
