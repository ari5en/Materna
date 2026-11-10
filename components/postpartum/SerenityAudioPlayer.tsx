'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Heart, Volume2, VolumeX } from 'lucide-react';
import { useMaterna } from '@/lib/context/MaternaContext';
import { LotusIcon } from '../shared/LotusIcon';
import { SerenityEngine, type TrackId } from '@/lib/serenityAudio';

interface Track {
  id: TrackId;
  title: string;
  duration: string;
  durationSec: number;
  category: string;
  iconBg: string;
}

const TRACKS: Track[] = [
  {
    id: 't-1',
    title: 'Harmonious Wind',
    duration: '2:10',
    durationSec: 130,
    category: 'Womb White Noise',
    iconBg: 'bg-[#C79BAF]',
  },
  {
    id: 't-2',
    title: 'Silent Streams',
    duration: '2:10',
    durationSec: 130,
    category: 'Gentle Relaxation',
    iconBg: 'bg-[#8FA2BA]',
  },
  {
    id: 't-3',
    title: 'Celestial Calm',
    duration: '2:10',
    durationSec: 130,
    category: 'Newborn Sleep',
    iconBg: 'bg-[#9887B8]',
  },
  {
    id: 't-4',
    title: 'Piano Instrument',
    duration: '4:19',
    durationSec: 259,
    category: 'Maternal Peace',
    iconBg: 'bg-[#A37B9D]',
  },
  {
    id: 't-5',
    title: 'Peaceful Rain',
    duration: '3:23',
    durationSec: 203,
    category: 'Deep Rest',
    iconBg: 'bg-[#7C6689]',
  },
];

