"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Side = "left" | "right";
type Phase = "finding" | "choosing" | "won" | "lost";

const TOTAL_SECONDS = 30;
const TOTAL_DIFFERENCES = 4;
const CORRECT_SIDE: Side = "left";

type Variant = {
  src: string;
  left: string;
  top: string;
  width: string;
  blend?: "screen" | "multiply";
  filter?: string;
};

type Hotspot = {
  cx: string;
  cy: string;
  r: string;
};

type Difference = {
  id: string;
  left: Variant;
  right: Variant;
  hotspots: Record<Side, Hotspot>;
};

const PAINTING_FILTER =
  "sepia(0.4) saturate(0.75) brightness(0.7) contrast(0.95)";
const CUP_FILTER =
  "sepia(0.35) saturate(0.7) brightness(0.75) contrast(0.95)";
const STAR_FILTER =
  "sepia(0.55) saturate(0.6) brightness(0.55) contrast(0.95)";
const LAMP_FILTER =
  "sepia(0.5) saturate(0.65) brightness(0.65) contrast(0.9)";

const DIFFERENCES: Difference[] = [
  {
    id: "painting",
    left: {
      src: "/painting-cropped.png",
      left: "7%",
      top: "21%",
      width: "12%",
      filter: PAINTING_FILTER,
    },
    right: {
      src: "/white-painting-cropped.png",
      left: "7%",
      top: "21%",
      width: "12%",
      filter: PAINTING_FILTER,
    },
    hotspots: {
      left: { cx: "13%", cy: "26%", r: "7%" },
      right: { cx: "13%", cy: "26%", r: "7%" },
    },
  },
  {
    id: "teacup",
    left: {
      src: "/teacup.png",
      left: "27%",
      top: "43%",
      width: "22%",
      blend: "screen",
      filter: CUP_FILTER,
    },
    right: {
      src: "/white-cup.png",
      left: "27%",
      top: "43%",
      width: "22%",
      blend: "screen",
      filter: CUP_FILTER,
    },
    hotspots: {
      left: { cx: "38%", cy: "52%", r: "8%" },
      right: { cx: "38%", cy: "52%", r: "8%" },
    },
  },
  {
    id: "star",
    left: {
      src: "/star.png",
      left: "2%",
      top: "72%",
      width: "14%",
      blend: "screen",
      filter: STAR_FILTER,
    },
    right: {
      src: "/star.png",
      left: "84%",
      top: "72%",
      width: "14%",
      blend: "screen",
      filter: STAR_FILTER,
    },
    hotspots: {
      left: { cx: "9%", cy: "79%", r: "7%" },
      right: { cx: "91%", cy: "79%", r: "7%" },
    },
  },
  {
    id: "lamp",
    left: {
      src: "/lamp-clear.png",
      left: "60%",
      top: "0%",
      width: "18%",
      filter: LAMP_FILTER,
    },
    right: {
      src: "/desk-lamp-clear.png",
      left: "43%",
      top: "70%",
      width: "14%",
      filter: LAMP_FILTER,
    },
    hotspots: {
      left: { cx: "69%", cy: "13%", r: "10%" },
      right: { cx: "50%", cy: "79%", r: "8%" },
    },
  },
];

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function DifferenceLayer({ variant }: { variant: Variant }) {
  return (
    <Image
      src={variant.src}
      alt=""
      width={400}
      height={400}
      className="absolute h-auto"
      style={{
        left: variant.left,
        top: variant.top,
        width: variant.width,
        mixBlendMode: variant.blend,
        filter: variant.filter,
        pointerEvents: "none",
      }}
    />
  );
}

function FoundCircle({ hotspot }: { hotspot: Hotspot }) {
  return (
    <div
      className="pointer-events-none absolute rounded-full"
      style={{
        left: `calc(${hotspot.cx} - ${hotspot.r})`,
        top: `calc(${hotspot.cy} - ${hotspot.r})`,
        width: `calc(${hotspot.r} * 2)`,
        height: `calc(${hotspot.r} * 2)`,
        border: "3px solid #ef4444",
        boxShadow:
          "0 0 0 1px rgba(0,0,0,0.4), 0 0 12px rgba(239,68,68,0.6)",
      }}
    />
  );
}

function ProgressLamp({ on }: { on: boolean }) {
  return (
    <span
      className="inline-block h-5 w-5 rounded-full border transition-all duration-300"
      style={
        on
          ? {
              background:
                "radial-gradient(circle at 30% 30%, #fff3a8 0%, #facc15 55%, #b45309 100%)",
              borderColor: "#fde68a",
              boxShadow:
                "0 0 14px 2px rgba(250, 204, 21, 0.9), inset 0 0 4px rgba(255,255,255,0.6)",
            }
          : {
              background: "rgba(82, 82, 91, 0.55)",
              borderColor: "rgba(255,255,255,0.35)",
              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.35)",
            }
      }
    />
  );
}

function isInsideHotspot(
  hotspot: Hotspot,
  xPercent: number,
  yPercent: number,
) {
  const cx = parseFloat(hotspot.cx);
  const cy = parseFloat(hotspot.cy);
  const r = parseFloat(hotspot.r);
  return Math.hypot(xPercent - cx, yPercent - cy) <= r;
}

