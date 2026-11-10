'use client';

import React, { useEffect, useState } from 'react';
import { useEsportsModal } from '@/context/ModalContext';
import type { ClubTeamMember } from '@/data/esportsData';
import { 
  X, Check, Trophy, Calendar, MapPin, Users, ShieldAlert, 
  ExternalLink, Tv, Radio, Send, Download, Sparkles, MessageSquare 
} from 'lucide-react';

export default function EsportsModals() {
  const { activeModal, modalData, closeModal, showToast, playTacticalSound } = useEsportsModal();
  type TicketPass = {
    teamName: string;
    captainName: string;
    email: string;
    discord: string;
    game: string;
    hasGear: string;
    seedCode: string;
    timestamp: string;
    tournament: string;
  };
  const [rosterMembers, setRosterMembers] = useState<ClubTeamMember[]>([]);

  // Registration Form State
  const [regData, setRegData] = useState({
    teamName: '',
    captainName: '',
    email: '',
    discord: '',
    game: 'Smash Ultimate (1v1)',
    hasGear: 'yes',
  });
  const [ticketPass, setTicketPass] = useState<TicketPass | null>(null);

  useEffect(() => {
    if (activeModal !== 'roster') return;
    let active = true;
    void fetch('/api/members', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load roster.');
        const data = await response.json();
        if (active && Array.isArray(data.members)) setRosterMembers(data.members as ClubTeamMember[]);
      })
      .catch((error: unknown) => {
        console.error('Unable to refresh team roster:', error instanceof Error ? error.name : 'Unknown error');
      });
    return () => {
      active = false;
    };
  }, [activeModal]);

  // Proposal State
  const [proposalData, setProposalData] = useState({
    title: '',
    proposer: '',
    email: '',
    estimatedTurnout: '24-48 students',
    description: '',
  });

  // Roster Proposal State
  const [rosterGame, setRosterGame] = useState({
    gameName: '',
    captainName: '',
    studentCount: '10+ players',
    notes: '',
  });

  if (!activeModal) return null;

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playTacticalSound('success');
    const seedCode = 'APX-' + Math.floor(100000 + Math.random() * 900000);
    const pass = {
      ...regData,
      seedCode,
      timestamp: new Date().toLocaleString(),
      tournament: modalData?.title || 'Annual Fall Campus LAN Party',
    };
    setTicketPass(pass);
    showToast(`Pre-registration confirmed! Entry Pass #${seedCode} generated.`, 'success');
  };

  const handleProposalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playTacticalSound('success');
    showToast('Event proposal submitted to Campus Student Activities committee!', 'success');
    closeModal();
  };

  const handleRosterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playTacticalSound('success');
    showToast('Campus roster proposal logged in Executive Officer Review queue!', 'success');
    closeModal();
  };

  const downloadCalendarICS = (eventTitle: string, dateStr: string) => {
    playTacticalSound('click');
    const icsData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//BITPeSports//Campus Event//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
SUMMARY:${eventTitle}
DESCRIPTION:Official BITPeSports gathering at Student Union Lounge Rm 204.
LOCATION:Student Union Room 204, Campus Gaming Hub
STATUS:CONFIRMED
DTSTART:20251114T230000Z
DTEND:20251115T030000Z
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${eventTitle.toLowerCase().replace(/\s+/g, '-')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Calendar invitation (.ics) downloaded for ${eventTitle}!`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0b0e]/90 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-none">
      <div 
        className="relative w-full max-w-3xl bg-[#12141a] border border-[#262a36] shadow-2xl my-8 overflow-hidden text-[#e2e2ea]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="bg-[#1a1d26] border-b border-[#262a36] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#cdf200]"></span>
            <span className="font-label-mono-sm text-[#cdf200] uppercase tracking-wider font-bold">
              {activeModal === 'register' && 'COMPETITION ENTRY // PRE-REGISTRATION'}
              {activeModal === 'bracket' && 'TOURNAMENT MATRIX // LIVE BRACKET'}
              {activeModal === 'rules' && 'REGULATION MANUAL // TOURNAMENT PROTOCOL'}
              {activeModal === 'stream' && 'BROADCAST FEED // TWITCH OPERATIONS'}
              {activeModal === 'roster' && 'ATHLETE DOSSIER // STARTING FIVE'}
              {activeModal === 'proposal' && 'CAMPUS INITIATIVE // EVENT PROPOSAL'}
              {activeModal === 'roster-proposal' && 'NEW ROSTER PETITION // DIVISION CREATION'}
              {activeModal === 'login' && 'CAMPUS AUTHENTICATION // PORTAL ACCESS'}
            </span>
          </div>
          <button
            onClick={closeModal}
            className="text-[#8f96a3] hover:text-white border border-[#33343b] hover:border-[#cdf200] p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8 max-h-[80vh] overflow-y-auto">

          {/* 1. TOURNAMENT REGISTRATION MODAL */}
          {activeModal === 'register' && (
            <div>
              {!ticketPass ? (
                <div>
                  <div className="mb-6 border-b border-[#262a36] pb-4">
                    <span className="font-label-mono-sm text-[#8f96a3] uppercase">EVENT IDENTIFIER</span>
                    <h2 className="font-headline-lg uppercase text-white mt-1">
                      {modalData?.title || 'Annual Fall Campus LAN Party & Open Tournament'}
                    </h2>
                    <p className="font-body-sm text-[#8f96a3] mt-1">
                      Student Union Great Hall • Free entry for verified undergraduate & graduate students.
                    </p>
                  </div>

                  <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-label-mono-sm uppercase text-[#8f96a3] mb-1">
                          Team Name / Player GamerTag <span className="text-[#cdf200]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={regData.teamName}
                          onChange={(e) => setRegData({ ...regData, teamName: e.target.value })}
                          placeholder="e.g. BITPeSports Vanguard // 'Nova'"
                          className="w-full bg-[#191b22] border border-[#262a36] px-3 py-2 text-white font-body-md focus:border-[#cdf200] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-label-mono-sm uppercase text-[#8f96a3] mb-1">
                          Captain Legal Name <span className="text-[#cdf200]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={regData.captainName}
                          onChange={(e) => setRegData({ ...regData, captainName: e.target.value })}
                          placeholder="e.g. Alex Chen"
                          className="w-full bg-[#191b22] border border-[#262a36] px-3 py-2 text-white font-body-md focus:border-[#cdf200] outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-label-mono-sm uppercase text-[#8f96a3] mb-1">
                          University Email (.edu) <span className="text-[#cdf200]">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={regData.email}
                          onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                          placeholder="student@university.edu"
                          className="w-full bg-[#191b22] border border-[#262a36] px-3 py-2 text-white font-body-md focus:border-[#cdf200] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-label-mono-sm uppercase text-[#8f96a3] mb-1">
                          Discord Handle <span className="text-[#cdf200]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={regData.discord}
                          onChange={(e) => setRegData({ ...regData, discord: e.target.value })}
                          placeholder="username#0000"
                          className="w-full bg-[#191b22] border border-[#262a36] px-3 py-2 text-white font-body-md focus:border-[#cdf200] outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-label-mono-sm uppercase text-[#8f96a3] mb-1">
                          Tournament Discipline
                        </label>
                        <select
                          value={regData.game}
                          onChange={(e) => setRegData({ ...regData, game: e.target.value })}
                          className="w-full bg-[#191b22] border border-[#262a36] px-3 py-2 text-white font-body-md focus:border-[#cdf200] outline-none"
                        >
                          <option value="Smash Ultimate (1v1)">Super Smash Bros. Ultimate (1v1)</option>
                          <option value="Valorant (5v5)">Valorant (5v5 Team)</option>
                          <option value="Rocket League (3v3)">Rocket League (3v3)</option>
                          <option value="Casual Free Play Stations">Casual Free Play / Console Pass</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-label-mono-sm uppercase text-[#8f96a3] mb-1">
                          BYOC Controller / Peripherals
                        </label>
                        <select
                          value={regData.hasGear}
                          onChange={(e) => setRegData({ ...regData, hasGear: e.target.value })}
                          className="w-full bg-[#191b22] border border-[#262a36] px-3 py-2 text-white font-body-md focus:border-[#cdf200] outline-none"
                        >
                          <option value="yes">Yes, bringing my own controller / headset</option>
                          <option value="no">Need to borrow club loaner controller</option>
                        </select>
                      </div>
                    </div>

                    <div className="border border-[#262a36] bg-[#0c0e14] p-3 text-[#8f96a3] font-label-mono-sm text-[12px] flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#cdf200] shrink-0"></span>
                      <span>By registering, you agree to report to Room 204 / Great Hall check-in desk 30 minutes prior to bracket roll.</span>
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <button
                        type="submit"
                        className="w-full sm:w-auto bg-[#cdf200] text-[#0a0b0e] font-label-caps font-bold px-8 py-3 uppercase tracking-wider hover:bg-white transition-colors"
                      >
                        CONFIRM PRE-REGISTRATION
                      </button>
                      <span className="font-label-mono-sm text-[#8f96a3]">SLOTS REMAINING: 30 / 64</span>
                    </div>
                  </form>
                </div>
              ) : (
                /* Ticket Pass Generated */
                <div className="space-y-6">
                  <div className="border-2 border-[#cdf200] bg-[#0c0e14] p-6 relative">
                    <div className="flex justify-between items-start border-b border-[#262a36] pb-4">
                      <div>
                        <span className="bg-[#cdf200] text-[#0c0e14] font-label-mono-sm font-bold px-2 py-0.5 uppercase">
                          OFFICIAL MATCH PASS
                        </span>
                        <h3 className="font-headline-md uppercase text-white mt-2">
                          {ticketPass.tournament}
                        </h3>
                        <div className="font-label-mono-sm text-[#cdf200]">
                          ENTRY SEED CODE: {ticketPass.seedCode}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-label-mono-sm text-[#8f96a3]">CHECK-IN STATUS</div>
                        <div className="font-label-caps text-[#00e599] font-bold text-lg">CONFIRMED</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-[#262a36]">
                      <div>
                        <div className="font-label-mono-sm text-[#8f96a3]">COMPETITOR</div>
                        <div className="font-headline-sm uppercase text-white">{ticketPass.teamName}</div>
                      </div>
                      <div>
                        <div className="font-label-mono-sm text-[#8f96a3]">DISCIPLINE</div>
                        <div className="font-body-sm text-white">{ticketPass.game}</div>
                      </div>
                      <div>
                        <div className="font-label-mono-sm text-[#8f96a3]">CAPTAIN</div>
                        <div className="font-body-sm text-white">{ticketPass.captainName}</div>
                      </div>
                      <div>
                        <div className="font-label-mono-sm text-[#8f96a3]">DISCORD</div>
                        <div className="font-label-mono-sm text-[#cdf200]">{ticketPass.discord}</div>
                      </div>
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="font-label-mono-sm text-[#8f96a3] text-[11px]">
                        PRESENT THIS PASS AT STUDENT UNION ROOM 204 DESK FOR BADGE & RIG ASSIGNMENT.
                      </div>
                      <button
                        onClick={() => downloadCalendarICS(ticketPass.tournament, '2025-11-14')}
                        className="bg-[#1d1f26] border border-[#262a36] hover:border-[#cdf200] px-4 py-2 font-label-caps uppercase text-white flex items-center gap-2"
                      >
                        <Calendar className="w-4 h-4 text-[#cdf200]" />
                        <span>EXPORT TO CALENDAR</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setTicketPass(null)}
                      className="border border-[#262a36] px-5 py-2 font-label-caps text-[#8f96a3] hover:text-white"
                    >
                      REGISTER ANOTHER ENTRANT
                    </button>
                    <button
                      onClick={closeModal}
                      className="bg-[#cdf200] text-[#0c0e14] px-6 py-2 font-label-caps font-bold uppercase hover:bg-white"
                    >
                      DONE & RETURN
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. BRACKET DETAILS MODAL */}
          {activeModal === 'bracket' && (
            <div className="space-y-6">
              <div className="border-b border-[#262a36] pb-3 flex justify-between items-end">
                <div>
                  <span className="font-label-mono-sm text-[#cdf200] uppercase">SSBU WEEKLY LOCAL #14</span>
                  <h3 className="font-headline-lg uppercase text-white">DOUBLE ELIMINATION BRACKET</h3>
                </div>
                <span className="font-label-mono-sm text-[#8f96a3]">STAGE: QUARTERFINALS</span>
              </div>

              {/* Bracket Visualization Grid */}
              <div className="overflow-x-auto pb-4">
                <div className="min-w-[650px] grid grid-cols-3 gap-6">
                  {/* Column 1: Quarterfinals */}
                  <div className="space-y-4">
                    <div className="font-label-mono-sm text-[#8f96a3] border-b border-[#262a36] pb-1">
                      WINNERS QUARTERS (BO3)
                    </div>
                    
                    <div className="border border-[#262a36] bg-[#0c0e14] p-3 space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-headline-sm uppercase text-[#cdf200]">ApexFox (Fox)</span>
                        <span className="font-label-mono-sm font-bold text-white">2</span>
                      </div>
                      <div className="flex justify-between items-center text-sm border-t border-[#1f232d] pt-1">
                        <span className="font-headline-sm uppercase text-[#8f96a3]">K-Rool_King</span>
                        <span className="font-label-mono-sm text-[#8f96a3]">0</span>
                      </div>
                    </div>

                    <div className="border border-[#262a36] bg-[#0c0e14] p-3 space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-headline-sm uppercase text-[#cdf200]">ShadowFox</span>
                        <span className="font-label-mono-sm font-bold text-white">2</span>
                      </div>
                      <div className="flex justify-between items-center text-sm border-t border-[#1f232d] pt-1">
                        <span className="font-headline-sm uppercase text-[#8f96a3]">ZeldaMain22</span>
                        <span className="font-label-mono-sm text-[#8f96a3]">1</span>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Semifinals */}
                  <div className="space-y-4">
                    <div className="font-label-mono-sm text-[#8f96a3] border-b border-[#262a36] pb-1">
                      WINNERS FINALS (BO5)
                    </div>
                    
                    <div className="border border-[#cdf200] bg-[#1d1f26] p-4 space-y-2 mt-6">
                      <div className="flex justify-between items-center">
                        <span className="font-headline-sm uppercase text-white font-bold">ApexFox</span>
                        <span className="font-label-mono-lg font-bold text-[#cdf200]">3</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-[#262a36] pt-1">
                        <span className="font-headline-sm uppercase text-[#8f96a3]">ShadowFox</span>
                        <span className="font-label-mono-lg text-[#8f96a3]">1</span>
                      </div>
                      <div className="text-[11px] font-label-mono-sm text-[#00e599] pt-1">
                        Advancing to Grand Finals
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Grand Finals */}
                  <div className="space-y-4">
                    <div className="font-label-mono-sm text-[#cdf200] border-b border-[#262a36] pb-1">
                      GRAND FINALS (BO5 + RESET)
                    </div>
                    
                    <div className="border-2 border-[#cdf200] bg-[#0c0e14] p-4 space-y-3 mt-10">
                      <div className="flex items-center gap-2 text-[#cdf200] font-label-mono-sm">
                        <Trophy className="w-4 h-4" />
                        <span>CHAMPIONSHIP STAGE</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-headline-sm uppercase text-white font-bold">ApexFox [W]</span>
                        <span className="font-label-mono-lg font-bold text-[#cdf200]">--</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-[#262a36] pt-1">
                        <span className="font-headline-sm uppercase text-[#8f96a3]">TBD [Losers Winner]</span>
                        <span className="font-label-mono-lg text-[#8f96a3]">--</span>
                      </div>
                      <div className="font-label-mono-sm text-[#8f96a3] text-[11px]">
                        Match scheduled for 8:45 PM in Rm 204
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-[#262a36] pt-4">
                <span className="font-label-mono-sm text-[#8f96a3]">
                  Tournament Director: Alex &quot;ApexFox&quot; Miller • SSBU Ruleset v2.4
                </span>
                <button
                  onClick={closeModal}
                  className="bg-[#cdf200] text-[#0a0b0e] font-label-caps font-bold px-6 py-2 uppercase hover:bg-white"
                >
                  CLOSE MATRIX
                </button>
              </div>
            </div>
          )}

          {/* 3. RULES & GUIDELINES MODAL */}
          {activeModal === 'rules' && (
            <div className="space-y-6">
              <div className="border-b border-[#262a36] pb-3">
                <span className="font-label-mono-sm text-[#cdf200] uppercase">TOURNAMENT STANDARD CODE</span>
                <h3 className="font-headline-lg uppercase text-white mt-1">OFFICIAL <span className="normal-case">BITPeSports</span> COMPETITION RULEBOOK</h3>
              </div>

              <div className="space-y-4 font-body-sm text-[#8f96a3]">
                <div className="border border-[#262a36] bg-[#0c0e14] p-4">
                  <h4 className="font-headline-sm uppercase text-white mb-1">01 // STUDENT ELIGIBILITY & ID CARD</h4>
                  <p>All participants must be actively enrolled undergraduate or graduate university students with a valid physical student ID card tapped at check-in desk before their match bracket rolls.</p>
                </div>

                <div className="border border-[#262a36] bg-[#0c0e14] p-4">
                  <h4 className="font-headline-sm uppercase text-white mb-1">02 // BYOC & PERIPHERAL POLICY</h4>
                  <p>Students are encouraged to Bring Your Own Controller (BYOC), fightstick, or wired headset. Wireless controllers must be desynced immediately after completing sets to prevent interference with other tournament stations.</p>
                </div>

                <div className="border border-[#262a36] bg-[#0c0e14] p-4">
                  <h4 className="font-headline-sm uppercase text-white mb-1">03 // DISQUALIFICATION & TIMEOUTS</h4>
                  <p>Players called for their match have a strict 10-minute grace window to report to their designated PC rig or console pod. Failure to report results in an automatic match forfeit to the losers bracket.</p>
                </div>

                <div className="border border-[#262a36] bg-[#0c0e14] p-4">
                  <h4 className="font-headline-sm uppercase text-white mb-1">04 // SPORTSMANSHIP & LOUNGE PROTOCOL</h4>
                  <p>Toxic behavior, verbal abuse, intentional equipment tampering, or unauthorized software installation will result in immediate campus security report, tournament DQ, and lounge access revocation.</p>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-[#262a36]">
                <button
                  onClick={closeModal}
                  className="bg-[#cdf200] text-[#0a0b0e] font-label-caps font-bold px-6 py-2.5 uppercase hover:bg-white"
                >
                  I ACKNOWLEDGE THE RULES
                </button>
              </div>
            </div>
          )}

          {/* 4. STREAM MODAL */}
          {activeModal === 'stream' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-[#262a36] pb-3">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[#ff3344] animate-pulse" />
                  <span className="font-label-mono-sm text-[#ff3344] font-bold uppercase">LIVE ON TWITCH</span>
                  <span className="text-[#8f96a3]">|</span>
                  <span className="font-headline-sm uppercase text-white"><span className="normal-case">BITPeSports</span>{' // BROADCAST OPS'}</span>
                </div>
                <div className="font-label-mono-sm text-[#8f96a3]">1080P60 // 6000 KBPS</div>
              </div>

              {/* Stream Simulated Player */}
              <div className="relative aspect-video bg-[#0c0e14] border border-[#262a36] overflow-hidden flex flex-col justify-between p-4 scanlines">
                <div className="flex justify-between items-start z-10">
                  <div className="bg-[#ff3344] text-white px-2 py-0.5 font-label-mono-sm font-bold flex items-center gap-1.5 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                    LIVE BROADCAST
                  </div>
                  <div className="bg-[#12141a]/90 border border-[#262a36] px-3 py-1 font-label-mono-sm text-[#cdf200] text-xs">
                    MATCH: <span className="normal-case">BITPeSports</span> 13 - 9 STATE TECH (MAP 3)
                  </div>
                </div>

                {/* Center Broadcast Branding */}
                <div className="text-center z-10 space-y-1">
                  <div className="font-display-hero-mobile text-[#cdf200] tracking-wider drop-shadow-md">
                    <span className="normal-case">BITPeSports</span> BROADCAST
                  </div>
                  <p className="font-label-mono-sm text-[#8f96a3]">
                    CASTERS: SAM &quot;SPECTRE&quot; K. &amp; ELENA &quot;NOVA&quot; S. • ECAC VARSITY SHOWCASE
                  </p>
                </div>

                <div className="flex justify-between items-end z-10 font-label-mono-sm text-xs text-[#8f96a3]">
                  <span>VENUE: STUDENT UNION BROADCAST DESK RM 204</span>
                  <span className="text-[#00e599]">CURRENT AUDIENCE: 428 VIEWERS</span>
                </div>
              </div>

              {/* Simulated Twitch Chat */}
              <div className="border border-[#262a36] bg-[#0c0e14] p-3 space-y-2 font-label-mono-sm text-xs max-h-36 overflow-y-auto">
                <div><span className="text-[#cdf200]">campus_fan01:</span> let&apos;s go BITPeSports!! big clutch in haven B site!</div>
                <div><span className="text-[#8f96a3]">ecac_mod:</span> Reminder: Next match starts at 9:00 PM EST!</div>
                <div><span className="text-[#cde7f2]">dorm_warrior:</span> Cipher&apos;s aim is insane today, 28 kills already</div>
                <div><span className="text-[#cdf200]">nova_hype:</span> student union lounge is packed right now watching on the big screen!</div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <a
                  href="https://twitch.tv"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#1d1f26] border border-[#262a36] text-white px-4 py-2 font-label-caps uppercase text-xs flex items-center gap-2 hover:border-[#cdf200]"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#cdf200]" />
                  <span>OPEN IN TWITCH APP</span>
                </a>
                <button
                  onClick={closeModal}
                  className="bg-[#cdf200] text-[#0a0b0e] font-label-caps font-bold px-6 py-2 uppercase hover:bg-white text-xs"
                >
                  RETURN TO SITE
                </button>
              </div>
            </div>
          )}

          {/* 5. ROSTER LINEUP MODAL */}
          {activeModal === 'roster' && (
            <div className="space-y-6">
              <div className="border-b border-[#262a36] pb-3 flex justify-between items-end">
                <div>
                  <span className="font-label-mono-sm text-[#cdf200] uppercase">COLLEGIATE VARSITY DIRECTORY</span>
                  <h3 className="font-headline-lg uppercase text-white mt-1"><span className="normal-case">BITPeSports</span> ACTIVE SQUAD</h3>
                </div>
                <span className="font-label-mono-sm text-[#8f96a3]">CONFERENCE: ECAC / CRL</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {rosterMembers.length > 0 ? rosterMembers.map((member) => (
                  <div key={member.id} className="border border-[#262a36] bg-[#0c0e14] p-4 space-y-2">
                    <div className="flex justify-between items-center font-label-mono-sm">
                      <span className="text-[#cdf200]">{member.role}</span>
                      <span className="text-[#8f96a3]">{member.gameSlug}</span>
                    </div>
                    <h4 className="font-headline-md uppercase text-white">{member.handle || member.name}</h4>
                    <div className="font-body-sm text-[#8f96a3]">{member.name} • {member.yearMajor}</div>
                    <div className="border-t border-[#1f232d] pt-2 text-[11px] font-label-mono-sm text-[#8f96a3]">
                      {member.tag}
                    </div>
                  </div>
                )) : (
                  <div className="border border-[#262a36] bg-[#0c0e14] p-4 text-sm text-[#8f96a3] sm:col-span-2 md:col-span-3">
                    No roster members have been published yet. Check back after the club updates its team roster.
                  </div>
                )}
              </div>

              <div className="border border-[#262a36] bg-[#191b22] p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <span className="font-label-mono-sm text-[#8f96a3]">
                  Want to try out for varsity or reserve sub positions? Tryouts open each semester start.
                </span>
                <a
                  href="https://discord.gg/apexesports"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#cdf200] text-[#0a0b0e] font-label-caps font-bold px-6 py-2 uppercase hover:bg-white text-xs shrink-0"
                >
                  JOIN TRYOUT DISCORD
                </a>
              </div>
            </div>
          )}

          {/* 6. PROPOSAL MODAL */}
          {activeModal === 'proposal' && (
            <div>
              <div className="mb-4 border-b border-[#262a36] pb-3">
                <span className="font-label-mono-sm text-[#cdf200] uppercase">STUDENT INITIATIVES • CAMPUS GRANTS</span>
                <h3 className="font-headline-lg uppercase text-white mt-1">SUBMIT CAMPUS EVENT PROPOSAL</h3>
                <p className="font-body-sm text-[#8f96a3]">
                  Propose a new tournament, charity stream, or campus LAN to the BITPeSports Executive Board for equipment, room booking, and grant funding.
                </p>
              </div>

              <form onSubmit={handleProposalSubmit} className="space-y-4">
                <div>
                  <label className="block font-label-mono-sm uppercase text-[#8f96a3] mb-1">
                    Proposed Event Title <span className="text-[#cdf200]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={proposalData.title}
                    onChange={(e) => setProposalData({ ...proposalData, title: e.target.value })}
                    placeholder="e.g. 24-Hour Charity Mario Kart Derby"
                    className="w-full bg-[#191b22] border border-[#262a36] px-3 py-2 text-white font-body-md focus:border-[#cdf200] outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-label-mono-sm uppercase text-[#8f96a3] mb-1">
                      Proposer Name & Major <span className="text-[#cdf200]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={proposalData.proposer}
                      onChange={(e) => setProposalData({ ...proposalData, proposer: e.target.value })}
                      placeholder="e.g. Marcus Chen (CS Junior)"
                      className="w-full bg-[#191b22] border border-[#262a36] px-3 py-2 text-white font-body-md focus:border-[#cdf200] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-label-mono-sm uppercase text-[#8f96a3] mb-1">
                      Expected Student Turnout
                    </label>
                    <select
                      value={proposalData.estimatedTurnout}
                      onChange={(e) => setProposalData({ ...proposalData, estimatedTurnout: e.target.value })}
                      className="w-full bg-[#191b22] border border-[#262a36] px-3 py-2 text-white font-body-md focus:border-[#cdf200] outline-none"
                    >
                      <option value="12-24 students">12 - 24 students (Rm 204 Lounge)</option>
                      <option value="24-48 students">24 - 48 students (Multi-pod)</option>
                      <option value="48-100+ students">48 - 100+ students (Great Hall LAN)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-label-mono-sm uppercase text-[#8f96a3] mb-1">
                    Event Overview & Equipment Needed <span className="text-[#cdf200]">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={proposalData.description}
                    onChange={(e) => setProposalData({ ...proposalData, description: e.target.value })}
                    placeholder="Describe tournament format, games, projectors, or console setups requested..."
                    className="w-full bg-[#191b22] border border-[#262a36] p-3 text-white font-body-md focus:border-[#cdf200] outline-none"
                  ></textarea>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="border border-[#262a36] px-5 py-2 font-label-caps text-[#8f96a3] hover:text-white"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="bg-[#cdf200] text-[#0a0b0e] font-label-caps font-bold px-8 py-2.5 uppercase hover:bg-white"
                  >
                    DISPATCH PROPOSAL
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 7. ROSTER PROPOSAL MODAL */}
          {activeModal === 'roster-proposal' && (
            <div>
              <div className="mb-4 border-b border-[#262a36] pb-3">
                <span className="font-label-mono-sm text-[#cdf200] uppercase">NEW DIVISION PETITION</span>
                <h3 className="font-headline-lg uppercase text-white mt-1">PROPOSE A CAMPUS ROSTER</h3>
                <p className="font-body-sm text-[#8f96a3]">
                  Have an active student squad playing Counter-Strike 2, Rainbow Six, Apex Legends, or fighting games? Propose an official division.
                </p>
              </div>

              <form onSubmit={handleRosterSubmit} className="space-y-4">
                <div>
                  <label className="block font-label-mono-sm uppercase text-[#8f96a3] mb-1">
                    Game Title <span className="text-[#cdf200]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={rosterGame.gameName}
                    onChange={(e) => setRosterGame({ ...rosterGame, gameName: e.target.value })}
                    placeholder="e.g. Counter-Strike 2, Rainbow Six Siege, Tekken 8"
                    className="w-full bg-[#191b22] border border-[#262a36] px-3 py-2 text-white font-body-md focus:border-[#cdf200] outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-label-mono-sm uppercase text-[#8f96a3] mb-1">
                      Lead Organizer / Captain Name <span className="text-[#cdf200]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={rosterGame.captainName}
                      onChange={(e) => setRosterGame({ ...rosterGame, captainName: e.target.value })}
                      placeholder="e.g. David Vance"
                      className="w-full bg-[#191b22] border border-[#262a36] px-3 py-2 text-white font-body-md focus:border-[#cdf200] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-label-mono-sm uppercase text-[#8f96a3] mb-1">
                      Active Campus Interest
                    </label>
                    <select
                      value={rosterGame.studentCount}
                      onChange={(e) => setRosterGame({ ...rosterGame, studentCount: e.target.value })}
                      className="w-full bg-[#191b22] border border-[#262a36] px-3 py-2 text-white font-body-md focus:border-[#cdf200] outline-none"
                    >
                      <option value="5-10 players">5 - 10 players ready to scrim</option>
                      <option value="10-20 players">10 - 20 players (Full Squad + Subs)</option>
                      <option value="20+ players">20+ players (Intramural League)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-label-mono-sm uppercase text-[#8f96a3] mb-1">
                    League or Scrim Opportunities <span className="text-[#cdf200]">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={rosterGame.notes}
                    onChange={(e) => setRosterGame({ ...rosterGame, notes: e.target.value })}
                    placeholder="List collegiate leagues (e.g. NACE, ECAC, CSL) or scrimmage groups you plan to compete in..."
                    className="w-full bg-[#191b22] border border-[#262a36] p-3 text-white font-body-md focus:border-[#cdf200] outline-none"
                  ></textarea>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="border border-[#262a36] px-5 py-2 font-label-caps text-[#8f96a3] hover:text-white"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="bg-[#cdf200] text-[#0a0b0e] font-label-caps font-bold px-8 py-2.5 uppercase hover:bg-white"
                  >
                    PETITION DIVISION
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 8. CAMPUS AUTHENTICATION / LOGIN MODAL */}
          {activeModal === 'login' && (
            <div className="space-y-6">
              <div className="border-b border-[#262a36] pb-3">
                <span className="font-label-mono-sm text-[#cdf200] uppercase text-xs">PORTAL ACCESS GATEWAY</span>
                <h3 className="font-headline-lg uppercase text-white mt-1">MEMBER & ADMIN LOGIN</h3>
                <p className="font-body-sm text-[#8f96a3]">
                  Enter your student credentials or administrative key to access roster management, tournament brackets, and live telemetry feeds.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  playTacticalSound('success');
                  showToast('Authentication successful! Welcome to BITPeSports Terminal.', 'success');
                  closeModal();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block font-label-mono-sm uppercase text-[#8f96a3] mb-1 text-xs">
                    Student ID / University Email (.edu) <span className="text-[#cdf200]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. s1082914 or user@university.edu"
                    className="w-full bg-[#191b22] border border-[#262a36] px-4 py-2.5 text-white font-body-md focus:border-[#cdf200] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-label-mono-sm uppercase text-[#8f96a3] mb-1 text-xs">
                    Access Password / Admin Key <span className="text-[#cdf200]">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    className="w-full bg-[#191b22] border border-[#262a36] px-4 py-2.5 text-white font-body-md focus:border-[#cdf200] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-label-mono-sm uppercase text-[#8f96a3] mb-1 text-xs">
                    Portal Access Role
                  </label>
                  <select
                    className="w-full bg-[#191b22] border border-[#262a36] px-4 py-2.5 text-white font-body-md focus:border-[#cdf200] outline-none"
                  >
                    <option value="member">Student Member / Athlete</option>
                    <option value="captain">Team Captain (FC, Val, FF, BGMI)</option>
                    <option value="admin">Executive Officer / Tournament Admin</option>
                  </select>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <button
                    type="submit"
                    className="w-full sm:w-auto bg-[#cdf200] text-[#0a0b0e] font-label-caps font-bold px-8 py-3 uppercase tracking-wider hover:bg-white text-sm"
                  >
                    AUTHENTICATE & ENTER
                  </button>
                  <a
                    href="https://discord.gg/bitpesports"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto text-center border border-[#33343b] hover:border-[#cdf200] text-[#e2e2ea] font-label-caps px-6 py-3 uppercase text-sm"
                  >
                    LOGIN VIA DISCORD
                  </a>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
