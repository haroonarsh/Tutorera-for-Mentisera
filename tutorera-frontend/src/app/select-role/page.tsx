"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

export default function SelectRolePage() {
  const router = useRouter();
  const { selectRole, user, loading } = useAuth();
  const [role, setRole] = useState<"student" | "tutor" | "parent">("student");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await selectRole(role);
      setSuccess("Role selected successfully!");
      // Redirect to dashboard or appropriate page after selection
      router.replace("/dashboard");
    } catch (err) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setError(errorObj.response?.data?.message || "Failed to select role");
    }
  };

  if (user) {
    // If user is already logged in and has a role, redirect
    if (user.role !== "pending") {
      router.replace("/dashboard");
      return null;
    }
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      backgroundColor: "#F5F7FF", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      padding: "2rem 1rem" 
    }}>
      <div style={{ 
        backgroundColor: "white", 
        borderRadius: "1rem", 
        padding: "2.5rem", 
        width: "100%", 
        maxWidth: "400px", 
        textAlign: "center", 
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)" 
      }}>
        <h1 style={{ 
          fontSize: "1.5rem", 
          fontWeight: "700", 
          color: "#021550", 
          marginBottom: "1.5rem" 
        }}>
          Select Your Role
        </h1>
        
        <p style={{ 
          color: "#4b5563", 
          marginBottom: "1.5rem", 
          fontSize: "0.95rem" 
        }}>
          After signing in with Google, please select your role to continue.
        </p>
        
        <form onSubmit={handleSubmit} style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: "1rem", 
          marginBottom: "1.5rem"
        }}>
          <div>
            <label 
              style={{ 
                display: "block", 
                fontSize: "0.875rem", 
                fontWeight: "600", 
                color: "#021550", 
                marginBottom: "0.4rem" 
              }} 
            >
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "student" | "tutor" | "parent")}
              style={{ 
                width: "100%", 
                padding: "0.75rem 1rem", 
                border: "1.5px solid #e5e7eb", 
                borderRadius: "0.5rem", 
                fontSize: "0.9rem", 
                backgroundColor: "white", 
                color: "#021550"
              }}
            >
              <option value="student">Student</option>
              <option value="tutor">Tutor</option>
              <option value="parent">Parent</option>
            </select>
          </div>
          
          {error && (
            <div 
              role="alert" 
              style={{ 
                backgroundColor: "#fef2f2", 
                border: "1px solid #fecaca", 
                borderRadius: "0.5rem", 
                padding: "0.75rem 1rem", 
                marginBottom: "1rem", 
                color: "#dc2626", 
                fontSize: "0.875rem" 
              }}
            >
              {error}
            </div>
          )}
          
          {success && (
            <div 
              role="alert" 
              style={{ 
                backgroundColor: "#f0fdf4", 
                border: "1px solid #10b981", 
                borderRadius: "0.5rem", 
                padding: "0.75rem 1rem", 
                marginBottom: "1rem", 
                color: "#166534", 
                fontSize: "0.875rem" 
              }}
            >
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ 
              backgroundColor: "#0329b2", 
              color: "white", 
              padding: "0.75rem 1.5rem", 
              borderRadius: "0.5rem", 
              border: "none", 
              fontWeight: "600", 
              fontSize: "0.95rem", 
              cursor: loading ? "not-allowed" : "pointer", 
              transition: "background 0.2s",
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "Saving..." : "Continue"}
          </button>
        </form>
        
        <button
          type="button"
          onClick={() => router.back()}
          style={{ 
            backgroundColor: "#3b82f6", 
            color: "white", 
            padding: "0.75rem 1.5rem", 
            borderRadius: "0.5rem", 
            border: "none", 
            fontWeight: "600", 
            fontSize: "0.95rem", 
            cursor: "pointer", 
            transition: "background 0.2s"
          }}
        >
          Go Back
        </button>
      </div>
    </div>
  );
}