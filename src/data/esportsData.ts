export interface ClubGame {
  id: string;
  name: string;
  tag: string;
  divisionBadge: string;
  category: 'CONSOLE' | 'PC' | 'MOBILE';
  description: string;
  captain: string;
  practiceSchedule: string;
  status: string;
  statusType: 'open' | 'scrims' | 'active' | 'recruiting';
  league: string;
  accentColor: string;
  badgeBg: string;
  gameArt: string;
  tagline: string;
}

export interface ScheduledMatch {
  id: string;
  discipline: string;
  datetime: string;
  timestamp: string;
  opponent: string;
  league: string;
  streamType: 'Twitch Stream' | 'Watch Party' | 'Live Broadcast';
  streamUrl?: string;
}

export interface WeeklyScheduleItem {
  id: string;
  tag: string;
  title: string;
  time: string;
  location: string;
  details: string;
}

export interface RecentResult {
  id: string;
  discipline: string;
  league: string;
  badge: 'WIN' | 'SWEEP' | 'COMPLETED' | 'LOSS';
  team1: string;
  score1: number | string;
  team2: string;
  score2: number | string;
  subtext: string;
  eventId?: string | null;
}

export interface TournamentEvent {
  id: string;
  title: string;
  dateStr: string;
  timeStr: string;
  endTimeStr?: string | null;
  isoDate: string;
  discipline: string;
  location: string;
  locationSub: string;
  format: string;
  formatSub: string;
  statusBadge: string;
  description?: string;
  report?: string | null;
  results?: RecentResult[];
  reportImages?: { id: string; url: string }[];
  posterUrl?: string | null;
  slotsFilled?: number;
  slotsTotal?: number;
}

export function formatEventTime(event: { timeStr: string; endTimeStr?: string | null }): string {
  if (!event.endTimeStr) return event.timeStr;
  return `${event.timeStr} - ${event.endTimeStr}`;
}

// Helper to parse time strings (e.g., "3:30 PM" or "15:30")
export function parseTimeString(timeStr: string): { hours: number; minutes: number } | null {
  if (!timeStr) return null;
  const cleaned = timeStr.trim();
  const match24 = cleaned.match(/^(\\d{1,2}):(\\d{2})$/);
  if (match24) {
    return { hours: parseInt(match24[1], 10), minutes: parseInt(match24[2], 10) };
  }
  const match12 = cleaned.match(/^(\\d{1,2})(?::(\\d{2}))?\\s*(AM|PM)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = match12[2] ? parseInt(match12[2], 10) : 0;
    const period = match12[3].toUpperCase();
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return { hours, minutes };
  }
  return null;
}

// Determines if an event has already ended in IST timezone
export function isEventEndedIST(event: TournamentEvent, now: Date = new Date()): boolean {
  if (event.statusBadge?.toUpperCase() === 'COMPLETED' || event.statusBadge?.toUpperCase() === 'ARCHIVED') {
    return true;
  }
  const nowMs = now.getTime();
  const startDate = new Date(event.isoDate);
  if (isNaN(startDate.getTime())) return false;

  if (event.endTimeStr) {
    const endParsed = parseTimeString(event.endTimeStr);
    if (endParsed) {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      };
      const formatter = new Intl.DateTimeFormat('en-CA', options);
      const dateParts = formatter.format(startDate);
      const pad = (n: number) => n.toString().padStart(2, '0');
      const istEndIso = `${dateParts}T${pad(endParsed.hours)}:${pad(endParsed.minutes)}:00+05:30`;
      const endDate = new Date(istEndIso);
      if (!isNaN(endDate.getTime())) {
        const startParsed = parseTimeString(event.timeStr);
        if (
          startParsed &&
          (endParsed.hours < startParsed.hours ||
            (endParsed.hours === startParsed.hours && endParsed.minutes < startParsed.minutes))
        ) {
          endDate.setDate(endDate.getDate() + 1);
        }
        return endDate.getTime() <= nowMs;
      }
    }
  }

  const startParsed = parseTimeString(event.timeStr);
  if (startParsed) {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };
    const formatter = new Intl.DateTimeFormat('en-CA', options);
    const dateParts = formatter.format(startDate);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const endHour = (startParsed.hours + 2) % 24;
    const dayAdd = startParsed.hours + 2 >= 24 ? 1 : 0;
    const istEndIso = `${dateParts}T${pad(endHour)}:${pad(startParsed.minutes)}:00+05:30`;
    const endDate = new Date(istEndIso);
    if (dayAdd > 0) endDate.setDate(endDate.getDate() + 1);
    if (!isNaN(endDate.getTime())) {
      return endDate.getTime() <= nowMs;
    }
  }

  return startDate.getTime() <= nowMs;
}