export function SerenityAudioPlayer() {
  const { profile, toggleFavoriteTrack } = useMaterna();
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [volume, setVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);

  const activeTrack = selectedTrack ?? profile.favorite_tracks?.[0] ?? 't-1';

  const engineRef = useRef<SerenityEngine | null>(null);
  const getEngine = () => {
    if (!engineRef.current) {
      engineRef.current = new SerenityEngine(muted ? 0 : volume);
    }
    return engineRef.current;
  };

  const currentTrack = TRACKS.find((t) => t.id === activeTrack) || TRACKS[0];
  const favoriteTracks = profile.favorite_tracks || [];
  const isFavorited = favoriteTracks.includes(currentTrack.id);

  // Cleanup only. The AudioContext is created inside click handlers (see below).
  useEffect(() => {
    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  // Volume / mute
  useEffect(() => {
    engineRef.current?.setVolume(muted ? 0 : volume);
  }, [volume, muted]);

  // 1-second playback timer
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      // Stops at the end; the auto-advance effect below handles "track finished"
      setCurrentTimeSec((prev) => Math.min(prev + 1, currentTrack.durationSec));
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, currentTrack.durationSec]);

  // ---- Click handlers: audio starts HERE so browsers allow it ----

  const startTrack = (id: TrackId) => {
    void getEngine().play(id);
    setSelectedTrack(id);
    setCurrentTimeSec(0);
    setIsPlaying(true);
  };

  const pause = () => {
    engineRef.current?.stop();
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      void getEngine().play(currentTrack.id);
      setIsPlaying(true);
    }
  };

  const toggleTrackPlay = (id: TrackId) => {
    if (activeTrack === id) {
      togglePlay();
    } else {
      startTrack(id);
    }
  };

  const currentIndex = TRACKS.findIndex((t) => t.id === currentTrack.id);

  // Playlist finished: turn the music off and reset
  const finishPlaylist = () => {
    engineRef.current?.stop();
    setIsPlaying(false);
    setCurrentTimeSec(0);
  };

  const handleNext = () => {
    if (currentIndex < TRACKS.length - 1) {
      startTrack(TRACKS[currentIndex + 1].id);
    } else {
      finishPlaylist(); // to loop the playlist instead, use: startTrack(TRACKS[0].id);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      startTrack(TRACKS[currentIndex - 1].id);
    } else {
      startTrack(TRACKS[0].id); // already first: restart it
    }
  };

  // When the current track reaches its end, go to the next one (or stop after the last)
  useEffect(() => {
    if (isPlaying && currentTimeSec >= currentTrack.durationSec) {
      handleNext();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTimeSec, isPlaying]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPct = Math.min(
    100,
    Math.round((currentTimeSec / currentTrack.durationSec) * 100)
  );

  return (
    // Phones/tablets: stacked. Wide screens (xl+): player on the left, track list on the right.
    <section className="bg-gradient-to-b from-[#6A4B72] via-[#5A3B60] to-[#462B4A] rounded-[32px] p-5 text-white shadow-xl relative overflow-hidden flex flex-col xl:flex-row gap-4 xl:gap-5">
      {/* Background ambient lotus glow */}
      <div className="absolute -top-16 -right-16 w-60 h-60 rounded-full bg-[#A25F88]/30 blur-3xl pointer-events-none"></div>

      {/* LEFT: now playing + controls */}
      <div className="relative z-10 flex flex-col gap-3 xl:flex-1 xl:min-w-0 xl:min-h-0 xl:justify-between">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#E6CDDF] bg-white/10 px-3 py-1 rounded-full border border-white/15">
            SERENITY RHYTHMS
          </span>
          <button
            onClick={() => toggleFavoriteTrack(currentTrack.id)}
            aria-label="Favorite Track"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-[#E888B4] text-[#E888B4]' : 'text-white'}`} />
          </button>
        </div>

        {/* Centerpiece */}
        <div className="flex flex-col items-center text-center gap-1 xl:flex-row xl:text-left xl:gap-3">
          <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
            <div
              className={`absolute inset-0 bg-[#DE85B0]/30 rounded-full blur-xl ${
                isPlaying ? 'animate-pulse scale-110' : ''
              } transition-transform`}
            ></div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#9B5584] to-[#BA78A3] p-1 shadow-lg flex items-center justify-center border-2 border-white/30">
              <LotusIcon className="w-7 h-7 text-white drop-shadow-md" />
            </div>
          </div>

          <div className="min-w-0">
            <h3 className="font-serif text-lg font-bold tracking-tight text-white leading-tight">
              {currentTrack.title}
            </h3>
            <p className="text-[11px] text-[#DCC7D9] font-medium leading-tight xl:truncate">
              <span className="xl:hidden">Materna Maternal Sanctuary • </span>
              {currentTrack.category}
            </p>
          </div>
        </div>

        {/* Progress, Controls & Volume */}
        <div className="space-y-2">
          <div className="space-y-1">
            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#F6B89E] to-[#E888B4] h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-[#D8BDD4] font-medium px-0.5">
              <span>{formatTime(currentTimeSec)}</span>
              <span>{currentTrack.duration} mins</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-5">
            <button
              type="button"
              onClick={handlePrevious}
              aria-label="Previous track"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#E8D4E6] flex items-center justify-center transition-colors cursor-pointer"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="w-11 h-11 rounded-full bg-white text-[#634469] flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={handleNext}
              aria-label="Next track"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#E8D4E6] flex items-center justify-center transition-colors cursor-pointer"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Volume (pb-2 = padding below the slider; try pb-3 or pb-4 for more) */}
          <div className="flex items-center gap-2 px-1 pb-2">
            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? 'Unmute' : 'Mute'}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-[#E8D4E6] flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              {muted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={(e) => {
                setVolume(Number(e.target.value));
                setMuted(false);
              }}
              aria-label="Volume"
              className="w-full h-1.5 accent-[#F6B89E] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* RIGHT: list of music (scrolls inside the card on wide screens) */}
      <div className="flex flex-col gap-3 relative z-10 border-t border-white/10 pt-4 xl:border-t-0 xl:pt-1 xl:border-l xl:pl-5 xl:w-[48%] xl:shrink-0 xl:min-h-0">
        <div className="flex items-center justify-between pb-1 border-b border-white/15">
          <h4 className="font-serif text-base font-bold text-white">List of music</h4>
          <span className="text-[10px] font-bold text-[#E6CDDF] bg-white/10 px-2.5 py-0.5 rounded-full">
            {TRACKS.length} Tracks
          </span>
        </div>

        <div className="space-y-1.5 xl:flex-1 xl:min-h-0 xl:overflow-y-auto">
          {TRACKS.map((track) => {
            const isSelected = activeTrack === track.id;
            return (
              <div
                key={track.id}
                onClick={() => toggleTrackPlay(track.id)}
                className={`flex items-center justify-between gap-2 p-2 rounded-2xl transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white/15 border border-white/20'
                    : 'border border-transparent hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-full ${track.iconBg} text-white flex items-center justify-center shadow-xs shrink-0`}>
                    <LotusIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className={`text-xs font-bold flex items-center gap-1.5 ${isSelected ? 'text-[#F6B89E]' : 'text-white'}`}>
                      <span className="leading-tight">{track.title}</span>
                      {favoriteTracks.includes(track.id) && (
                        <Heart className="w-3 h-3 fill-[#E888B4] text-[#E888B4] shrink-0" />
                      )}
                    </div>
                    <div className="text-[10px] text-[#D8BDD4] flex items-center gap-1">
                      <span className="shrink-0">{track.duration} mins</span>
                      <span className="xl:hidden">•</span>
                      <span className="truncate xl:hidden">{track.category}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label={`Play ${track.title}`}
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    isSelected && isPlaying
                      ? 'bg-[#E888B4] text-white'
                      : 'bg-white/10 text-[#E8D4E6] hover:bg-white/20'
                  }`}
                >
                  {isSelected && isPlaying ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}