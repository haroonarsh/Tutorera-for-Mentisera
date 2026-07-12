"use client";
import { useEffect, useRef } from "react";

const C = { primary: '#1a1a2e', gray500: '#6b7280' };

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleButtonProps {
  onToken: (idToken: string) => void;
  text?: "signin_with" | "signup_with" | "continue_with";
}

export default function GoogleButton({ onToken, text = "continue_with" }: GoogleButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set");
      return;
    }

    const initializeGoogle = () => {
      if (!window.google || !buttonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: { credential: string }) => {
          onToken(response.credential);
        },
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        width: 320,
        text,
        shape: "rectangular",
      });
    };

    if (window.google) {
      initializeGoogle();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      document.body.appendChild(script);
    }
  }, [onToken, text]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <div ref={buttonRef} />
    </div>
  );
}