export interface ClubOfficer {
  id: string;
  name: string;
  handle: string;
  role: string;
  group: string;
  rollNo: string;
  yearMajor: string;
  tag: string;
  discord: string;
  imageUrl: string;
  photoUrl?: string | null;
}

export const CLUB_OFFICER_PHOTOS: Record<string, string> = {
  'aayush arya': '/resources/people/aayush-arya-senior-coordinator.webp',
  'aayush babu': '/resources/people/aayush-babu-senior-coordinator.webp',
  'aditi mahror': '/resources/people/aditi-mahror-senior-coordinator.webp',
  'akshay kumar keshav': '/resources/people/akshay-kumar-keshav-junior-coordinator.webp',
  'ashutosh kumar': '/resources/people/ashutosh-kumar-senior-coordinator.webp',
  'armaan sinha': '/resources/people/armaan-sinha-junior-coordinator.webp',
  'amartya prakash': '/resources/people/amartya-prakash-junior-coordinator.webp',
  'asmit arya': '/resources/people/asmit-arya-junior-coordinator.webp',
  'aryan nirala': '/resources/people/aryan-nirala-junior-coordinator.webp',
  'daksha chandra': '/resources/people/daksha-chandra-junior-coordinator.webp',
  'hridayesh': '/resources/people/hridayesh-junior-coordinator.webp',
  'kshitij tiwari': '/resources/people/kshitij-tiwari-senior-coordinator.webp',
  'kumar tanishq': '/resources/people/kumar-tanishq-junior-coordinator.webp',
  'nipun sinha': '/resources/people/nipun-sinha-senior-coordinator.webp',
  'suryansh garg': '/resources/people/suryansh-garg-junior-coordinator.webp',
  'saumya kumari': '/resources/people/saumya-kumari-manager.webp',
  'kalpana sangwan': '/resources/people/kalpana-sangwan-design-head.webp',
  'sneha sharan': '/resources/people/sneha-sharan-public-relations-head.webp',
  'kishlaya sinha': '/resources/people/kishlaya-sinha-comanager.webp',
  'pratik raj': '/resources/people/pratik-raj-event-head.webp',
  'nidhi sinha':'/resources/people/nidhi-sinha-human-resource-manager.webp',

};

export interface ClubTeamMember {
  id: string;
  name: string;
  handle: string;
  role: string;
  gameSlug: string;
  yearMajor: string;
  tag: string;
  imageUrl: string;
  order: number;
}

export interface ClubAchievement {
  id: string;
  title: string;
  game: string;
  award: string;
  date: string;
  description: string;
  imageUrl: string;
  order: number;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  topic?: string | null;
  game?: string | null;
  message: string;
  status: 'PENDING' | 'READ';
  createdAt: string;
}

// -------------------------------------------------------------
// ABOUT US CONFIGURABLE ASSETS & IMAGES
// -------------------------------------------------------------
export const ABOUT_PAGE_ASSETS = {
  photo1: '/resources/about/esports-arena.jpg',
  photo2: '/resources/about/broadcast-studio.jpg',
  photo3: '/resources/about/campus-gaming.jpg',
};

export const LOCAL_GAME_ART: Record<string, string> = {
  'ea-fc': '/resources/games/FC.webp',
  valorant: '/resources/games/Valorant.webp',
  'free-fire': '/resources/games/FreeFire.webp',
  bgmi: '/resources/games/BGMI.webp',
};

