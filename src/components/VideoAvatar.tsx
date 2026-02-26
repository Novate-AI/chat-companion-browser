import { useRef, useEffect, useCallback } from "react";

interface VideoAvatarProps {
  startTime: number;
  endTime: number;
  loop?: boolean;
  onSegmentEnd?: () => void;
}

export function VideoAvatar({ startTime, endTime, loop = false, onSegmentEnd }: VideoAvatarProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onSegmentEndRef = useRef(onSegmentEnd);
  const firedRef = useRef(false);

  useEffect(() => {
    onSegmentEndRef.current = onSegmentEnd;
  }, [onSegmentEnd]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    firedRef.current = false;
    video.currentTime = startTime;
    video.play().catch(() => {});

    let rafId: number;

    const tick = () => {
      if (!video) return;
      if (video.currentTime >= endTime - 0.05) {
        if (loop) {
          video.currentTime = startTime;
        } else {
          video.pause();
          if (!firedRef.current) {
            firedRef.current = true;
            onSegmentEndRef.current?.();
          }
          return; // stop polling
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [startTime, endTime, loop]);

  return (
    <div className="w-full aspect-[2/3] rounded-2xl overflow-hidden bg-black shadow-lg">
      <video
        ref={videoRef}
        src="/videos/novate-abby.mp4"
        playsInline
        muted={false}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
