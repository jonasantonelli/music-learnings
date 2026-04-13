"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { NOTE_NAMES_FLAT } from "@/lib/music";

const SEGMENT_COUNT = 12;
const SEGMENT_ANGLE = (2 * Math.PI) / SEGMENT_COUNT;
const SPIN_DURATION = 3000;
const STORAGE_KEY = "practice-daily-note";

const SEGMENT_COLORS = [
  "hsl(0, 70%, 65%)",
  "hsl(30, 70%, 60%)",
  "hsl(50, 70%, 55%)",
  "hsl(80, 60%, 50%)",
  "hsl(120, 50%, 50%)",
  "hsl(160, 55%, 50%)",
  "hsl(190, 60%, 50%)",
  "hsl(210, 65%, 60%)",
  "hsl(240, 55%, 65%)",
  "hsl(270, 55%, 65%)",
  "hsl(300, 50%, 60%)",
  "hsl(330, 60%, 62%)",
];

interface StoredSpin {
  note: string;
  noteIndex: number;
  rotation: number;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function drawWheel(
  ctx: CanvasRenderingContext2D,
  size: number,
  rotation: number,
  accentColor: string,
) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 24;

  ctx.clearRect(0, 0, size, size);

  // Draw segments
  for (let i = 0; i < SEGMENT_COUNT; i++) {
    const startAngle = i * SEGMENT_ANGLE + rotation;
    const endAngle = startAngle + SEGMENT_ANGLE;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = SEGMENT_COLORS[i];
    ctx.fill();

    // Segment border
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Note label
    const midAngle = startAngle + SEGMENT_ANGLE / 2;
    const labelRadius = radius * 0.7;
    const lx = cx + Math.cos(midAngle) * labelRadius;
    const ly = cy + Math.sin(midAngle) * labelRadius;

    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(midAngle + Math.PI / 2);
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 3;
    ctx.font = `bold ${size * 0.045}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(NOTE_NAMES_FLAT[i], 0, 0);
    ctx.restore();
  }

  // Center circle
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.15, 0, 2 * Math.PI);
  ctx.fillStyle = accentColor;
  ctx.shadowColor = "rgba(0,0,0,0.2)";
  ctx.shadowBlur = 4;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Pointer at 12 o'clock (top center)
  const pointerSize = 14;
  const pointerY = cy - radius - 4;
  ctx.beginPath();
  ctx.moveTo(cx, pointerY + pointerSize + 4);
  ctx.lineTo(cx - pointerSize * 0.6, pointerY - 2);
  ctx.lineTo(cx + pointerSize * 0.6, pointerY - 2);
  ctx.closePath();
  ctx.fillStyle = accentColor;
  ctx.fill();
}

export function NoteWheel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const animFrameRef = useRef<number>(0);
  const sizeRef = useRef(360);

  const getAccentColor = useCallback(() => {
    if (typeof window === "undefined") return "#6e56cf";
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue("--accent-9")
      .trim();
    return v || "#6e56cf";
  }, []);

  const paint = useCallback(
    (rot: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      drawWheel(ctx, sizeRef.current, rot, getAccentColor());
    },
    [getAccentColor],
  );

  // Mount: set up canvas DPR and restore state
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const size = sizeRef.current;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);

    // Restore from localStorage
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored: StoredSpin = JSON.parse(raw);
        setRotation(stored.rotation);
        setResult(stored.note);
        drawWheel(ctx!, size, stored.rotation, getAccentColor());
        setMounted(true);
        return;
      }
    } catch {
      // ignore
    }

    drawWheel(ctx!, size, 0, getAccentColor());
    setMounted(true);
  }, [getAccentColor]);

  // Repaint on theme change
  useEffect(() => {
    if (!mounted) return;
    const observer = new MutationObserver(() => paint(rotation));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "style"],
    });
    return () => observer.disconnect();
  }, [mounted, rotation, paint]);

  const spin = useCallback(() => {
    if (spinning) return;

    const targetIndex = Math.floor(Math.random() * 12);
    // Pointer is at -PI/2 (top). We need the segment center to align there.
    const segmentCenterOffset = targetIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
    const extraTurns = (5 + Math.floor(Math.random() * 4)) * 2 * Math.PI;
    const targetRotation = -segmentCenterOffset - Math.PI / 2 + extraTurns;

    const startRotation = rotation;
    const startTime = performance.now();

    setSpinning(true);

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / SPIN_DURATION, 1);
      const eased = easeOutCubic(t);
      const current = startRotation + (targetRotation - startRotation) * eased;

      paint(current);
      setRotation(current);

      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Spin complete
        const note = NOTE_NAMES_FLAT[targetIndex];
        setResult(note);
        setSpinning(false);

        const stored: StoredSpin = {
          note,
          noteIndex: targetIndex,
          rotation: current,
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
          window.dispatchEvent(new Event("practice-note-updated"));
        } catch {
          // ignore
        }
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  }, [spinning, rotation, paint]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const canSpin = mounted && !spinning;

  return (
    <div className="flex flex-col items-center gap-8">
      <canvas
        ref={canvasRef}
        onClick={canSpin ? spin : undefined}
        className={canSpin ? "cursor-pointer" : "cursor-default"}
        role="img"
        aria-label={
          result
            ? `Spinning wheel landed on ${result}`
            : "Spinning wheel with 12 musical notes. Click to spin."
        }
      />

      <div className="text-center" aria-live="polite">
        {result ? (
          <>
            <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
              Practice note
            </p>
            <p className="mt-2 text-6xl font-bold text-accent-11">{result}</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Tap the wheel to spin again
            </p>
          </>
        ) : mounted ? (
          <p className="text-muted-foreground">
            Tap the wheel to pick a note
          </p>
        ) : null}
      </div>
    </div>
  );
}
