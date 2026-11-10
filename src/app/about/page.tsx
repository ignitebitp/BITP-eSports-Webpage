'use client';

import {useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {useEsportsModal} from '@/context/ModalContext';
import {
    CLUB_PILLARS, ABOUT_PAGE_ASSETS, CONTACT_INFO, CLUB_OFFICER_PHOTOS, type ClubOfficer,
    localResourceImage,
} from '@/data/esportsData';
import {
    Calendar, ChevronLeft, ChevronRight, Gamepad2, MessageSquare,
} from 'lucide-react';

const carouselOffsets = [-1, 0, 1, 2] as const;
const committeeMember = (id: string, name: string, group: string, rollNo: string, role = group): ClubOfficer => ({
    id, name, handle: '', role, group, rollNo, yearMajor: '', tag: '', discord: '', imageUrl: '',
});
const committeeFallback: ClubOfficer[] = [
    committeeMember('aayush-arya', 'Aayush Arya', 'Senior Coordinator', 'BTECH/15206/24'),
    committeeMember('aayush-babu', 'Aayush Babu', 'Senior Coordinator', 'BTECH/15226/24'),
    committeeMember('aditi-mahror', 'Aditi Mahror', 'Senior Coordinator', 'BTECH/15173/24'),
    committeeMember('ashutosh-kumar', 'Ashutosh Kumar', 'Senior Coordinator', 'BTECH/15197/24'),
    committeeMember('kshitij-tiwari', 'Kshitij Tiwari', 'Senior Coordinator', 'BTECH/15135/24'),
    committeeMember('nipun-sinha', 'Nipun Sinha', 'Senior Coordinator', 'BTECH/15217/24'),
    committeeMember('akshay-kumar-keshav', 'Akshay Kumar Keshav', 'Junior Coordinator', 'BTECH/15184/25'),
    committeeMember('amartya-prakash', 'Amartya Prakash', 'Junior Coordinator', 'BTECH/15259/25'),
    committeeMember('armaan-sinha', 'Armaan Sinha', 'Junior Coordinator', 'BTECH/15200/25'),
    committeeMember('aryan-nirala', 'Aryan Nirala', 'Junior Coordinator', 'BTECH/15272/25'),
    committeeMember('asmit-arya', 'Asmit Arya', 'Junior Coordinator', 'BTECH/15182/25'),
    committeeMember('daksha-chandra', 'Daksha Chandra', 'Junior Coordinator', 'IMH/15008/25'),
    committeeMember('hridayesh', 'Hridayesh', 'Junior Coordinator', 'BTECH/15219/25'),
    committeeMember('kumar-tanishq', 'Kumar Tanishq', 'Junior Coordinator', 'BTECH/15271/25'),
    committeeMember('suryansh-garg', 'Suryansh Garg', 'Junior Coordinator', 'IMH/15017/25'),
    committeeMember('saumya-kumari', 'Saumya Kumari', 'Core Executive', 'BTECH/15014/23', 'Manager'),
    committeeMember('kishlaya-sinha', 'Kishlaya Sinha', 'Core Executive', 'BTECH/15001/23', 'Co-Manager'),
    committeeMember('kalpana-sangwan', 'Kalpana Sangwan', 'Core Executive', 'BTECH/15031/23', 'Design Head'),
    committeeMember('sneha-sharan', 'Sneha Sharan', 'Core Executive', 'BTECH/15126/23', 'Public Relations Head'),
    committeeMember('nidhi-sinha', 'Nidhi Sinha', 'Core Executive', 'BTECH/15197/23', 'Human Resource Head'),
    committeeMember('pratik-raj', 'Pratik Raj', 'Core Executive', 'BTECH/15189/23', 'Event Head'),
];

function officerPhoto(officer: ClubOfficer) {
    const key = officer.name.trim().toLocaleLowerCase('en');
    return CLUB_OFFICER_PHOTOS[key]
        ?? officer.photoUrl
        ?? localResourceImage(officer.imageUrl, '/resources/people/default-avatar.svg');
}

function OfficerCarousel({title, officers}: { title: string; officers: ClubOfficer[] }) {
    const [index, setIndex] = useState(0);
    const sortedOfficers = useMemo(
        () => [...officers].sort((left, right) => left.name.localeCompare(right.name, 'en', {sensitivity: 'base'})),
        [officers]
    );

    const move = (direction: -1 | 1) => {
        setIndex((current) => (current + direction + sortedOfficers.length) % sortedOfficers.length);
    };

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#33343b] pb-3">
                <h3 className="font-headline-md uppercase text-white">{title}</h3>
            </div>
            {sortedOfficers.length === 0 ? (
                <p className="border border-[#33343b] bg-[#0c0e14] p-5 text-sm text-[#8f96a3]">
                    No {title.toLowerCase()} profiles have been added yet.
                </p>
            ) : (
                <div className="relative mx-auto h-[27rem] max-w-3xl overflow-hidden sm:h-[29rem] lg:h-[30rem]"
                     aria-roledescription="carousel">
                    <button
                        type="button"
                        aria-label={`Previous ${title.toLowerCase()}`}
                        onClick={() => move(-1)}
                        disabled={sortedOfficers.length < 2}
                        className="absolute left-1 top-1/2 z-10 -translate-y-1/2 border border-[#33343b] bg-[#0c0e14]/95 p-3 text-white disabled:cursor-not-allowed disabled:opacity-40 sm:left-2 sm:p-4"
                    >
                        <ChevronLeft className="h-7 w-7 sm:h-8 sm:w-8"/>
                    </button>
                    {carouselOffsets.map((offset) => {
                        const officerIndex = (index + offset + sortedOfficers.length) % sortedOfficers.length;
                        const officer = sortedOfficers[officerIndex];
                        return (
                            <article
                                key={`${offset}-${officer.id}-${index}`}
                                aria-hidden={offset === -1 || offset === 2}
                                className="officer-carousel-enter absolute top-0 w-[32%] border border-[#33343b] bg-[#191b22]"
                                style={{left: `${17 + offset * 34}%`}}
                            >
                                <div className="relative aspect-[4/5] overflow-hidden bg-[#111319]">
                                    <Image
                                        src={officerPhoto(officer)}
                                        alt={officer.name}
                                        fill
                                        sizes="(max-width: 768px) 38vw, 384px"
                                        unoptimized
                                        className="object-contain"
                                    />
                                </div>
                                <div className="min-h-24 border-t border-[#33343b] p-3 sm:p-4">
                                    <h4 className="truncate font-headline-sm uppercase text-white">{officer.name}</h4>
                                    <p className="mt-1 truncate font-label-mono-sm text-xs uppercase text-[#cdf200]">{officer.role}</p>
                                    <p className="mt-1 truncate text-xs text-[#8f96a3]">Roll No: {officer.rollNo}</p>
                                </div>
                            </article>
                        );
                    })}
                    <button
                        type="button"
                        aria-label={`Next ${title.toLowerCase()}`}
                        onClick={() => move(1)}
                        disabled={sortedOfficers.length < 2}
                        className="absolute right-1 top-1/2 z-10 -translate-y-1/2 border border-[#33343b] bg-[#0c0e14]/95 p-3 text-white disabled:cursor-not-allowed disabled:opacity-40 sm:right-2 sm:p-4"
                    >
                        <ChevronRight className="h-7 w-7 sm:h-8 sm:w-8"/>
                    </button>
                </div>
            )}
        </section>
    );
}