export default function Home() {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [foundIds, setFoundIds] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<Phase>("finding");

  const foundCount = foundIds.size;

  useEffect(() => {
    if (phase === "finding" && foundCount >= TOTAL_DIFFERENCES) {
      setPhase("choosing");
    }
  }, [foundCount, phase]);

  useEffect(() => {
    if (phase !== "won") return;
    router.push("/cleared");
  }, [phase, router]);

  const timerRunning = phase === "finding" || phase === "choosing";
  const timerRunningRef = useRef(timerRunning);
  timerRunningRef.current = timerRunning;

  useEffect(() => {
    if (!timerRunning) return;
    const timerId = setInterval(() => {
      if (!timerRunningRef.current) return;
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(timerId);
  }, [timerRunning]);

  useEffect(() => {
    if (secondsLeft <= 0 && (phase === "finding" || phase === "choosing")) {
      setPhase("lost");
    }
  }, [secondsLeft, phase]);

  function handlePanelClick(
    side: Side,
    event: React.MouseEvent<HTMLDivElement>,
  ) {
    if (phase !== "finding") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const xPercent = ((event.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((event.clientY - rect.top) / rect.height) * 100;

    for (const difference of DIFFERENCES) {
      if (foundIds.has(difference.id)) continue;
      if (isInsideHotspot(difference.hotspots[side], xPercent, yPercent)) {
        setFoundIds((prev) => {
          const next = new Set(prev);
          next.add(difference.id);
          return next;
        });
        break;
      }
    }
  }

  function handleCheck(side: Side) {
    if (phase !== "choosing") return;
    setPhase(side === CORRECT_SIDE ? "won" : "lost");
  }

  function handleRestart() {
    setSecondsLeft(TOTAL_SECONDS);
    setFoundIds(new Set());
    setPhase("finding");
  }

  const headerText =
    phase === "finding"
      ? "請找出四處不同的地方，並找出正確的照片"
      : "請選出正確的照片";

  const showDimOverlay = phase === "choosing";

  return (
    <div
      className="relative flex min-h-screen w-full flex-col items-center"
      style={{
        backgroundImage: "url(/bg.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {showDimOverlay ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-black/45 transition-opacity duration-500"
        />
      ) : null}

      <div className="relative mx-auto w-full max-w-7xl px-6 py-8 sm:px-10">
        <header className="grid grid-cols-3 items-center">
          <div />
          <div className="text-center text-4xl font-semibold tracking-wide text-white drop-shadow-md">
            {formatTime(secondsLeft)}
          </div>
          <div className="flex justify-end gap-3">
            {Array.from({ length: TOTAL_DIFFERENCES }).map((_, index) => (
              <ProgressLamp key={index} on={index < foundCount} />
            ))}
          </div>
        </header>

        <p className="mt-3 text-center text-base text-white drop-shadow-md">
          {headerText}
        </p>

        <section className="mt-6 grid grid-cols-2 gap-8">
          {(["left", "right"] as const).map((side) => (
            <div
              key={side}
              className="relative aspect-square w-full overflow-hidden rounded-sm shadow-2xl ring-1 ring-black/30"
              style={{
                padding: "14px",
                background:
                  "linear-gradient(135deg, #f3e3c2 0%, #e7d2a8 50%, #c9a974 100%)",
                boxShadow:
                  "0 10px 30px rgba(0,0,0,0.45), inset 0 0 0 2px rgba(120,80,30,0.35), inset 0 0 18px rgba(0,0,0,0.25)",
              }}
            >
              <div
                className={`relative h-full w-full overflow-hidden rounded-[2px] ring-1 ring-black/20 ${
                  phase === "finding" ? "cursor-crosshair" : ""
                }`}
                onClick={(event) => handlePanelClick(side, event)}
              >
                <Image
                  src="/cafe.png"
                  alt={`cafe ${side}`}
                  fill
                  sizes="(max-width: 768px) 90vw, 640px"
                  className="object-cover"
                  priority
                />
                {DIFFERENCES.map((difference) => (
                  <DifferenceLayer
                    key={difference.id}
                    variant={difference[side]}
                  />
                ))}
                {DIFFERENCES.filter((difference) =>
                  foundIds.has(difference.id),
                ).map((difference) => (
                  <FoundCircle
                    key={difference.id}
                    hotspot={difference.hotspots[side]}
                  />
                ))}

                {phase === "choosing" ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleCheck(side);
                    }}
                    className="absolute left-1/2 bottom-[10%] -translate-x-1/2 rounded-md bg-zinc-800/90 px-12 py-3 text-xl font-semibold text-white shadow-lg ring-1 ring-black/40 backdrop-blur-sm transition hover:bg-zinc-700 active:scale-95"
                  >
                    Check
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </section>

      </div>

      {phase === "lost" ? (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm">
          <div
            className="text-[10rem] font-black uppercase leading-none tracking-widest text-red-600"
            style={{
              textShadow:
                "0 0 24px rgba(220,38,38,0.9), 0 6px 14px rgba(0,0,0,0.7)",
              WebkitTextStroke: "3px rgba(0,0,0,0.45)",
            }}
          >
            FAIL
          </div>
          <button
            type="button"
            onClick={handleRestart}
            className="mt-12 rounded-md bg-[#6f4e37] px-10 py-3 text-xl font-semibold text-white shadow-lg ring-1 ring-black/40 hover:bg-[#5a3f2c] active:scale-95"
          >
            再玩一次
          </button>
        </div>
      ) : null}
    </div>
  );
}
