"use client";

import { useState } from "react";
import { Play, ShieldCheck, Film } from "lucide-react";

interface TutorVideoPlayerProps {
  videoUrl: string;
  tutorName: string;
  posterUrl?: string;
}

export default function TutorVideoPlayer({
  videoUrl,
  tutorName,
  posterUrl,
}: TutorVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div
      style={{
        background: "linear-gradient(145deg, #091a48, #021550)",
        borderRadius: 16,
        padding: "1.5rem",
        color: "white",
        boxShadow: "0 10px 30px -10px rgba(2, 21, 80, 0.35)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1rem",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: "rgba(190, 24, 93, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#f472b6",
            }}
          >
            <Film size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "white" }}>
              Demo Video & Introduction
            </h3>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "#94a3b8" }}>
              Watch {tutorName}&apos;s teaching style & communication
            </p>
          </div>
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            backgroundColor: "rgba(16, 185, 129, 0.15)",
            color: "#6ee7b7",
            padding: "0.3rem 0.75rem",
            borderRadius: 999,
            fontSize: "0.75rem",
            fontWeight: 600,
            border: "1px solid rgba(16, 185, 129, 0.3)",
          }}
        >
          <ShieldCheck size={14} />
          <span>Demo Video Verified</span>
        </div>
      </div>

      <div
        style={{
          position: "relative",
          width: "100%",
          paddingTop: "56.25%", // 16:9 Aspect Ratio
          borderRadius: 12,
          overflow: "hidden",
          backgroundColor: "#000",
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        }}
      >
        <video
          src={videoUrl}
          poster={posterUrl}
          controls
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            backgroundColor: "#050b1d",
          }}
        />
        {!isPlaying && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "radial-gradient(circle, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                backgroundColor: "rgba(200, 27, 127, 0.9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                boxShadow: "0 0 20px rgba(200, 27, 127, 0.6)",
              }}
            >
              <Play size={24} style={{ marginLeft: 3 }} />
            </div>
          </div>
        )}
      </div>

      <p
        style={{
          fontSize: "0.78rem",
          color: "#94a3b8",
          marginTop: "0.75rem",
          textAlign: "center",
          lineHeight: 1.4,
        }}
      >
        💡 <strong>Pro tip for students:</strong> Review the tutor&apos;s pronunciation, concept clarity, and teaching speed before booking your session.
      </p>
    </div>
  );
}