function CoreExecutiveGrid({officers}: { officers: ClubOfficer[] }) {
    const leadership = officers
        .filter((officer) => ['manager', 'co-manager'].includes(officer.role.trim().toLowerCase()))
        .sort((left, right) => {
            const order = (role: string) => role.trim().toLowerCase() === 'manager' ? 0 : 1;
            return order(left.role) - order(right.role) || left.name.localeCompare(right.name, 'en', {sensitivity: 'base'});
        });
    const heads = officers
        .filter((officer) => !['manager', 'co-manager'].includes(officer.role.trim().toLowerCase()))
        .sort((left, right) => left.name.localeCompare(right.name, 'en', {sensitivity: 'base'}));

    return (
        <section className="space-y-4">
            <div className="border-b border-[#33343b] pb-3">
                <h3 className="font-headline-md uppercase text-white">Core Executive</h3>
            </div>
            {officers.length === 0 ? (
                <p className="border border-[#33343b] bg-[#0c0e14] p-5 text-sm text-[#8f96a3]">
                    No Core Executive profiles have been added yet.
                </p>
            ) : (
                <div className="space-y-8">
                    {leadership.length > 0 && (
                        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
                            {leadership.map((officer) => <CoreExecutiveCard key={officer.id} officer={officer}/>)}
                        </div>
                    )}
                    {heads.length > 0 && (
                        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {heads.map((officer) => <CoreExecutiveCard key={officer.id} officer={officer}/>)}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}

function CoreExecutiveCard({officer}: { officer: ClubOfficer }) {
    return (
        <article className="border border-[#33343b] bg-[#191b22]">
            <div className="relative aspect-[4/5] overflow-hidden bg-[#111319]">
                <Image
                    src={officerPhoto(officer)}
                    alt={officer.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 384px"
                    unoptimized
                    className="object-contain"
                />
            </div>
            <div className="min-h-24 border-t border-[#33343b] p-3 sm:p-4">
                <h4 className="truncate font-headline-sm uppercase text-white">{officer.name}</h4>
                <p className="mt-1 truncate font-label-mono-sm text-xs uppercase text-[#cdf200]">{officer.role}</p>
                <p className="mt-1 truncate text-xs text-[#8f96a3]">Roll No: {officer.rollNo}</p>
            </div>
        </article>
    );
}

export default function AboutPage() {
    const {playTacticalSound} = useEsportsModal();
    const [officers, setOfficers] = useState<ClubOfficer[]>(committeeFallback);

    useEffect(() => {
        let active = true;
        void fetch('/api/officers', {cache: 'no-store'})
            .then(async (response) => {
                if (!response.ok) throw new Error('Unable to load committee information.');
                const data = await response.json();
                if (active && Array.isArray(data.officers)) {
                    const databaseOfficers = data.officers as ClubOfficer[];
                    const databaseNames = new Set(databaseOfficers.map((officer) => officer.name.trim().toLocaleLowerCase('en')));
                    setOfficers([
                        ...databaseOfficers.map((officer) => ({
                            ...officer,
                            group: officer.group ?? (
                                ['President', 'Senior Coordinator', 'Junior Coordinator'].includes(officer.role)
                                    ? officer.role
                                    : 'Senior Coordinator'
                            ),
                        })),
                        ...committeeFallback.filter((officer) => !databaseNames.has(officer.name.toLocaleLowerCase('en'))),
                    ]);
                }
            })
            .catch((error: unknown) => {
                console.error('Unable to refresh officers:', error instanceof Error ? error.name : 'Unknown error');
            });
        return () => {
            active = false;
        };
    }, []);

    return (
        <main className="flex-grow w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-8 space-y-16">
            {/* 1. PAGE HEADER & STORY SECTION */}
            <section
                className="border border-[#33343b] bg-[#0c0e14] p-6 sm:p-8 md:p-12 relative overflow-hidden tactical-grid-bg">
                <div className="flex flex-col lg:flex-row gap-8 lg:items-start justify-between">
                    <div className="max-w-3xl space-y-4">
                        <div className="inline-flex items-center gap-2 bg-[#1d1f26] border border-[#33343b] px-3 py-1">
                            <span className="w-2 h-2 bg-[#cdf200]"></span>
                            <span className="font-label-mono-sm text-[#cdf200] uppercase tracking-wider text-xs">
                OFFICIAL CHARTERED STUDENT ORGANIZATION
              </span>
                        </div>
                        <h1 className="font-headline-xl text-white uppercase tracking-tight leading-none text-4xl sm:text-5xl md:text-6xl">
                            STUDENT RUN.
                            <span className="text-[#cdf200]"> CAMPUS BUILT.</span>
                        </h1>
                        <p className="font-body-lg text-[#8f96a3] max-w-2xl leading-relaxed">
                            BITPeSports is the official competitive gaming and esports student organization on campus.
                        </p>
                    </div>
                </div>

                {/* Configurable campus photo assets are in the frontend data module. */}
                <div
                    className="mt-10 border border-[#33343b] grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#33343b] bg-[#111319]">
                    {/* Photo 1 */}
                    <div className="relative h-64 overflow-hidden group">
                        <img
                            src={ABOUT_PAGE_ASSETS.photo1}
                            alt="Esports arena"
                            className="w-full h-full object-cover grayscale contrast-125 transition-transform duration-300 group-hover:scale-105"
                        />
                    </div>

                    {/* Photo 2 */}
                    <div className="relative h-64 overflow-hidden group">
                        <img
                            src={ABOUT_PAGE_ASSETS.photo2}
                            alt="Livestream broadcast studio"
                            className="w-full h-full object-cover grayscale contrast-125 transition-transform duration-300 group-hover:scale-105"
                        />
                    </div>

                    {/* Photo 3 */}
                    <div className="relative h-64 overflow-hidden group">
                        <img
                            src={ABOUT_PAGE_ASSETS.photo3}
                            alt="Campus gaming"
                            className="w-full h-full object-cover grayscale contrast-125 transition-transform duration-300 group-hover:scale-105"
                        />
                    </div>
                </div>
            </section>

            {/* 2. CLUB PILLARS / WHAT WE DO */}
            <section className="space-y-6">
                <div className="flex items-end justify-between border-b border-[#33343b] pb-3">
                    <div>
                        <span className="font-label-mono-sm text-[#cdf200] uppercase text-xs">CORE PURPOSE</span>
                        <h2 className="font-headline-lg uppercase text-white">WHAT WE DO // CLUB PILLARS</h2>
                    </div>
                    <span className="font-label-mono-sm text-[#8f96a3] hidden sm:inline-block text-xs">
            PROGRAM ARCHITECTURE [4 STACKS]
          </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {CLUB_PILLARS.map((pillar) => (
                        <div
                            key={pillar.code}
                            className="border border-[#33343b] bg-[#191b22] p-6 flex flex-col justify-between hover:border-[#cdf200] transition-colors duration-150 group"
                        >
                            <div className="space-y-3">
                                <div className="flex justify-between items-start">
                                    <span
                                        className="font-label-mono-sm text-[#cdf200] text-xs font-bold">{pillar.code}</span>
                                    <Gamepad2
                                        className="w-5 h-5 text-[#8f96a3] group-hover:text-[#cdf200] transition-colors"/>
                                </div>
                                <h3 className="font-headline-sm uppercase text-white">{pillar.title}</h3>
                                <p className="font-body-sm text-[#8f96a3] leading-relaxed">
                                    {pillar.description}
                                </p>
                            </div>

                            <div
                                className="pt-4 mt-4 border-t border-[#33343b] flex items-center justify-between text-[#8f96a3] font-label-mono-sm text-xs">
                                <span>{pillar.metaLeft}</span>
                                <span className="text-[#cdf200]">{pillar.metaRight}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 3. EXECUTIVE BOARD & OFFICERS */}
            <section className="space-y-6">
                <div className="flex items-end justify-between border-b border-[#33343b] pb-3">
                    <div>
                        <span className="font-label-mono-sm text-[#cdf200] uppercase text-xs">STUDENT LEADERSHIP</span>
                        <h2 className="font-headline-lg uppercase text-white">EXECUTIVE BOARD & OFFICERS</h2>
                    </div>
                    <span className="font-label-mono-sm text-[#8f96a3] text-xs">ELECTED BY MEMBERSHIP</span>
                </div>

                <div className="space-y-10">
                    <CoreExecutiveGrid
                        officers={officers.filter((officer) => officer.group.trim().toLowerCase() === 'core executive')}/>
                    <OfficerCarousel title="Senior Coordinator"
                                     officers={officers.filter((officer) => officer.group.trim().toLowerCase() === 'senior coordinator')}/>
                    <OfficerCarousel title="Junior Coordinator"
                                     officers={officers.filter((officer) => officer.group.trim().toLowerCase() === 'junior coordinator')}/>
                </div>
            </section>

            {/* 4. CALL TO ACTION */}
            <section className="border-2 border-[#cdf200] bg-[#0c0e14] p-8 md:p-16 text-center space-y-4 relative">
                <div className="max-w-2xl mx-auto space-y-2">
          <span className="font-label-mono-sm text-[#cdf200] uppercase tracking-widest block text-xs">
            JOIN THE COMMUNITY
          </span>
                    <h2 className="font-headline-xl uppercase text-white leading-tight">
                        WANT TO GET INVOLVED?
                    </h2>
                    <p className="font-body-md text-[#8f96a3] leading-relaxed">
                        Join our weekly general body meetings or drop into our Discord. Whether you&apos;re looking to
                        compete on varsity, learn stream production, or just play casual games after class, you have a
                        spot here.
                    </p>
                </div>

                <div className="flex flex-wrap justify-center gap-4 pt-4">
                    <a
                        className="bg-[#cdf200] text-[#0a0b0e] font-label-caps px-8 py-3.5 uppercase font-bold tracking-wider hover:bg-white transition-colors flex items-center gap-2 text-sm"
                        href={CONTACT_INFO.discordUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => playTacticalSound('click')}
                    >
                        <MessageSquare className="w-4 h-4"/>
                        <span>JOIN THE CLUB DISCORD</span>
                    </a>
                    <Link
                        className="border border-[#33343b] bg-[#191b22] text-white font-label-caps px-8 py-3.5 uppercase font-bold tracking-wider hover:border-white transition-colors flex items-center gap-2 text-sm"
                        href="/events"
                        onClick={() => playTacticalSound('click')}
                    >
                        <Calendar className="w-4 h-4 text-[#cdf200]"/>
                        <span>VIEW EVENTS SCHEDULE</span>
                    </Link>
                </div>
            </section>
        </main>
    );
}
