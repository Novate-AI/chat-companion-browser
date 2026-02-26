import { useRef, useEffect } from "react";

interface VideoAvatarProps {
  startTime: number;
  endTime: number;
  loop?: boolean;
  onSegmentEnd?: () => void;
}

export function VideoAvatar({ startTime, endTime, loop = false, onSegmentEnd }: VideoAvatarProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const segmentRef = useRef({ startTime, endTime, loop });

  // Update ref when props change to avoid stale closures
  useEffect(() => {
    segmentRef.current = { startTime, endTime, loop };
  }, [startTime, endTime, loop]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = startTime;
    video.play().catch(() => {});

    const handleTimeUpdate = () => {
      const { startTime: st, endTime: et, loop: shouldLoop } = segmentRef.current;
      if (video.currentTime >= et) {
        if (shouldLoop) {
          video.currentTime = st;
        } else {
          video.pause();
          onSegmentEnd?.();
        }
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTime, endTime, loop]);

  return (
    <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-lg">
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
