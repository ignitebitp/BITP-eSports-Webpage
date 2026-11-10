'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useEsportsModal } from '@/context/ModalContext';
import {
  CONTACT_INFO,
  DEFAULT_CLUB_GAMES,
  LOCAL_GAME_ART, localResourceImage,
  type ClubGame, type ScheduledMatch, type WeeklyScheduleItem, type RecentResult, type TournamentEvent,
  formatEventTime, isEventEndedIST,
} from '@/data/esportsData';
import {
  ArrowRight, Calendar, Video, MessageSquare, Mail,
  ExternalLink, Trophy, Users, Shield, Tv, Clock, Radio, AlertCircle, Gamepad2, Flame, Crosshair, Crown
} from 'lucide-react';

export default function Home() {
  const { openModal } = useEsportsModal();
  const [games, setGames] = useState<ClubGame[]>(DEFAULT_CLUB_GAMES);
  const [matches, setMatches] = useState<ScheduledMatch[]>([]);
  const [sessions, setSessions] = useState<WeeklyScheduleItem[]>([]);
  const [results, setResults] = useState<RecentResult[]>([]);
  const [events, setEvents] = useState<TournamentEvent[]>([]);

  useEffect(() => {
    let active = true;
    const load = async <T,>(url: string, key: string, setData: (value: T[]) => void) => {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Unable to load ${key}.`);
      const data = await response.json();
      if (active && Array.isArray(data[key]) && (key !== 'games' || data[key].length > 0)) {
        setData(data[key] as T[]);
      }
    };

    void Promise.all([
      load<ClubGame>('/api/games', 'games', setGames),
      load<ScheduledMatch>('/api/matches', 'matches', setMatches),
      load<WeeklyScheduleItem>('/api/sessions', 'sessions', setSessions),
      load<RecentResult>('/api/results', 'results', setResults),
      load<TournamentEvent>('/api/events', 'events', setEvents),
    ]).catch((error: unknown) => {
      console.error('Unable to refresh club content:', error instanceof Error ? error.name : 'Unknown error');
    });

    return () => {
      active = false;
    };
  }, []);

  const nearestEvent = [...events]
    .filter((e) => !isEventEndedIST(e))
    .sort((left, right) => new Date(left.isoDate).getTime() - new Date(right.isoDate).getTime())[0] ?? null;

  return (
    <main className="flex-grow w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 space-y-16 my-8">
      {/* 1. CLUB HERO SECTION WITH AMBIENT COMPETITIVE GLOW */}
      <section className="border border-[#262a36] bg-[#0c0e14] p-6 sm:p-8 md:p-12 relative overflow-hidden tactical-grid-bg">
        {/* Subtle ambient lighting glows behind hero */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#88c425]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#ff4655]/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Meta Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#262a36] pb-4 mb-8 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#88c425]"></span>
            <span className="font-label-mono-sm text-[#88c425] uppercase tracking-wider text-xs">
              Official Student Organization
            </span>
          </div>
          <div className="font-label-mono-sm text-[#88c425] border border-[#262a36] bg-[#12141a] px-2 py-0.5 uppercase text-xs font-bold">
            SEASON 2k26
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
          <div className="lg:col-span-8 space-y-5">
            <h1 className="hidden md:block font-display-hero text-white tracking-tight font-extrabold text-5xl lg:text-7xl leading-none">
              COMPETITIVE ESPORTS & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-[#88c425]">
                CAMPUS GAMING
              </span>
            </h1>
            <h1 className="block md:hidden font-display-hero-mobile text-white tracking-tight font-extrabold text-4xl">
              COMPETITIVE ESPORTS & CAMPUS GAMING
            </h1>
            <p className="font-body-lg text-[#94a3b8] max-w-2xl leading-relaxed">
              Official student-led esports club representing the university across <strong className="text-white">EA Sports FC</strong>, <strong className="text-white">Valorant</strong>, <strong className="text-white">Free Fire Mobile</strong>, <strong className="text-white">BGMI</strong> and more. From casual campus lobbies to varsity qualifiers.
            </p>

            <div className="pt-2 flex flex-wrap gap-4">
              <a
                href={CONTACT_INFO.discordUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#88c425] text-[#0a0b0e] font-label-caps uppercase px-7 py-3.5 tracking-wider font-bold hover:bg-white transition-colors duration-150 inline-flex items-center gap-2 text-sm shadow-lg shadow-[#88c425]/10"
              >
                <span>Join Our Discord</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <Link
                href="#rosters"
                className="bg-[#191b22] border border-[#262a36] text-[#e2e8f0] font-label-caps uppercase px-6 py-3.5 tracking-wider hover:border-[#88c425] hover:text-white transition-colors duration-150 inline-flex items-center gap-2 text-sm"
              >
                Explore Active Games
              </Link>
            </div>
          </div>

          {/* Quick Stats Panel */}
          <div className="lg:col-span-4 border border-[#262a36] bg-[#12141a] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#262a36] pb-2">
              <span className="font-label-mono-sm text-[#94a3b8] uppercase text-xs">CLUB QUICK STATS</span>
              <span className="font-label-mono-sm text-[#88c425] text-xs font-bold">ACTIVE</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1">
                <span className="font-label-caps text-[#94a3b8] uppercase text-sm">Active Members</span>
                <span className="font-label-mono-lg font-bold text-white">100+</span>
              </div>
              <div className="flex justify-between items-center py-1 border-t border-[#262a36]">
                <span className="font-label-caps text-[#94a3b8] uppercase text-sm">Active Titles</span>
                <span className="font-label-mono-lg font-bold text-white">4 Disciplines</span>
              </div>
              <div className="flex justify-between items-center py-1 border-t border-[#262a36]">
                <span className="font-label-caps text-[#94a3b8] uppercase text-sm">Divisions</span>
                <span className="font-label-mono-lg font-bold text-white">PC • Mobile</span>
              </div>
              <div className="flex justify-between items-center py-1 border-t border-[#262a36]">
                <span className="font-label-caps text-[#94a3b8] uppercase text-sm">Weekly Scrims</span>

              </div>
            </div>
            <div className="bg-[#191b22] p-3 border border-[#262a36] text-center">
              <p className="font-label-mono-sm text-[#94a3b8] text-[18px]">
                OPEN TO ALL STUDENTS
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. NEXT FEATURED EVENT (Empty State / Live Sync Placeholder) */}
      <section className="space-y-4" id="events">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#88c425]"></span>
            <h2 className="font-headline-lg uppercase text-white">Next Featured Event</h2>
          </div>
          <span className="font-label-mono-sm text-[#94a3b8] text-xs">SYNCING LIVE FROM ADMIN FEED</span>
        </div>

        {nearestEvent ? (
          <div className={`border border-[#262a36] bg-[#12141a] p-6 sm:p-8 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center ${nearestEvent.posterUrl ? 'lg:grid-cols-12' : ''}`}>
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center gap-2">
                <span className="bg-[#88c425] text-[#0a0b0e] font-label-mono-sm px-2 py-0.5 font-bold uppercase text-xs">
                  {nearestEvent.statusBadge}
                </span>
                <span className="border border-[#262a36] bg-[#191b22] text-[#94a3b8] font-label-mono-sm px-2 py-0.5 uppercase text-xs">
                  {nearestEvent.discipline}
                </span>
              </div>
              <h3 className="font-headline-xl text-white uppercase tracking-tight">
                {nearestEvent.title}
              </h3>
              {nearestEvent.description && (
                <p className="whitespace-pre-wrap font-body-md leading-relaxed text-[#94a3b8]">
                  {nearestEvent.description}
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-t border-b border-[#262a36]">
                <div>
                  <div className="font-label-mono-sm text-[#94a3b8] uppercase text-xs">Date & Time</div>
                  <div className="font-label-mono-lg font-bold text-white">{nearestEvent.dateStr} • {formatEventTime(nearestEvent)}</div>
                </div>
                <div>
                  <div className="font-label-mono-sm text-[#94a3b8] uppercase text-xs">Location</div>
                  <div className="font-label-mono-lg font-bold text-white">{nearestEvent.location}</div>
                </div>
                <div>
                  <div className="font-label-mono-sm text-[#94a3b8] uppercase text-xs">Format</div>
                  <div className="font-label-mono-lg font-bold text-white">{nearestEvent.format}</div>
                </div>
              </div>
              <div className="pt-2">
                <Link
                  href="/events"
                  className="bg-[#88c425] text-[#0a0b0e] font-label-caps uppercase px-6 py-2.5 font-bold hover:bg-white transition-colors duration-150 inline-flex items-center gap-2 text-sm"
                >
                  <span>View Event Details</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            {nearestEvent.posterUrl && (
              <div className="relative mx-auto aspect-[1440/1350] w-full max-w-md overflow-hidden border border-[#262a36] lg:col-span-4">
                <Image
                  src={nearestEvent.posterUrl}
                  alt={`${nearestEvent.title} event poster`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  unoptimized
                  className="object-cover"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="border border-[#262a36] bg-[#12141a] p-8 text-center space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-[#0c0e14] border border-[#262a36] text-[#88c425] mb-1">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="font-headline-sm uppercase text-white">
              NO UPCOMING EVENTS SCHEDULED
            </div>
            <p className="font-body-sm text-[#94a3b8] max-w-lg mx-auto">
              The tournament schedule is currently clear.
            </p>
            <div className="pt-2">
              <a
                href={CONTACT_INFO.discordUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#191b22] border border-[#262a36] hover:border-[#88c425] text-white px-5 py-2 font-label-caps uppercase text-xs tracking-wider transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#88c425]" />
                <span>CHECK DISCORD ANNOUNCEMENTS</span>
              </a>
            </div>
          </div>
        )}
      </section>

      {/* 3. ACTIVE TITLES & CLUB GAMES WITH GAME-SPECIFIC AESTHETICS & CHARACTER ART */}
      <section className="space-y-4" id="rosters">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#88c425]"></span>
            <h2 className="font-headline-lg uppercase text-white">Active Titles & Club Games</h2>
          </div>
          <span className="font-label-mono-sm text-[#94a3b8] text-xs">4 FEATURED GAME DIVISIONS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {games.map((game) => (
            <div
              key={game.id}
              className="border border-[#262a36] bg-[#12141a] relative overflow-hidden group hover:border-[#3b4252] transition-colors duration-200 flex flex-col justify-between"
            >
              {/* Top Banner Image with Gradient Overlay */}
              <div className="relative aspect-[4/3] bg-[#0c0e14] overflow-hidden">
                <Image
                  src={LOCAL_GAME_ART[game.id] ?? localResourceImage(game.gameArt, '/resources/games/default.svg')}
                  alt={game.name}
                  fill
                  sizes="(max-width: 1200px) 100vw, 50vw"
                  unoptimized
                  className="w-full h-full object-contain grayscale contrast-125 opacity-40 group-hover:scale-105 group-hover:opacity-60 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#12141a] via-[#12141a]/60 to-transparent"></div>

                {/* Top Badges */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                  <span
                    className="font-label-mono-sm font-bold uppercase px-2.5 py-1 text-xs border"
                    style={{
                      backgroundColor: game.badgeBg,
                      borderColor: game.accentColor,
                      color: game.accentColor,
                    }}
                  >
                    {game.tag}{' // '}{game.category}
                  </span>
                  <span className="bg-[#0c0e14]/90 border border-[#262a36] text-white font-label-mono-sm px-2.5 py-1 text-[11px]">
                    {game.status}
                  </span>
                </div>

                {/* Bottom Tagline on Image */}
                <div className="absolute bottom-3 left-4 z-10 font-label-mono-sm text-xs font-bold text-white tracking-wider">
                  <span style={{ color: game.accentColor }}>▶ </span>
                  {game.tagline}
                </div>
              </div>

              {/* Body Info */}
              <div className="p-6 space-y-4 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="font-headline-md uppercase text-white flex items-center gap-2">
                    <span>{game.name}</span>
                  </h3>
                  <p className="font-body-sm text-[#94a3b8] leading-relaxed mt-1">
                    {game.description}
                  </p>
                </div>


                
              </div>
            </div>

          ))}
        </div>
      </section>

      {/* 4. UPCOMING MATCHES & WEEKLY ACTIVITIES (Empty State for Admin Sync) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#88c425]"></span>
            <h2 className="font-headline-lg uppercase text-white">Schedule & Weekly Activities</h2>
          </div>
          <span className="font-label-mono-sm text-[#94a3b8] text-xs">MANAGED VIA ADMIN PANEL</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* COLUMN A: Intercollegiate Matches */}
          <div className="border border-[#262a36] bg-[#12141a] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#262a36] pb-2">
              <span className="font-label-caps uppercase text-white font-bold text-sm">
                Collegiate League Matches
              </span>
              <span className="font-label-mono-sm text-[#94a3b8] text-xs">BROADCAST SCHEDULE</span>
            </div>

            {matches.length > 0 ? (
              <div className="space-y-3">
                {matches.map((match) => (
                  <div
                    key={match.id}
                    className="border border-[#262a36] bg-[#0c0e14] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#88c425] transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-[#191b22] px-1.5 py-0.5 font-label-mono-sm text-[#88c425] font-bold text-xs">
                          {match.discipline}
                        </span>
                        <span className="font-label-mono-sm text-[#94a3b8]">
                          {match.datetime}
                        </span>
                      </div>
                      <div className="font-headline-sm text-white uppercase">
                        <span className="normal-case">BITPeSports</span> <span className="text-[#94a3b8] font-normal">vs</span> {match.opponent}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-[#262a36] bg-[#0c0e14] p-8 text-center space-y-2">
                <div className="font-headline-sm uppercase text-[#e2e8f0]">
                  NO UPCOMING MATCHES SCHEDULED
                </div>
                <p className="font-body-sm text-[#94a3b8]">
                  Matches will sync live from the tournament admin panel once fixtures and conference brackets are finalized.
                </p>
              </div>
            )}
          </div>

          {/* COLUMN B: Weekly Campus Club Schedule */}
          <div className="border border-[#262a36] bg-[#12141a] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#262a36] pb-2">
              <span className="font-label-caps uppercase text-white font-bold text-sm">
                Weekly Campus Club Schedule
              </span>
              <span className="font-label-mono-sm text-[#88c425] text-xs">DROP-INS WELCOME</span>
            </div>

            {sessions.length > 0 ? (
              <div className="space-y-3">
                {sessions.map((item) => (
                  <div
                    key={item.id}
                    className="border border-[#262a36] bg-[#0c0e14] p-4 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-label-caps uppercase text-[#88c425] font-bold text-sm">
                        {item.tag}
                      </span>
                      <span className="font-label-mono-sm text-[#94a3b8] text-xs">
                        {item.time}
                      </span>
                    </div>
                    <div className="font-headline-sm text-white uppercase">{item.title}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-[#262a36] bg-[#0c0e14] p-8 text-center space-y-2">
                <div className="font-headline-sm uppercase text-[#e2e8f0]">
                  NO ACTIVE SESSIONS SCHEDULED
                </div>
                <p className="font-body-sm text-[#94a3b8]">
                  Weekly scrim blocks and casual room meetups will be posted by team leads. Join the Discord server for flash scrim announcements.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. RECENT RESULTS (Empty State for Backend Sync) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#88c425]"></span>
            <h2 className="font-headline-lg uppercase text-white">Recent Results</h2>
          </div>
          <span className="font-label-mono-sm text-[#94a3b8] text-xs">OFFICIAL COMPETITION LEDGER</span>
        </div>

        {results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {results.slice(0, 3).map((res) => (
              <div
                key={res.id}
                className="border border-[#262a36] bg-[#12141a] p-6 space-y-3 hover:border-[#88c425] transition-colors"
              >
                <div className="flex items-center justify-between border-b border-[#262a36] pb-2">
                  <span className="font-label-mono-sm text-[#94a3b8] uppercase text-xs">
                    {res.discipline}
                  </span>
                  <span className="font-label-mono-sm px-1.5 py-0.5 font-bold uppercase text-[11px] bg-[#88c425] text-[#0a0b0e]">
                    {res.badge}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-headline-sm text-white uppercase font-bold">{res.team1}</div>
                    <div className="font-headline-sm text-[#94a3b8] uppercase">{res.team2}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display-hero-mobile text-[#88c425] font-bold leading-none">{res.score1}</div>
                    <div className="font-display-hero-mobile text-[#94a3b8] font-bold leading-none">{res.score2}</div>
                  </div>
                </div>
                <div className="border-t border-[#262a36] pt-2 text-[#94a3b8] font-label-mono-sm text-xs">
                  {res.subtext}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-[#262a36] bg-[#12141a] p-8 text-center space-y-2">
            <div className="font-headline-sm uppercase text-[#e2e8f0]">
              NO RECENT MATCH RECORDS LOGGED
            </div>
            <p className="font-body-sm text-[#94a3b8] max-w-lg mx-auto">
              Match scorecards and official series outcomes will be recorded and published here as tournament rounds conclude.
            </p>
          </div>
        )}
      </section>

      {/* 6. CLUB CALL TO ACTION BANNER */}
      <section className="border border-[#88c425] bg-[#12141a] p-8 md:p-12 text-center space-y-4">
        <div className="inline-block border border-[#88c425] px-3 py-1 font-label-mono-sm text-[#88c425] uppercase text-xs">
          OPEN CAMPUS RECRUITMENT & CASUAL COMMUNITY
        </div>
        <h2 className="font-headline-xl md:font-display-hero-mobile text-white uppercase tracking-tight max-w-3xl mx-auto">
          GET INVOLVED IN CAMPUS GAMING
        </h2>
        <p className="font-body-lg text-[#94a3b8] max-w-2xl mx-auto leading-relaxed">
          Whether you compete at the collegiate level or just want someone to queue with between classes, there is a spot for you. Drop by Rm 204 or join the server.
        </p>
        <div className="flex flex-wrap justify-center items-center gap-4 pt-2">
          <a
            className="bg-[#88c425] text-[#0a0b0e] font-label-caps uppercase px-8 py-3.5 tracking-wider font-bold hover:bg-white transition-colors duration-150 inline-flex items-center gap-2 text-sm"
            href={CONTACT_INFO.discordUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Join the Discord Server</span>
          </a>
          <Link
            className="bg-[#191b22] border border-[#262a36] text-white font-label-caps uppercase px-6 py-3.5 tracking-wider hover:border-[#88c425] transition-colors duration-150 inline-flex items-center gap-2 text-sm"
            href="/contact"
          >
            <Mail className="w-4 h-4 text-[#88c425]" />
            <span>Contact Club Officers</span>
          </Link>
        </div>
      </section>
    </main >
  );
}
