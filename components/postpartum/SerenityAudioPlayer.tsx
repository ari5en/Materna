'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Heart, Volume2, VolumeX } from 'lucide-react';
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

  // 1-second playback timer (soundscapes loop forever)
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setCurrentTimeSec((prev) => {
        if (prev + 1 >= currentTrack.durationSec) {
          return 0;
        }
        return prev + 1;
      });
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

  const handleSeekOffset = (deltaSec: number) => {
    setCurrentTimeSec((prev) =>
      Math.max(0, Math.min(currentTrack.durationSec, prev + deltaSec))
    );
  };

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
    <section className="bg-gradient-to-b from-[#6A4B72] via-[#5A3B60] to-[#462B4A] rounded-[32px] p-6 text-white shadow-xl relative overflow-hidden space-y-6">
      {/* Background ambient lotus glow */}
      <div className="absolute -top-16 -right-16 w-60 h-60 rounded-full bg-[#A25F88]/30 blur-3xl pointer-events-none"></div>

      {/* Top Header */}
      <div className="flex items-center justify-between relative z-10">
        <span className="text-[10px] uppercase font-bold tracking-widest text-[#E6CDDF] bg-white/10 px-3 py-1 rounded-full border border-white/15">
          SERENITY RHYTHMS
        </span>
        <button
          onClick={() => toggleFavoriteTrack(currentTrack.id)}
          aria-label="Favorite Track"
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-[#E888B4] text-[#E888B4]' : 'text-white'}`} />
        </button>
      </div>

      {/* Featured Blooming Lotus Centerpiece */}
      <div className="flex flex-col items-center text-center py-2 relative z-10 space-y-3">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <div
            className={`absolute inset-0 bg-[#DE85B0]/30 rounded-full blur-2xl ${
              isPlaying ? 'animate-pulse scale-110' : ''
            } transition-transform`}
          ></div>
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#9B5584] to-[#BA78A3] p-1 shadow-lg flex items-center justify-center border-2 border-white/30">
            <LotusIcon className="w-14 h-14 text-white drop-shadow-md" />
          </div>
        </div>

        <div className="space-y-0.5">
          <h3 className="font-serif text-2xl font-bold tracking-tight text-white">
            {currentTrack.title}
          </h3>
          <p className="text-xs text-[#DCC7D9] font-medium">
            Materna Maternal Sanctuary • {currentTrack.category}
          </p>
        </div>
      </div>

      {/* Audio Scrubber & Controls */}
      <div className="space-y-3 relative z-10">
        <div className="space-y-1">
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              setCurrentTimeSec(Math.round(clickRatio * currentTrack.durationSec));
            }}
            className="w-full bg-white/20 h-2 rounded-full overflow-hidden cursor-pointer"
          >
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

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-6 pt-1">
          <button
            type="button"
            onClick={() => handleSeekOffset(-15)}
            aria-label="Rewind 15 seconds"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-[#E8D4E6] flex items-center justify-center transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="w-13 h-13 rounded-full bg-white text-[#634469] flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSeekOffset(15)}
            aria-label="Fast forward 15 seconds"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-[#E8D4E6] flex items-center justify-center transition-colors cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-3 pt-1 px-1">
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? 'Unmute' : 'Mute'}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#E8D4E6] flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
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

      {/* Lower White Card: List of Music */}
      <div className="bg-white rounded-[26px] p-5 text-[#2A162B] shadow-md space-y-3 relative z-10">
        <div className="flex items-center justify-between pb-1 border-b border-[#F2E8F0]">
          <h4 className="font-serif text-base font-bold text-[#2A162B]">List of music</h4>
          <span className="text-[10px] font-bold text-[#8E738E] bg-[#F7EFF6] px-2.5 py-0.5 rounded-full">
            {TRACKS.length} Tracks
          </span>
        </div>

        <div className="space-y-1.5">
          {TRACKS.map((track) => {
            const isSelected = activeTrack === track.id;
            return (
              <div
                key={track.id}
                onClick={() => toggleTrackPlay(track.id)}
                className={`flex items-center justify-between p-2.5 rounded-2xl transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#F9EFF6] border border-[#ECDDEC]'
                    : 'hover:bg-[#FAF5FA]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full ${track.iconBg} text-white flex items-center justify-center shadow-xs shrink-0`}>
                    <LotusIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className={`text-xs font-bold flex items-center gap-1.5 ${isSelected ? 'text-[#9E4875]' : 'text-[#2C182D]'}`}>
                      <span>{track.title}</span>
                      {favoriteTracks.includes(track.id) && (
                        <Heart className="w-3 h-3 fill-[#E888B4] text-[#E888B4]" />
                      )}
                    </div>
                    <div className="text-[10px] text-[#8C728C] flex items-center gap-1">
                      <span>{track.duration} mins</span>
                      <span>•</span>
                      <span>{track.category}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label={`Play ${track.title}`}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                    isSelected && isPlaying
                      ? 'bg-[#9E4875] text-white'
                      : 'bg-[#F4EAF3] text-[#69486F] hover:bg-[#EBDDE9]'
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