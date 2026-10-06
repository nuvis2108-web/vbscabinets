// Business facts — single source of truth (see .claude/skills/vbs-design/SKILL.md).

const email = 'vbscustom@gmail.com';
const serviceTowns = ['Hamilton', 'Burlington', 'Waterdown', 'Oakville', 'Milton'] as const;

export const site = {
  name: 'VBS Closets & Cabinets',
  legalName: '1001273451 Ontario Inc.',
  url: 'https://vbscabinets.ca',
  description: `Custom cabinetry, closets, media walls, built-ins and woodworking for homes in ${serviceTowns.join(', ')} and the GTA.`,
  phone: { display: '437-376-6267', href: 'tel:+14373766267' },
  whatsapp: 'https://wa.me/14373766267',
  email: { display: email, href: `mailto:${email}` },
  instagram: { handle: '@vbsclosetscabinets', url: 'https://www.instagram.com/vbsclosetscabinets/' },
  baseCity: 'Hamilton',
  /** The one service-area list. Every page reads from here so the towns never drift apart. */
  towns: serviceTowns,
  areas: [...serviceTowns, 'GTA'],
  serviceAreaText: `${serviceTowns.join(', ')} and the GTA`,
  /** Every Request a Quote button links here. */
  quote: { href: '/contact' },
} as const;

export const nav = [
  { label: 'Projects', href: '/#projects' },
  { label: 'Services', href: '/#services' },
  { label: 'Process', href: '/#process' },
  { label: 'Service area', href: '/#service-area' },
  { label: 'Contact', href: '/contact' },
] as const;
