'use client';

import React, { useState } from 'react';
import { useEsportsModal } from '@/context/ModalContext';
import { FAQS, CONTACT_INFO } from '@/data/esportsData';
import { 
  Send, CheckCircle, Radio, Copy, Check, ChevronDown, 
  HelpCircle, MessageSquare, Mail, MapPin, Clock, ExternalLink, AlertCircle 
} from 'lucide-react';

export default function ContactPage() {
  const { showToast, playTacticalSound } = useEsportsModal();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: '',
    game: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedDispatch, setSubmittedDispatch] = useState<{
    dispatchId: string;
    notificationSent: boolean;
  } | null>(null);
  const [copiedChannel, setCopiedChannel] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playTacticalSound('click');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result: {
        success?: boolean;
        error?: string;
        dispatchId?: string;
        notificationSent?: boolean;
      } = await response.json();

      if (response.ok && result.success) {
        setSubmittedDispatch({
          dispatchId: result.dispatchId ?? '',
          notificationSent: result.notificationSent === true,
        });
        playTacticalSound('success');
        showToast(
          result.notificationSent
            ? 'Message received and club officers notified.'
            : 'Message received and available to club administrators.',
          'success'
        );
      } else {
        throw new Error(result.error || 'Failed to dispatch email');
      }
    } catch (err: unknown) {
      console.error('Contact message submission failed:', err instanceof Error ? err.name : 'Unknown error');
      playTacticalSound('beep');
      showToast(err instanceof Error ? err.message : 'Error transmitting dispatch.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedChannel(label);
    playTacticalSound('click');
    showToast(`Copied ${label} to clipboard!`, 'info');
    setTimeout(() => setCopiedChannel(null), 2000);
  };

  const toggleFaq = (id: string) => {
    playTacticalSound('click');
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <main className="flex-grow w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-8 space-y-16">
      {/* 1. PAGE HEADER */}
      <section className="border-b border-[#33343b] pb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-label-mono-sm text-[#cdf200] uppercase text-xs">
            COMMUNICATION // TERMINAL 04
          </span>
          <span className="w-2 h-2 rounded-full bg-[#cdf200] animate-pulse"></span>
        </div>
        <h1 className="font-headline-xl text-white uppercase tracking-tight text-4xl sm:text-5xl">
          GET IN TOUCH // <span className="normal-case">BITPeSports</span>
        </h1>
        <p className="font-body-lg text-[#8f96a3] max-w-3xl mt-2 leading-relaxed">
          Reach out for collegiate scrims, team tryouts, or general inquiries. Messages are saved to the club admin inbox, with email notifications when configured.
        </p>
      </section>

      {/* 2. TWO-COLUMN DIRECTORY & CONTACT FORM GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border border-[#33343b] bg-[#0c0e14] p-6 sm:p-8 md:p-10">
        {/* LEFT COLUMN: Touchpoints (Instagram & Mail Priority) */}
        <aside className="lg:col-span-5 flex flex-col justify-between space-y-8 border-b lg:border-b-0 lg:border-r border-[#33343b] lg:pr-8 pb-8 lg:pb-0">
          <div>
            <div className="border-b border-[#33343b] pb-2 mb-6">
              <h2 className="font-headline-sm uppercase text-white">DIRECTORY & DISPATCH</h2>
              <p className="font-label-mono-sm text-[#8f96a3] text-xs">
                PRIMARY TOUCHPOINTS FOR STUDENTS & COLLEGIATE TEAMS
              </p>
            </div>

            {/* Contact Channels List */}
            <div className="space-y-4">
              {/* Official Email Channel */}
              <div className="bg-[#191b22] border border-[#33343b] p-4 group hover:border-[#cdf200] transition-colors">
                <div className="flex justify-between items-center">
                  <span className="font-label-mono-sm text-[#cdf200] uppercase text-xs flex items-center gap-1.5 font-bold">
                    <Mail className="w-3.5 h-3.5" />
                    <span>OFFICIAL EMAIL</span>
                  </span>
                  <button
                    onClick={() => copyToClipboard(CONTACT_INFO.mail, 'Official Email')}
                    className="text-[#8f96a3] hover:text-[#cdf200] text-xs font-label-mono-sm flex items-center gap-1"
                  >
                    {copiedChannel === 'Official Email' ? <Check className="w-3 h-3 text-[#cdf200]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedChannel === 'Official Email' ? 'COPIED' : 'COPY'}</span>
                  </button>
                </div>
                <a
                  className="font-headline-sm text-white hover:text-[#cdf200] transition-colors block mt-1"
                  href={`mailto:${CONTACT_INFO.mail}`}
                >
                  {CONTACT_INFO.mail}
                </a>
                <span className="font-body-sm text-[#8f96a3] mt-1 block text-xs">
                  Saved to the admin inbox • Email notification when configured
                </span>
              </div>

              {/* Instagram Channel */}
              <div className="bg-[#191b22] border border-[#33343b] p-4 group hover:border-[#cdf200] transition-colors">
                <div className="flex justify-between items-center">
                  <span className="font-label-mono-sm text-[#cdf200] uppercase text-xs flex items-center gap-1.5 font-bold">
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>INSTAGRAM</span>
                  </span>
                  <a
                    href={CONTACT_INFO.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#8f96a3] hover:text-[#cdf200] text-xs font-label-mono-sm"
                  >
                    <span className="font-label-mono-sm text-[#0c0e14] bg-[#cdf200] font-bold px-1.5 py-0.5 text-[10px]">
                    FASTEST RESPONSE
                  </span>
                  </a>
                </div>
                <a
                  className="font-headline-sm text-white hover:text-[#cdf200] transition-colors block mt-1"
                  href={CONTACT_INFO.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {CONTACT_INFO.instagramHandle}
                </a>
                <span className="font-body-sm text-[#8f96a3] mt-1 block text-xs">
                  Highlights, tournament stories, and match announcements
                </span>
              </div>

              {/* Discord Community */}
              <div className="bg-[#191b22] border border-[#33343b] p-4 relative overflow-hidden group hover:border-[#cdf200] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-label-mono-sm text-[#cdf200] uppercase text-xs flex items-center gap-1.5 font-bold">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>DISCORD SERVER</span>
                  </span>
                </div>
                <a
                  className="font-headline-sm text-white hover:text-[#cdf200] transition-colors block mt-1"
                  href={CONTACT_INFO.discordUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  discord.gg/bitpesports.gg
                </a>
                <span className="font-body-sm text-[#8f96a3] mt-1 block text-xs">
                  Live team scrim coordination, student chats, LFG lobbies
                </span>
              </div>

            </div>
          </div>
        </aside>

        {/* RIGHT COLUMN: Contact Form with Mail Delivery Pipeline */}
        <section className="lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="border-b border-[#33343b] pb-2 mb-6">
              <h2 className="font-headline-sm uppercase text-white">DISPATCH MESSAGE</h2>
              <p className="font-label-mono-sm text-[#8f96a3] text-xs">
                MESSAGES ARE STORED IN THE ADMIN INBOX
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Field 1: Name */}
              <div>
                <label className="block font-label-mono-sm uppercase text-[#8f96a3] mb-1 text-xs">
                  Your Name (Student Name / Gamer Tag) <span className="text-[#cdf200]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder=""
                  className="w-full bg-[#191b22] border border-[#33343b] px-4 py-3 text-white font-body-md focus:border-[#cdf200] outline-none transition-colors"
                />
              </div>

              {/* Field 2: Email */}
              <div>
                <label className="block font-label-mono-sm uppercase text-[#8f96a3] mb-1 text-xs">
                  Email Address (.edu or personal email) <span className="text-[#cdf200]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. name@example.com"
                  className="w-full bg-[#191b22] border border-[#33343b] px-4 py-3 text-white font-body-md focus:border-[#cdf200] outline-none transition-colors"
                />
              </div>

              {/* Field 3: Inquiry Topic */}
              <div>
                <label className="block font-label-mono-sm uppercase text-[#8f96a3] mb-1 text-xs">
                  Inquiry Topic <span className="text-[#cdf200]">*</span>
                </label>
                <select
                  required
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  className="w-full bg-[#191b22] border border-[#33343b] px-4 py-3 text-white font-body-md focus:border-[#cdf200] outline-none transition-colors cursor-pointer"
                >
                  <option value="" disabled>Select an inquiry topic...</option>
                  <option value="joining">Joining the Club / General Membership</option>
                  <option value="tryouts">Competitive Varsity Tryouts (FC, Val, FF, BGMI)</option>
                  <option value="scrims">Intercollegiate Scrim Request (Collegiate Teams)</option>
                  <option value="event">Event Idea / Collaboration Proposal</option>
                  <option value="general">General Question</option>
                </select>
              </div>

              {/* Field 4: Game Title */}
              <div>
                <label className="block font-label-mono-sm uppercase text-[#8f96a3] mb-1 text-xs">
                  Game / Title
                </label>
                <select
                  value={formData.game}
                  onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                  className="w-full bg-[#191b22] border border-[#33343b] px-4 py-3 text-white font-body-md focus:border-[#cdf200] outline-none transition-colors cursor-pointer"
                >
                  <option value="">Select game title if applicable...</option>
                  <option value="ea_fc">EA Sports FC</option>
                  <option value="valorant">Valorant</option>
                  <option value="freefire">Free Fire Mobile</option>
                  <option value="bgmi">Battlegrounds Mobile India (BGMI)</option>
                  <option value="other">Other Title</option>
                </select>
              </div>

              {/* Field 5: Message */}
              <div>
                <label className="block font-label-mono-sm uppercase text-[#8f96a3] mb-1 text-xs">
                  Message Body <span className="text-[#cdf200]">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Provide your query, roster status, or scrimmage scheduling dates..."
                  className="w-full bg-[#191b22] border border-[#33343b] p-4 text-white font-body-md focus:border-[#cdf200] outline-none transition-colors resize-y"
                ></textarea>
              </div>

              {/* Submit Row */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-[#cdf200] text-[#0a0b0e] font-label-caps font-bold px-8 py-3.5 uppercase tracking-wider hover:bg-white transition-colors duration-150 text-sm flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'SENDING MESSAGE...' : 'SEND MESSAGE'}</span>
                </button>
              </div>

              {/* Delivery Confirmation Banner */}
              {submittedDispatch && (
                <div className="bg-[#1d1f26] border border-[#cdf200] p-4 mt-4 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-[#cdf200]" />
                    <span className="font-headline-sm text-[#cdf200] uppercase">
                      {submittedDispatch.notificationSent ? 'DISPATCH SENT TO CLUB OFFICERS' : 'MESSAGE RECEIVED'}
                    </span>
                  </div>
                  <p className="font-body-sm text-[#8f96a3] mt-1">
                    Your message reference is {submittedDispatch.dispatchId}. {submittedDispatch.notificationSent ? 'Club officers have been notified.' : 'Club administrators can review it in the admin inbox.'}
                  </p>
                </div>
              )}
            </form>
          </div>
        </section>
      </div>

      {/* 3. FREQUENTLY ASKED QUESTIONS SECTION */}
      <section className="border border-[#33343b] bg-[#0c0e14] p-6 sm:p-8 md:p-10 mb-8">
        <div className="border-b border-[#33343b] pb-2 mb-8 flex items-center justify-between">
          <div>
            <h2 className="font-headline-md uppercase text-white">FREQUENTLY ASKED QUESTIONS</h2>
            <p className="font-label-mono-sm text-[#8f96a3] text-xs">
              QUICK RECRUIT & SCRIM GUIDELINES
            </p>
          </div>
          <HelpCircle className="w-6 h-6 text-[#8f96a3] hidden sm:inline" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FAQS.map((faq) => {
            const isOpen = expandedFaq === faq.id;
            return (
              <div
                key={faq.id}
                onClick={() => toggleFaq(faq.id)}
                className={`border p-6 cursor-pointer transition-colors duration-150 ${
                  isOpen ? 'border-[#cdf200] bg-[#191b22]' : 'border-[#33343b] bg-[#191b22] hover:border-[#8f96a3]'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-start gap-2">
                    <span className="font-label-mono-sm text-[#cdf200] text-xs pt-1">{faq.num}</span>
                    <h3 className="font-headline-sm uppercase text-white">{faq.question}</h3>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-[#8f96a3] shrink-0 mt-1 transition-transform ${isOpen ? 'rotate-180 text-[#cdf200]' : ''}`} />
                </div>
                <p className="font-body-md text-[#8f96a3] pl-8 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
