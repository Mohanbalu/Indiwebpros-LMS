import React, { useRef, useEffect, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2, ShieldAlert, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface VideoPlayerPanelProps {
  videoUrl: string;
  initialPosition: number;
  onProgress: (position: number, duration: number) => void;
  onTimeUpdate?: (currentTime: number) => void;
}

export function VideoPlayerPanel({
  videoUrl,
  initialPosition,
  onProgress,
  onTimeUpdate,
}: VideoPlayerPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const lastLoggedRef = useRef<number>(0);

  useEffect(() => {
    // Reset state on URL change
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    lastLoggedRef.current = 0;
  }, [videoUrl]);

  // Set initial seek position when video metadata loads
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      if (initialPosition > 0 && initialPosition < videoRef.current.duration) {
        videoRef.current.currentTime = initialPosition;
        setCurrentTime(initialPosition);
      }
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    setCurrentTime(current);
    onTimeUpdate?.(current);

    // Save/sync progress every 5 seconds to reduce API load
    if (Math.abs(current - lastLoggedRef.current) >= 5) {
      lastLoggedRef.current = current;
      onProgress(Math.floor(current), Math.floor(duration));
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    // Mark as completed immediately at the end of the video
    onProgress(Math.floor(duration), Math.floor(duration));
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const seekTime = parseFloat(e.target.value);
    videoRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const val = parseFloat(e.target.value);
    setVolume(val);
    videoRef.current.volume = val;
    setIsMuted(val === 0);
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="relative group bg-black rounded-3xl border border-zinc-200 dark:border-zinc-800/80 overflow-hidden aspect-video shadow-lg max-w-4xl mx-auto flex flex-col justify-end">
      {videoUrl ? (
        <>
          <video
            ref={videoRef}
            src={videoUrl}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            onClick={togglePlay}
            className="w-full h-full object-contain cursor-pointer play-video-btn"
          />

          {/* Premium Video Controls Bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col gap-3">
            {/* Timeline Progress Slider */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-white/90">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-[10px] font-bold text-white/90">
                {formatTime(duration)}
              </span>
            </div>

            {/* Buttons Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={togglePlay}
                  className="text-white hover:text-blue-400 transition focus:outline-none play-video-btn"
                >
                  {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
                </button>

                <div className="flex items-center gap-2 group/volume">
                  <button
                    onClick={toggleMute}
                    className="text-white hover:text-blue-400 transition focus:outline-none"
                  >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500 opacity-0 group-hover/volume:opacity-100 transition-opacity"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={handleFullscreen}
                  className="text-white hover:text-blue-400 transition focus:outline-none"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-zinc-400 bg-zinc-900">
          <ShieldAlert className="h-10 w-10 text-zinc-550 mb-3 animate-pulse" />
          <p className="text-xs font-bold">Failed to load video file</p>
          <p className="text-[10px] text-zinc-500 mt-1">The signed resource URL is missing or has expired.</p>
        </div>
      )}
    </div>
  );
}
