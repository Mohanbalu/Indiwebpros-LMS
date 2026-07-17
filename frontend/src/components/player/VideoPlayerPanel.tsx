import React, { useRef, useEffect, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2, ShieldAlert, RotateCcw, RotateCw, Settings } from "lucide-react";

const getBaseUrl = (url: string) => {
  if (!url) return "";
  try {
    const urlObj = new URL(url);
    return `${urlObj.origin}${urlObj.pathname}`;
  } catch (e) {
    return url.split("?")[0];
  }
};

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
  const containerRef = useRef<HTMLDivElement>(null);
  const baseVideoUrl = getBaseUrl(videoUrl);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showCenterIcon, setShowCenterIcon] = useState<"play" | "pause" | "skip-forward" | "skip-backward" | null>(null);
  
  const lastLoggedRef = useRef<number>(0);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Reset state on URL change
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setPlaybackSpeed(1);
    lastLoggedRef.current = 0;
  }, [baseVideoUrl]);

  // Handle controls visibility timeout
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setShowSpeedMenu(false);
      }, 2500);
    }
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const d = videoRef.current.duration;
      if (d && !isNaN(d) && d !== Infinity) {
        setDuration(d);
      }
      videoRef.current.playbackRate = playbackSpeed;
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
      triggerCenterAnimation("pause");
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
      triggerCenterAnimation("play");
    }
  };

  const triggerCenterAnimation = (type: "play" | "pause" | "skip-forward" | "skip-backward") => {
    setShowCenterIcon(type);
    setTimeout(() => setShowCenterIcon(null), 500);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    setCurrentTime(current);
    onTimeUpdate?.(current);

    // Dynamic duration backup update
    const d = videoRef.current.duration;
    if (d && !isNaN(d) && d !== Infinity && d !== duration) {
      setDuration(d);
    }

    // Save/sync progress every 5 seconds to reduce API load
    if (Math.abs(current - lastLoggedRef.current) >= 5) {
      lastLoggedRef.current = current;
      onProgress(Math.floor(current), Math.floor(d || duration));
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    const d = videoRef.current?.duration || duration;
    onProgress(Math.floor(d), Math.floor(d));
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
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen().catch(() => {});
    }
  };

  const handleSpeedChange = (rate: number) => {
    console.log("Setting playbackRate to:", rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackSpeed(rate);
    }
    setShowSpeedMenu(false);
  };

  const handleRateChange = () => {
    if (videoRef.current) {
      console.log("onRateChange fired. Current rate in video tag:", videoRef.current.playbackRate, "Target:", playbackSpeed);
      if (videoRef.current.playbackRate !== playbackSpeed) {
        videoRef.current.playbackRate = playbackSpeed;
      }
    }
  };

  // Keep playback speed in sync with state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, baseVideoUrl]);

  // Fail-safe interval checks to force playbackRate even if browser overrides it
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      if (videoRef.current && videoRef.current.playbackRate !== playbackSpeed) {
        console.log(`Interval Syncer: Restoring playback rate from ${videoRef.current.playbackRate} to ${playbackSpeed}`);
        videoRef.current.playbackRate = playbackSpeed;
      }
    }, 500);
    return () => clearInterval(interval);
  }, [playbackSpeed, isPlaying]);

  const skipTime = (secs: number) => {
    if (!videoRef.current) return;
    let newTime = videoRef.current.currentTime + secs;
    if (newTime < 0) newTime = 0;
    if (newTime > duration) newTime = duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    triggerCenterAnimation(secs > 0 ? "skip-forward" : "skip-backward");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Keyboard shortcut listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) return;

      switch (e.key.toLowerCase()) {
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "arrowleft":
          e.preventDefault();
          skipTime(-10);
          break;
        case "arrowright":
          e.preventDefault();
          skipTime(10);
          break;
        case "f":
          e.preventDefault();
          handleFullscreen();
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, duration, isMuted, volume]);

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onContextMenu={(e) => e.preventDefault()}
      className="relative group bg-black rounded-3xl border border-zinc-800/80 overflow-hidden aspect-video shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-w-4xl mx-auto flex flex-col justify-end select-none"
    >
      {videoUrl ? (
        <>
          {/* Native HTML5 Video Element (Controls completely hidden to prevent dual overlays) */}
          <video
            ref={videoRef}
            src={videoUrl}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            onClick={togglePlay}
            onRateChange={handleRateChange}
            onDurationChange={() => {
              if (videoRef.current) {
                const d = videoRef.current.duration;
                if (d && !isNaN(d) && d !== Infinity) setDuration(d);
              }
            }}
            controls={false}
            playsInline
            preload="auto"
            disablePictureInPicture
            controlsList="nodownload"
            className="w-full h-full object-contain cursor-pointer"
          />

          {/* Fading Play/Pause Center Indicator */}
          {showCenterIcon && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="p-5 rounded-full bg-black/60 backdrop-blur-sm border border-zinc-800/40 text-blue-400 animate-ping duration-300">
                {showCenterIcon === "play" && <Play className="h-10 w-10 fill-current" />}
                {showCenterIcon === "pause" && <Pause className="h-10 w-10 fill-current" />}
                {showCenterIcon === "skip-forward" && <RotateCw className="h-10 w-10" />}
                {showCenterIcon === "skip-backward" && <RotateCcw className="h-10 w-10" />}
              </div>
            </div>
          )}

          {/* Premium Video Controls Bar */}
          <div 
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-6 flex flex-col gap-4 transition-all duration-300 transform z-20 ${
              showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
            }`}
          >
            {/* Timeline Progress Slider */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black tracking-widest text-zinc-350 min-w-[32px] text-right">
                {formatTime(currentTime)}
              </span>
              <div className="relative flex-1 group/slider flex items-center h-4 cursor-pointer">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:h-1.5 transition-all outline-none"
                />
              </div>
              <span className="text-[10px] font-black tracking-widest text-zinc-350 min-w-[32px]">
                {formatTime(duration)}
              </span>
            </div>

            {/* Buttons & Controls Row */}
            <div className="flex items-center justify-between">
              {/* Playback Controls */}
              <div className="flex items-center gap-5">
                <button
                  onClick={() => skipTime(-10)}
                  className="text-zinc-400 hover:text-white transition focus:outline-none"
                  title="Rewind 10s (Left Arrow)"
                >
                  <RotateCcw className="h-4.5 w-4.5" />
                </button>

                <button
                  onClick={togglePlay}
                  className="p-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none"
                  title={isPlaying ? "Pause (Space)" : "Play (Space)"}
                >
                  {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
                </button>

                <button
                  onClick={() => skipTime(10)}
                  className="text-zinc-400 hover:text-white transition focus:outline-none"
                  title="Forward 10s (Right Arrow)"
                >
                  <RotateCw className="h-4.5 w-4.5" />
                </button>

                {/* Volume bar with expanded slider */}
                <div className="flex items-center gap-2 group/volume ml-2">
                  <button
                    onClick={toggleMute}
                    className="text-zinc-400 hover:text-white transition focus:outline-none"
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
                    className="w-0 opacity-0 group-hover/volume:w-16 group-hover/volume:opacity-100 transition-all duration-300 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Utility Settings & Fullscreen Controls */}
              <div className="flex items-center gap-5 relative">
                {/* Playback Rate Speed Selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    className="flex items-center gap-1 text-[11px] font-black tracking-wider text-zinc-400 hover:text-white focus:outline-none bg-zinc-950/40 border border-zinc-800/80 px-2.5 py-1 rounded-xl transition"
                    title="Playback speed"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    <span>{playbackSpeed === 1 ? "Normal" : `${playbackSpeed}x`}</span>
                  </button>

                  {/* Playback Speed Menu */}
                  {showSpeedMenu && (
                    <div className="absolute bottom-10 right-0 w-24 bg-zinc-950/95 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-1.5 shadow-2xl flex flex-col gap-1 z-30 animate-fade-in max-h-48 overflow-y-auto">
                      {[0.5, 1, 1.25, 1.5, 2].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => handleSpeedChange(rate)}
                          className={`w-full py-1 text-[10px] font-extrabold rounded-lg text-center transition ${
                            playbackSpeed === rate
                              ? "bg-blue-600/20 text-blue-400"
                              : "text-zinc-400 hover:bg-zinc-800/30 hover:text-white"
                          }`}
                        >
                          {rate === 1 ? "Normal" : `${rate}x`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleFullscreen}
                  className="text-zinc-400 hover:text-white transition focus:outline-none"
                  title="Fullscreen (F)"
                >
                  <Maximize2 className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-zinc-500 bg-zinc-950">
          <ShieldAlert className="h-12 w-12 text-zinc-700 mb-3 animate-pulse" />
          <p className="text-xs font-black uppercase text-zinc-400 tracking-wider">Failed to Load Video Asset</p>
          <p className="text-[10px] text-zinc-650 mt-1 max-w-xs leading-relaxed">
            The S3 file container link is missing, expired, or unauthorized. Please re-sign configurations.
          </p>
        </div>
      )}
    </div>
  );
}
