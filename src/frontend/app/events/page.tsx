'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useEsportsModal } from '@/context/ModalContext';
import { type TournamentEvent, type RecentResult, formatEventTime, isEventEndedIST } from '@/data/esportsData';
import {
  Calendar, Trophy, Video, Users, ArrowRight, Lightbulb,
  Search, CheckCircle2, Radio, Filter, MapPin, Clock, Archive
} from 'lucide-react';

export default function EventsPage() {
  const { openModal, playTacticalSound } = useEsportsModal();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewTab, setViewTab] = useState<'upcoming' | 'archive'>('upcoming');
  const [events, setEvents] = useState<TournamentEvent[]>([]);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetch('/api/events', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load events.');
        const data = await response.json();
        if (active && Array.isArray(data.events)) setEvents(data.events);
      })
      .catch((error: unknown) => {
        console.error('Unable to refresh events:', error instanceof Error ? error.name : 'Unknown error');
      });
    return () => {
      active = false;
    };
  }, []);

  // Automatically sort events chronologically by date
  const sortedEvents = [...events].sort((a, b) => {
    return new Date(a.isoDate).getTime() - new Date(b.isoDate).getTime();
  });

  // Separate active upcoming events vs ended events (in IST timezone)
  const activeEvents = sortedEvents.filter((item) => !isEventEndedIST(item));
  const archivedEvents = sortedEvents.filter((item) => isEventEndedIST(item)).reverse();

  // Nearest event is the highlight spotlight of the page
  const nearestEvent: TournamentEvent | null = activeEvents.length > 0 ? activeEvents[0] : null;

  // Other upcoming events following the spotlight
  const upcomingEvents: TournamentEvent[] = activeEvents.length > 1 ? activeEvents.slice(1) : [];

  const filteredUpcoming = upcomingEvents.filter((item) => {
    return (
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.discipline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const filteredArchive = archivedEvents.filter((item) => {
    return (
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.discipline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const toggleReport = (id: string) => {
    playTacticalSound('click');
    setExpandedReportId(expandedReportId === id ? null : id);
  };

  return (
    <main className="flex-grow w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-8 space-y-16">
      {/* 1. Page Header */}
      <section className="border-b border-[#33343b] pb-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#cdf200]"></span>
              <span className="font-label-mono-sm text-[#cdf200] uppercase tracking-wider text-xs">
                OFFICIAL CLUB SCHEDULE // TOURNAMENT CALENDAR
              </span>
            </div>
            <h1 className="font-headline-xl text-white uppercase tracking-tight text-4xl sm:text-5xl">
              CAMPUS EVENTS & TOURNAMENT SCHEDULE
            </h1>
            <p className="font-body-lg text-[#8f96a3]">
              Upcoming campus LANs, competitive scrims, mobile battle royales, and tournaments. Completed events automatically archive after their scheduled end time in IST.
            </p>
          </div>
        </div>

        {/* View Options: Upcoming Events vs Event Archive */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#33343b] pt-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setViewTab('upcoming');
                playTacticalSound('click');
              }}
              className={`px-4 py-2 font-label-caps uppercase text-xs font-bold transition-all flex items-center gap-2 border ${viewTab === 'upcoming'
                ? 'bg-[#cdf200] text-[#0a0b0e] border-[#cdf200] shadow-md'
                : 'bg-[#141720] text-[#8f96a3] border-[#262a36] hover:border-white hover:text-white'
                }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>UPCOMING EVENTS ({activeEvents.length})</span>
            </button>

            <button
              onClick={() => {
                setViewTab('archive');
                playTacticalSound('click');
              }}
              className={`px-4 py-2 font-label-caps uppercase text-xs font-bold transition-all flex items-center gap-2 border ${viewTab === 'archive'
                ? 'bg-[#cdf200] text-[#0a0b0e] border-[#cdf200] shadow-md'
                : 'bg-[#141720] text-[#8f96a3] border-[#262a36] hover:border-white hover:text-white'
                }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>EVENT ARCHIVE ({archivedEvents.length})</span>
            </button>
          </div>

          {viewTab === 'archive' && archivedEvents.length > 0 && (
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-[#8f96a3] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search event archive..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#141720] border border-[#262a36] pl-9 pr-3 py-1.5 text-xs text-white font-body-sm focus:border-[#cdf200] outline-none"
              />
            </div>
          )}
        </div>
      </section>

      {/* Main Content View Switcher */}
      {viewTab === 'archive' ? (
        /* Event Archive Section */
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#33343b] pb-3">
            <div className="flex items-center gap-2">
              <Archive className="w-5 h-5 text-[#cdf200]" />
              <h2 className="font-headline-lg uppercase text-white tracking-wide">
                Concluded Event Archive ({archivedEvents.length})
              </h2>
            </div>
            <span className="font-label-mono-sm text-[#8f96a3] text-xs">
              AUTOMATICALLY ARCHIVED AFTER END TIME (IST)
            </span>
          </div>

          {archivedEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArchive.map((item) => (
                <div
                  key={item.id}
                  className="border border-[#262a36] bg-[#12141a] p-6 flex flex-col justify-between space-y-4 opacity-90 hover:opacity-100 transition-all border-l-4 border-l-[#8f96a3]"
                >
                  {item.posterUrl && (
                    <div className="relative aspect-[1440/1350] w-full overflow-hidden border border-[#262a36] filter grayscale hover:grayscale-0 transition-all duration-300">
                      <Image
                        src={item.posterUrl}
                        alt={`${item.title} event poster`}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-[#262a36] pb-2 font-label-mono-sm text-xs">
                      <span className="text-[#8f96a3] font-bold">{item.discipline}</span>
                      <span className="text-[#cdf200] border border-[#cdf200]/30 px-1.5 py-0.5 text-[10px] uppercase font-bold">
                        ENDED (IST)
                      </span>
                    </div>

                    <h4 className="font-headline-sm uppercase text-white leading-snug">
                      {item.title}
                    </h4>

                    <div className="space-y-1 text-xs font-label-mono-sm text-[#8f96a3]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#8f96a3]" />
                        <span>DATE: {item.dateStr}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#8f96a3]" />
                        <span>TIME: {formatEventTime(item)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#8f96a3]" />
                        <span>{item.location}</span>
                      </div>
                    </div>

                    <p className="font-body-sm whitespace-pre-wrap text-[#8f96a3] line-clamp-3">
                      {item.description || item.format}
                    </p>

                    {Array.isArray(item.results) && item.results.length > 0 && (
                      <div className="space-y-2 border-t border-[#262a36] pt-3">
                        <span className="font-label-mono-sm text-[#cdf200] uppercase text-[10px] font-bold">
                          EVENT RESULTS ({item.results.length})
                        </span>
                        {item.results.map((res: RecentResult) => (
                          <div key={res.id} className="border border-[#262a36] bg-[#191b22] p-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-headline-sm uppercase text-white text-sm">
                                {res.team1} <span className="text-[#cdf200]">{res.score1}</span>
                              </span>
                              <span className="font-label-mono-sm px-1.5 py-0.5 font-bold uppercase text-[10px] bg-[#cdf200] text-[#0a0b0e]">
                                {res.badge}
                              </span>
                            </div>
                            <div className="font-headline-sm uppercase text-[#8f96a3] text-sm">
                              {res.team2} <span>{res.score2}</span>
                            </div>
                            {res.subtext ? <p className="mt-1 text-xs text-[#8f96a3]">{res.subtext}</p> : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {expandedReportId === item.id && (item.report || (Array.isArray(item.reportImages) && item.reportImages.length > 0)) ? (
                    <div className="space-y-3 border border-[#cdf200]/40 bg-[#191b22] p-4">
                      <span className="font-label-mono-sm text-[#cdf200] uppercase text-[10px] font-bold">
                        EVENT REPORT
                      </span>
                      {item.report ? (
                        <p className="font-body-sm whitespace-pre-wrap text-[#d1d5db] mt-1">
                          {item.report}
                        </p>
                      ) : null}
                      {Array.isArray(item.reportImages) && item.reportImages.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {item.reportImages.map((image) => (
                            <div key={image.id} className="relative aspect-[4/3] w-full overflow-hidden border border-[#262a36]">
                              <Image
                                src={image.url}
                                alt={`${item.title} report photo`}
                                fill
                                sizes="(max-width: 768px) 50vw, 20vw"
                                unoptimized
                                className="object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="pt-4 border-t border-[#262a36] flex items-center justify-between gap-2">
                    <span className="font-label-mono-sm text-xs text-[#8f96a3] border border-[#262a36] px-2 py-0.5 uppercase">
                      {item.statusBadge === 'UPCOMING' ? 'CONCLUDED' : item.statusBadge}
                    </span>
                    <div className="flex gap-2">
                      {item.report || (Array.isArray(item.reportImages) && item.reportImages.length > 0) ? (
                        <button
                          onClick={() => item.id && toggleReport(item.id)}
                          className="bg-[#cdf200] text-[#0a0b0e] hover:bg-white px-3 py-1 font-label-caps uppercase text-xs font-bold transition-colors"
                        >
                          {expandedReportId === item.id ? 'Hide report' : 'Read report'}
                        </button>
                      ) : null}
                      <button
                        onClick={() => openModal('register', item)}
                        className="bg-[#191b22] border border-[#33343b] hover:border-[#cdf200] text-[#8f96a3] hover:text-white px-3 py-1 font-label-caps uppercase text-xs transition-colors"
                      >
                        Archive Log
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-[#33343b] bg-[#191b22] p-8 text-center space-y-2">
              <div className="font-headline-sm uppercase text-[#e2e2ea]">
                NO ARCHIVED EVENTS FOUND
              </div>
              <p className="font-body-sm text-[#8f96a3] max-w-lg mx-auto">
                Completed campus tournaments will automatically appear in this archive once their end time in IST passes.
              </p>
            </div>
          )}
        </section>
      ) : (
        <>
          {/* 2. Spotlight Section (Nearest Active Event Highlight) */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#33343b] pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#cdf200]"></span>
                <h2 className="font-headline-lg uppercase text-white">Nearest Upcoming Event</h2>
              </div>
              <span className="font-label-mono-sm text-[#cdf200] text-xs">PRIMARY SPOTLIGHT</span>
            </div>

            {nearestEvent ? (
              <div className="border border-[#33343b] bg-[#191b22] relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-[#cdf200] text-[#0a0b0e] font-label-mono-sm uppercase font-bold px-3 py-1 tracking-wider text-xs z-20">
                  NEXT UP // HIGHLIGHT
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                  {/* Left Visual Highlight */}
                  <div className="lg:col-span-5 relative min-h-[300px] border-b lg:border-b-0 lg:border-r border-[#33343b] bg-[#0c0e14] flex flex-col justify-between p-6 sm:p-8">
                    {nearestEvent.posterUrl && (
                      <Image
                        src={nearestEvent.posterUrl}
                        alt={`${nearestEvent.title} event poster`}
                        fill
                        sizes="(max-width: 1024px) 100vw, 42vw"
                        unoptimized
                        className="object-cover opacity-35"
                      />
                    )}
                    <div className="relative z-10">
                      <span className="inline-block border border-[#cdf200] text-[#cdf200] px-2 py-0.5 font-label-mono-sm uppercase text-xs mb-3">
                        {nearestEvent.discipline}
                      </span>
                      <div className="font-label-mono-sm text-[#8f96a3] uppercase tracking-wider text-xs">
                        {nearestEvent.statusBadge}
                      </div>
                    </div>

                    <div className="relative z-10 pt-16">
                      <div className="font-label-mono-sm text-[#cdf200] text-xs">
                        LOCATION: {nearestEvent.location}
                      </div>
                      <div className="font-headline-sm text-white uppercase mt-1">
                        {nearestEvent.locationSub}
                      </div>
                    </div>
                  </div>

                  {/* Right Event Information */}
                  <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2 font-label-mono-sm text-xs text-[#8f96a3]">
                        <span className="text-[#cdf200] font-bold">DATE: {nearestEvent.dateStr}</span>
                        <span>|</span>
                        <span>{formatEventTime(nearestEvent)}</span>
                      </div>

                      <h2 className="font-headline-lg uppercase text-white leading-tight mt-1 mb-3">
                        {nearestEvent.title}
                      </h2>

                      <p className="font-body-md whitespace-pre-wrap text-[#8f96a3] leading-relaxed mb-6">
                        {nearestEvent.description || 'Official campus tournament gathering. Registered teams and solo contenders must report to check-in on time.'}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-b border-[#33343b] py-4">
                        <div>
                          <div className="font-label-mono-sm text-[#8f96a3] uppercase text-xs">Format</div>
                          <div className="font-headline-sm text-white mt-0.5">{nearestEvent.format}</div>
                          <div className="font-label-mono-sm text-[#8f96a3] text-[11px]">{nearestEvent.formatSub}</div>
                        </div>
                        <div>
                          <div className="font-label-mono-sm text-[#8f96a3] uppercase text-xs">Slots Status</div>
                          <div className="font-headline-sm text-[#cdf200] mt-0.5">
                            {nearestEvent.slotsFilled ? `${nearestEvent.slotsFilled}/${nearestEvent.slotsTotal} SLOTS FILLED` : 'OPEN REGISTRATION'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 pt-2">
                      <button
                        onClick={() => openModal('register', nearestEvent)}
                        className="bg-[#cdf200] text-[#0a0b0e] hover:bg-white px-6 py-3 font-label-caps uppercase font-bold transition-colors duration-150 flex items-center gap-2 text-sm"
                      >
                        <span>REGISTER FOR THIS EVENT</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openModal('rules')}
                        className="border border-[#33343b] bg-[#111319] hover:border-white text-white px-6 py-3 font-label-caps uppercase transition-colors duration-150 text-sm"
                      >
                        RULES & GUIDELINES
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Empty Spotlight State */
              <div className="border border-[#33343b] bg-[#191b22] p-10 text-center space-y-4">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-[#0c0e14] border border-[#33343b] text-[#cdf200]">
                  <Trophy className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-headline-md uppercase text-white">
                    NO ACTIVE UPCOMING SPOTLIGHT EVENT
                  </h3>
                  <p className="font-body-md text-[#8f96a3] max-w-xl mx-auto">
                    All scheduled tournaments have concluded or are in the Event Archive. Once new tournament dates are published, the nearest event will automatically spotlight here.
                  </p>
                </div>
                <div className="pt-2 flex flex-wrap justify-center gap-3">
                  {archivedEvents.length > 0 && (
                    <button
                      onClick={() => setViewTab('archive')}
                      className="bg-[#cdf200] text-[#0a0b0e] hover:bg-white px-6 py-2.5 font-label-caps uppercase text-xs tracking-wider font-bold transition-colors flex items-center gap-2"
                    >
                      <Archive className="w-4 h-4" />
                      <span>VIEW EVENT ARCHIVE ({archivedEvents.length})</span>
                    </button>
                  )}
                  <button
                    onClick={() => openModal('proposal')}
                    className="bg-[#1d1f26] border border-[#33343b] hover:border-[#cdf200] text-white px-6 py-2.5 font-label-caps uppercase text-xs tracking-wider transition-colors"
                  >
                    PROPOSE AN EVENT IDEA
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* 3. Other Upcoming Events (Sorted by Time in Card Format) */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#33343b] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#cdf200]"></span>
                <h3 className="font-headline-md uppercase text-white tracking-wide">
                  Following Upcoming Events ({upcomingEvents.length})
                </h3>
              </div>

              {upcomingEvents.length > 0 && (
                <div className="relative sm:w-64">
                  <Search className="w-4 h-4 text-[#8f96a3] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter following events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#141720] border border-[#262a36] pl-9 pr-3 py-1.5 text-xs text-white font-body-sm focus:border-[#cdf200] outline-none"
                  />
                </div>
              )}
            </div>

            {upcomingEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUpcoming.map((item) => (
                  <div
                    key={item.id}
                    className="border border-[#33343b] bg-[#191b22] hover:border-[#cdf200] transition-colors p-6 flex flex-col justify-between space-y-4"
                  >
                    {item.posterUrl && (
                      <div className="relative aspect-[1440/1350] w-full overflow-hidden border border-[#33343b]">
                        <Image
                          src={item.posterUrl}
                          alt={`${item.title} event poster`}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-[#33343b] pb-2 font-label-mono-sm text-xs">
                        <span className="text-[#cdf200] font-bold">{item.discipline}</span>
                        <span className="text-[#8f96a3]">{item.dateStr}</span>
                      </div>

                      <h4 className="font-headline-sm uppercase text-white leading-snug">
                        {item.title}
                      </h4>

                      <div className="space-y-1 text-xs font-label-mono-sm text-[#8f96a3]">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#cdf200]" />
                          <span>{formatEventTime(item)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#cdf200]" />
                          <span>{item.location}</span>
                        </div>
                      </div>

                      <p className="font-body-sm whitespace-pre-wrap text-[#8f96a3]">
                        {item.description || item.format}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-[#33343b] flex items-center justify-between">
                      <span className="font-label-mono-sm text-xs text-[#cdf200] border border-[#33343b] px-2 py-0.5">
                        {item.statusBadge}
                      </span>
                      <button
                        onClick={() => openModal('register', item)}
                        className="bg-[#1d1f26] border border-[#33343b] hover:border-[#cdf200] text-white px-3 py-1 font-label-caps uppercase text-xs transition-colors"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty Following Events State */
              <div className="border border-[#33343b] bg-[#191b22] p-8 text-center space-y-2">
                <div className="font-headline-sm uppercase text-[#e2e2ea]">
                  NO OTHER UPCOMING EVENTS
                </div>
                <p className="font-body-sm text-[#8f96a3] max-w-lg mx-auto">
                  All further fixtures, tournament dates, and scrimmage blocks will appear here in chronological order once published by administrators.
                </p>
              </div>
            )}
          </section>
        </>
      )}

      {/* 4. Host or Propose an Event Card */}
      <section className="border border-[#33343b] bg-[#1d1f26] p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="max-w-2xl space-y-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-[#cdf200]" />
            <span className="font-label-mono-sm text-[#cdf200] uppercase text-xs">
              STUDENT INITIATIVES • CAMPUS GRANTS
            </span>
          </div>
          <h3 className="font-headline-lg uppercase text-white leading-tight">
            Have an idea for a tournament or game night?
          </h3>
          <p className="font-body-md text-[#8f96a3]">
            Club members can propose events and get full club support with room bookings, console setups, projection equipment, and marketing through official campus channels.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full md:w-auto">
          <button
            onClick={() => openModal('proposal')}
            className="bg-[#cdf200] text-[#0a0b0e] hover:bg-white px-6 py-3 font-label-caps uppercase font-bold transition-colors duration-150 text-center text-sm"
          >
            Submit Event Proposal
          </button>
          <Link
            href="/contact"
            className="border border-[#33343b] bg-[#111319] hover:border-white text-white px-6 py-3 font-label-caps uppercase transition-colors duration-150 text-center text-sm"
          >
            Talk to Events Officer
          </Link>
        </div>
      </section>
    </main>
  );
}