export const DEFAULT_CLUB_GAMES: ClubGame[] = [
  {
    id: 'ea-fc',
    name: 'EA Sports FC',
    tag: 'SPORTS SIMULATION',
    divisionBadge: 'PRO DIVISION',
    category: 'PC',
    description: 'Competitive virtual football roster participating in collegiate leagues and tournaments.',
    captain: 'Club Exec',
    practiceSchedule: 'TBD',
    status: 'Active Roster',
    statusType: 'active',
    league: 'Collegiate FIFA',
    accentColor: '#88c425',
    badgeBg: 'rgba(136, 196, 37, 0.15)',
    gameArt: LOCAL_GAME_ART['ea-fc'],
    tagline: 'The Pitch Belongs To BITP',
  },
  {
    id: 'valorant',
    name: 'Valorant',
    tag: 'TACTICAL FPS',
    divisionBadge: 'PRO DIVISION',
    category: 'PC',
    description: 'Premier 5v5 tactical shooter roster competing in regional inter-college circuits.',
    captain: 'Club Exec',
    practiceSchedule: 'TBD',
    status: 'Active Roster',
    statusType: 'active',
    league: 'Campus Valorant League',
    accentColor: '#ff4655',
    badgeBg: 'rgba(255, 70, 85, 0.15)',
    gameArt: LOCAL_GAME_ART.valorant,
    tagline: 'Precision & Coordination',
  },
  {
    id: 'free-fire',
    name: 'Free Fire Mobile',
    tag: 'BATTLE ROYALE',
    divisionBadge: 'MOBILE DIVISION',
    category: 'MOBILE',
    description: 'Fast-paced mobile battle royale squad representing BITP in campus championships.',
    captain: 'Club Exec',
    practiceSchedule: 'TBD',
    status: 'Active Roster',
    statusType: 'active',
    league: 'Free Fire Campus Series',
    accentColor: '#ff9900',
    badgeBg: 'rgba(255, 153, 0, 0.15)',
    gameArt: LOCAL_GAME_ART['free-fire'],
    tagline: 'Survive & Conquer',
  },
  {
    id: 'bgmi',
    name: 'BGMI',
    tag: 'BATTLE ROYALE',
    divisionBadge: 'MOBILE DIVISION',
    category: 'MOBILE',
    description: 'Dominant BGMI squad competing across university leagues and open scrims.',
    captain: 'Club Exec',
    practiceSchedule: 'TBD',
    status: 'Active Roster',
    statusType: 'active',
    league: 'BGMI Collegiate Circuit',
    accentColor: '#22c55e',
    badgeBg: 'rgba(34, 197, 94, 0.15)',
    gameArt: LOCAL_GAME_ART.bgmi,
    tagline: 'Winner Winner',
  },
];

export function localResourceImage(value: string | null | undefined, fallback: string): string {
  if (typeof value !== 'string' || !value.startsWith('/resources/') || value.includes('..')) return fallback;
  return value;
}

// -------------------------------------------------------------
// CONTACT TOUCHPOINTS
// -------------------------------------------------------------
export const CONTACT_INFO = {
  instagramHandle: '@BITPeSports.GG',
  instagramUrl: 'https://www.instagram.com/bitpesports.gg/',
  mail: 'bitpesports.gg@gmail.com',
  scrimsMail: 'bitpesports.gg@gmail.com',
  discordUrl: 'https://discord.gg/rXHBTSDkcf'
};

export const CLUB_PILLARS = [
  {
    code: '01 // COMP',
    title: 'Competitive Collegiate Teams',
    description: 'Fielding teams across EA FC, Valorant, Free Fire, and BGMI in intra/inter-college championships.',
    metaLeft: 'VARSITY & ROOKIE',
    metaRight: 'TRYOUTS SEASONAL',
  },
  {
    code: '02 // COMM',
    title: 'Casual & Community Gaming',
    description: 'Weekly campus lobbies, viewing parties, and casual matchmaking where any student can unwind and find teammates.',
    metaLeft: 'ALL MAJORS',
    metaRight: 'WEEKLY LOBBIES',
  },
  {
    code: '03 // PROD',
    title: 'Student Production & Broadcasting',
    description: 'Hands-on student training in tournament administration, shoutcasting, video streaming, and production operations.',
    metaLeft: 'RESUME VALUE',
    metaRight: 'STUDIO DESK',
  },
  {
    code: '04 // LEAD',
    title: 'Student Leadership & Community',
    description: 'Student-run organization providing management experience, campus representation, and peer mentorship.',
    metaLeft: 'STUDENT GOV',
    metaRight: 'CAMPUS WIDE',
  },
];

export const FAQS = [
  {
    id: 'q1',
    num: 'Q01 //',
    question: 'Do I have to be good at games to join?',
    answer: 'No! We have both competitive teams and a large casual community. Everyone is welcome regardless of skill level. From casual mobile lobbies to varsity qualifiers, you will find your community here.',
  },
  {
    id: 'q2',
    num: 'Q02 //',
    question: 'How do competitive team tryouts work?',
    answer: 'Tryouts for FC, Valorant, Free Fire, and BGMI are held at the beginning of each semester. Announcements and Google form links are posted in our Discord.',
  },
  {
    id: 'q3',
    num: 'Q03 //',
    question: 'How do scrim requests work for other colleges?',
    answer: 'Collegiate managers can reach out directly via our email (scrims.apex@university.edu) or through the Discord scrims channel. Our captains coordinate scrim blocks weekly.',
  },
  {
    id: 'q4',
    num: 'Q04 //',
    question: 'Can I propose a new game or tournament?',
    answer: 'Yes! Reach out via our Contact form with your game title and student interest. If there is active campus demand, our officers can charter a recognized division.',
  },
];
