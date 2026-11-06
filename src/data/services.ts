// Service pages (/custom-cabinets, /custom-closets, /media-walls, /built-ins, /custom-woodworking).
// One entry per page, rendered by src/pages/[service].astro.
//
// Content rules (see .claude/skills/vbs-design/SKILL.md):
// - Only real VBS photos may be presented as VBS work. Stock photos must set `stock: true`, which adds
//   "Photo shows an example style." under the image.
// - Prices come only from the blog cost guides. Don't add ranges for services without a guide.
// - Don't invent reviews, timelines, warranties or certifications.

import type { ImageMetadata } from 'astro';

// Real VBS photos (owner-retouched project set: use as supplied).
import mediaWallFront from '@/assets/images/projects/black-media-wall-1.png';
import mediaWallDetail from '@/assets/images/projects/black-media-wall-2.png';
import kitchenFront from '@/assets/images/projects/two-tone-custom-kitchen-1.png';
import kitchenAngle from '@/assets/images/projects/two-tone-custom-kitchen-2.png';
import fireplaceFront from '@/assets/images/projects/arched-fireplace-built-in-1.png';
import fireplaceDetail from '@/assets/images/projects/arched-fireplace-built-in-2.png';
// Other real VBS photos.
import slidingDoors from '@/assets/images/sliding-panel-doors.jpg';
import oakDresser from '@/assets/images/custom-oak-dresser.jpg';
import oakNightstands from '@/assets/images/oak-nightstands.jpg';
import carvedDoor from '@/assets/images/custom-woodwork-detail.jpg';
import herringboneGate from '@/assets/images/herringbone-wood-gate.jpg';
// Stock (Unsplash), example style only. Credits: src/assets/images/stock/CREDITS.md
import stockCloset from '@/assets/images/stock/service-walk-in-closet.webp';

export interface ServicePhoto {
  src: ImageMetadata;
  alt: string;
  /** Short caption shown under the photo. */
  caption: string;
  /** Stock photo: captioned "Photo shows an example style." and never described as VBS work. */
  stock?: boolean;
}

export interface ServiceFaq {
  q: string;
  /** Plain text. Keep it short; it is also used verbatim in FAQPage structured data. */
  a: string;
}

export interface Service {
  slug: string;
  /** Short name used in navigation, breadcrumbs and cross-links. */
  name: string;
  /** schema.org serviceType. */
  serviceType: string;
  seoTitle: string;
  metaDescription: string;
  eyebrow: string;
  h1: string;
  lead: string;
  intro: string[];
  hero: ServicePhoto;
  /** What's included, shown as a list of short items. */
  offerings: { title: string; text: string }[];
  /** Extra photos shown in the "Our work" strip. Real VBS photos only. */
  gallery: ServicePhoto[];
  planning: { title: string; text: string }[];
  pricing?: {
    rows: { label: string; range: string }[];
    note: string;
    guide: { href: string; label: string };
  };
  related?: { href: string; label: string };
  faqs: ServiceFaq[];
}

const towns = 'Hamilton, Burlington, Waterdown, Oakville, Milton';

export const services: Service[] = [
  {
    slug: 'custom-cabinets',
    name: 'Custom Cabinetry',
    serviceType: 'Custom cabinetry',
    seoTitle: 'Custom Cabinets & Kitchen Cabinetry in Hamilton | VBS',
    metaDescription:
      'Custom kitchen cabinets, pantry storage and laundry cabinetry built to fit your room. Based in Hamilton, building for homes in Burlington, Waterdown, Oakville, Milton and the GTA.',
    eyebrow: 'Custom cabinetry · Hamilton',
    h1: 'Custom cabinets and kitchen cabinetry in Hamilton',
    lead: 'Kitchen cabinets, islands, pantries and storage cabinetry, designed around your layout and built to fit the space exactly.',
    intro: [
      'Premade cabinets come in fixed sizes, so most kitchens end up with filler strips, gaps at the ceiling and corners that don’t get used. Custom cabinetry is built for your room: the widths, heights and depths are set by your walls and by what you need to store.',
      `We plan the layout, materials and finish with you, then build and install the cabinetry. We work on homes across ${towns} and the GTA.`,
    ],
    hero: {
      src: kitchenFront,
      alt: 'Two-tone kitchen by VBS with white shaker upper cabinets, navy lower cabinets, quartz counters and a navy island with vertical wood slats and three stools',
      caption: 'Two-tone custom kitchen by VBS: white shaker uppers, navy lowers and a slatted island.',
    },
    offerings: [
      { title: 'Kitchen cabinets', text: 'Full kitchens or a new run of uppers and lowers, built to your layout and ceiling height.' },
      { title: 'Islands', text: 'Islands with seating, storage on both sides and panelled or slatted ends.' },
      { title: 'Pantry and tall storage', text: 'Full-height pantry cabinets and fridge surrounds that use the whole wall.' },
      { title: 'Laundry and utility rooms', text: 'Cabinets and shelving for laundry rooms, mudrooms and storage walls.' },
      { title: 'Garage shelving', text: 'Sturdy shelving and storage for garages and basements.' },
    ],
    gallery: [
      {
        src: kitchenAngle,
        alt: 'Angled view of the VBS two-tone kitchen showing the island seating, full-height navy pantry cabinets and brass hardware',
        caption: 'The same kitchen: island seating and full-height pantry cabinets.',
      },
    ],
    planning: [
      { title: 'Layout first', text: 'We look at how you cook and what you store, then plan drawers, pull-outs and tall cabinets around that.' },
      { title: 'Use the full height', text: 'Cabinets can run to the ceiling instead of stopping short, which adds storage and removes the dust shelf on top.' },
      { title: 'Finish and hardware', text: 'Painted, two-tone or wood finishes, with the hardware chosen to match. Inspiration photos help us get the look right.' },
      { title: 'Photos and measurements', text: 'Photos of the room and rough wall measurements are enough for us to start planning and quoting.' },
    ],
    related: { href: '/blog/custom-vs-premade-cabinets', label: 'Custom vs premade cabinets: which is better?' },
    faqs: [
      {
        q: 'Are custom cabinets worth it compared with premade cabinets?',
        a: 'It depends on your space and budget. Custom cabinets fit the room exactly and let you choose the layout and finish. Premade cabinets can cost less for a simple, standard layout. Our guide on custom vs premade cabinets goes through when each makes sense.',
      },
      {
        q: 'Do you only build kitchens?',
        a: 'No. We also build pantries, laundry room and mudroom cabinets, storage walls, garage shelving, closets, media walls and built-ins.',
      },
      {
        q: 'Do you install the cabinets as well?',
        a: 'Yes. We build the cabinetry and install it for the agreed space and scope.',
      },
      {
        q: 'How do I get a quote for custom cabinets?',
        a: 'Request a quote and send photos of the room, rough measurements of the walls and any inspiration images. We go through the layout, materials and finish with you and come back with a project quote.',
      },
      {
        q: 'Which areas do you serve?',
        a: `We are based in Hamilton and build for homes in ${towns} and across the GTA. If your town isn’t listed, ask.`,
      },
    ],
  },

  {
    slug: 'custom-closets',
    name: 'Closets',
    serviceType: 'Custom closets',
    seoTitle: 'Custom Closets in Hamilton & Burlington | VBS',
    metaDescription:
      'Custom walk-in and reach-in closets, drawers, shelving and sliding closet doors. Based in Hamilton, building for homes in Burlington, Waterdown, Oakville, Milton and the GTA.',
    eyebrow: 'Custom closets · Hamilton',
    h1: 'Custom closets in Hamilton, Burlington and the west GTA',
    lead: 'Walk-in and reach-in closets planned around what you actually own, with shelving, hanging space, drawers and doors built to fit.',
    intro: [
      'A good closet starts with what goes in it. We look at how much long and short hanging you need, how many shoes, what you fold and what you’d rather keep in drawers, then lay out the closet around that.',
      `Every closet is built for its space, including walls that aren’t square and ceilings that slope. We build and install closets for homes in ${towns} and the GTA.`,
    ],
    hero: {
      src: stockCloset,
      alt: 'Walk-in closet lined with wood-grain shelving, drawer banks and hanging sections',
      caption: 'Walk-in closet with shelving, drawer banks and hanging sections.',
      stock: true,
    },
    offerings: [
      { title: 'Walk-in closets', text: 'Storage on two or three walls, with drawer banks, shoe shelving and an island where there’s room.' },
      { title: 'Reach-in closets', text: 'One wall used well: double hanging, adjustable shelves and a short bank of drawers.' },
      { title: 'Drawers and accessories', text: 'Drawers, pull-outs and organizers placed where they’ll get used.' },
      { title: 'Sliding closet doors', text: 'New sliding panel doors that change the look of the whole room.' },
    ],
    gallery: [
      {
        src: slidingDoors,
        alt: 'Two white sliding closet doors by VBS with frosted glass panels in a bedroom',
        caption: 'Sliding panel closet doors with frosted inserts, installed by VBS.',
      },
    ],
    planning: [
      { title: 'Count what you store', text: 'Measuring long-hanging items and counting shoes lets us size each section properly, so nothing is wasted.' },
      { title: 'Put drawers where they count', text: 'A single bank of drawers is often enough. Shelving and hanging space cost less per foot.' },
      { title: 'Mix open and closed storage', text: 'Open shelves for things you reach for daily, drawers for smaller items.' },
      { title: 'Plan around the room', text: 'Old shelving, baseboards, outlets and sloped ceilings are planned into the build, which is why photos of the space help.' },
    ],
    pricing: {
      rows: [
        { label: 'Basic reach-in closet', range: 'About $1,000–$2,500' },
        { label: 'Larger or more customized reach-in', range: 'About $2,000–$4,000+' },
        { label: 'Walk-in closet', range: 'About $3,500–$8,000+' },
      ],
      note: 'Planning ranges only, not quotes. Your price depends on size, layout, materials, hardware, finish and installation.',
      guide: { href: '/blog/custom-closet-cost-hamilton', label: 'Read the full closet cost guide' },
    },
    faqs: [
      {
        q: 'How much does a custom closet cost in Hamilton?',
        a: 'As a planning guide, a basic reach-in closet is about $1,000–$2,500, a larger or more customized reach-in about $2,000–$4,000+, and a walk-in about $3,500–$8,000+. Your actual price depends on the size, layout, materials, hardware and installation.',
      },
      {
        q: 'Can you quote a closet from photos?',
        a: 'Yes. Send a few photos of the closet, including the floor, ceiling and doors, with rough width, depth and ceiling height. Inspiration images and a list of what you want to store help too.',
      },
      {
        q: 'Do I need a walk-in to get a custom closet?',
        a: 'No. A well-planned reach-in closet can hold a lot more than a single rod and shelf. Double hanging, adjustable shelves and a few drawers make a big difference.',
      },
      {
        q: 'Can you replace my closet doors too?',
        a: 'Yes. We can fit new sliding closet doors along with the closet interior, or keep your existing doors.',
      },
      {
        q: 'Do you build closets in Oakville and Milton?',
        a: `Yes. We are based in Hamilton and build closets for homes in ${towns} and across the GTA.`,
      },
    ],
  },

  {
    slug: 'media-walls',
    name: 'Media Walls',
    serviceType: 'Media wall and TV wall installation',
    seoTitle: 'Custom Media Walls & TV Walls in Hamilton | VBS',
    metaDescription:
      'Custom media walls and TV wall units with fluted panels, shelving, lighting and fireplace surrounds. Built and installed in Hamilton, Burlington, Waterdown, Oakville, Milton and the GTA.',
    eyebrow: 'Media walls · Hamilton',
    h1: 'Custom media walls and TV walls in Hamilton',
    lead: 'A built-in TV wall with storage, shelving and lighting, designed for your room, your TV and your equipment.',
    intro: [
      'A media wall turns a plain living room wall into the centrepiece of the room. It gives the TV a proper place, hides cables and equipment, and adds storage and display shelving around it.',
      `We design each media wall for one specific wall, then build and install it. We build media walls, TV walls and fireplace surrounds for homes in ${towns} and the GTA.`,
    ],
    hero: {
      src: mediaWallFront,
      alt: 'Black custom media wall by VBS with a fluted centre panel, arched shelving niches with integrated lighting, white-oak shelves and shaker lower cabinets with brass knobs',
      caption: 'Black media wall by VBS: fluted centre panel, lit arched niches and shaker base cabinets.',
    },
    offerings: [
      { title: 'TV walls', text: 'A feature panel behind the screen, with cable routes and equipment space planned in.' },
      { title: 'Fluted and slatted panels', text: 'Textured panels that give the wall depth, painted or in wood.' },
      { title: 'Shelving and arched niches', text: 'Open shelving or arched openings on either side for display.' },
      { title: 'Base cabinets', text: 'Closed storage along the bottom for media equipment and everyday things.' },
      { title: 'Integrated lighting', text: 'LED lighting in shelves and niches, planned from the start so wiring stays hidden.' },
      { title: 'Fireplace surrounds', text: 'Media walls built around a fireplace, with the clearances the fireplace needs.' },
    ],
    gallery: [
      {
        src: mediaWallDetail,
        alt: 'Close-up of an arched niche on the VBS black media wall with LED-lit white-oak shelves beside the fluted panel, above shaker cabinets with brass knobs',
        caption: 'Detail: LED-lit white-oak shelves in an arched niche.',
      },
    ],
    planning: [
      { title: 'TV size and equipment', text: 'Tell us your TV size, soundbar and any equipment so the openings and cable routes fit from day one.' },
      { title: 'Plan lighting early', text: 'Lighting is much easier to build in than to add later. New outlets or circuits may need an electrician.' },
      { title: 'One feature, done well', text: 'A single fluted panel or a pair of arched niches can carry the design without adding every element.' },
      { title: 'Size to the room', text: 'A media wall doesn’t have to fill the full width to look built in.' },
    ],
    pricing: {
      rows: [
        { label: 'Media wall', range: 'About $3,000–$7,000+' },
        { label: 'With a fireplace, more cabinetry, lighting or specialty panels', range: 'About $5,000–$10,000+' },
      ],
      note: 'Planning ranges only, not quotes. Your price depends on the size of the wall, materials, finish, lighting and installation.',
      guide: { href: '/blog/custom-media-wall-cost-gta', label: 'Read the full media wall cost guide' },
    },
    faqs: [
      {
        q: 'How much does a custom media wall cost?',
        a: 'As a planning guide, a media wall is about $3,000–$7,000+, and a more elaborate one with a fireplace, more cabinetry, lighting or specialty panels is about $5,000–$10,000+. The size of the wall and the features you choose decide where yours lands.',
      },
      {
        q: 'Can you hide the TV cables?',
        a: 'Yes. Cable routes for the TV, soundbar and equipment are planned as part of the design, so tell us what you have up front.',
      },
      {
        q: 'Can a media wall include a fireplace?',
        a: 'Yes. We build media walls around electric and other fireplaces, following the fireplace manufacturer’s clearance requirements for the opening, mantel and nearby materials.',
      },
      {
        q: 'Can you add lighting to the shelves?',
        a: 'Yes. LED lighting in shelves and niches is common. It is best planned from the start so wiring can be hidden inside the build. New outlets or circuits may need an electrician.',
      },
      {
        q: 'What do you need for a media wall quote?',
        a: 'Photos of the wall and the room, the wall’s rough width and ceiling height, your TV size and equipment, photos of any fireplace, and inspiration images you like.',
      },
    ],
  },

  {
    slug: 'built-ins',
    name: 'Built-ins',
    serviceType: 'Custom built-ins',
    seoTitle: 'Fireplace Built-Ins & Custom Built-Ins in Hamilton | VBS',
    metaDescription:
      'Custom fireplace built-ins, benches, storage walls and floating shelves, designed around your room. Based in Hamilton, building for homes in Burlington, Waterdown, Oakville, Milton and the GTA.',
    eyebrow: 'Built-ins · Hamilton',
    h1: 'Fireplace built-ins and custom built-ins in Hamilton',
    lead: 'Shelving, cabinets and benches built into the room itself, around fireplaces, windows and awkward walls.',
    intro: [
      'Built-ins make use of space that furniture can’t: the alcoves beside a fireplace, the wall under a window, the corner that never quite works. Because they are built for the room, they look like part of the house rather than something added later.',
      `We design built-ins around the shape of your room, then build and install them for homes in ${towns} and the GTA.`,
    ],
    hero: {
      src: fireplaceFront,
      alt: 'White arched built-ins by VBS with lit wood floating shelves and flat-panel base cabinets flanking a stacked-stone fireplace with a wood mantel',
      caption: 'Arched fireplace built-in by VBS: lit wood shelves above flat-panel cabinets.',
    },
    offerings: [
      { title: 'Fireplace built-ins', text: 'Cabinets and shelving on either side of the fireplace, with arched or square openings.' },
      { title: 'Benches', text: 'Window seats and mudroom benches with storage underneath.' },
      { title: 'Storage walls', text: 'Floor-to-ceiling cabinets and shelving for living rooms, offices and basements.' },
      { title: 'Floating shelves', text: 'Solid floating shelves, on their own or as part of a larger built-in.' },
    ],
    gallery: [
      {
        src: fireplaceDetail,
        alt: 'Close-up of one arched niche on the VBS fireplace built-in with lit wood floating shelves above white flat-panel cabinets with black knobs',
        caption: 'Detail: arched niche with lit floating shelves.',
      },
    ],
    planning: [
      { title: 'Work with the room', text: 'Alcoves, bulkheads and uneven walls are measured and built around, so the finished piece sits tight to the walls.' },
      { title: 'Fireplace clearances', text: 'Around a fireplace we follow the manufacturer’s clearance requirements for the opening, mantel and nearby materials.' },
      { title: 'Closed below, open above', text: 'Cabinets at the bottom hide everyday things; open shelves above are for display.' },
      { title: 'Lighting', text: 'Shelf and niche lighting is best planned early so the wiring can be hidden.' },
    ],
    pricing: {
      rows: [{ label: 'Fireplace wall with built-ins, lighting or specialty panels', range: 'About $5,000–$10,000+' }],
      note: 'Planning range only, not a quote. Your price depends on the size of the wall, cabinetry, finish, lighting and installation.',
      guide: { href: '/blog/custom-media-wall-cost-gta', label: 'See the media and fireplace wall cost guide' },
    },
    faqs: [
      {
        q: 'How much do fireplace built-ins cost?',
        a: 'As a planning guide, a fireplace wall with built-ins, lighting or specialty panels is about $5,000–$10,000+. Smaller built-ins such as a bench or a single run of shelves cost less. Send photos and rough measurements for a quote.',
      },
      {
        q: 'Can you build around an existing fireplace?',
        a: 'Yes. We build cabinets and shelving around existing fireplaces and follow the fireplace manufacturer’s clearance requirements.',
      },
      {
        q: 'Will built-ins fit if my walls aren’t straight?',
        a: 'Yes. Built-ins are measured and made for the room, and uneven walls and floors are accounted for during the build and installation.',
      },
      {
        q: 'Do you build floating shelves on their own?',
        a: 'Yes. Floating shelves can be a project on their own or part of a larger built-in.',
      },
      {
        q: 'Which areas do you serve?',
        a: `We are based in Hamilton and build for homes in ${towns} and across the GTA.`,
      },
    ],
  },

  {
    slug: 'custom-woodworking',
    name: 'Custom Woodworking',
    serviceType: 'Custom woodworking and furniture',
    seoTitle: 'Custom Woodworking & Furniture in Hamilton | VBS',
    metaDescription:
      'Made-to-order dressers, nightstands, doors, gates and one-off wood pieces. Built in Hamilton for homes in Burlington, Waterdown, Oakville, Milton and the GTA.',
    eyebrow: 'Custom woodworking · Hamilton',
    h1: 'Custom woodworking and furniture in Hamilton',
    lead: 'Dressers, nightstands, doors, gates and one-off pieces, made to order in the size, wood and finish you want.',
    intro: [
      'Sometimes the piece you want doesn’t exist in a store, or it comes close but not in the right size. Custom woodworking means it is built to your dimensions, in the wood and finish that suit your room.',
      `We build furniture and one-off pieces for homes in ${towns} and the GTA. Send a sketch, a photo of something you like or rough dimensions to start.`,
    ],
    hero: {
      src: oakDresser,
      alt: 'Solid oak eight-drawer dresser by VBS with angled legs and black bar pulls',
      caption: 'Oak eight-drawer dresser by VBS with angled legs and black bar pulls.',
    },
    offerings: [
      { title: 'Dressers and nightstands', text: 'Bedroom furniture sized for your room, with drawers and open shelves where you want them.' },
      { title: 'Doors', text: 'Interior doors and door surrounds, including detailed carved work.' },
      { title: 'Gates', text: 'Wood gates with frames built to last outdoors.' },
      { title: 'One-off pieces', text: 'Tables, benches, shelving units and pieces made for a specific spot.' },
    ],
    gallery: [
      {
        src: oakNightstands,
        alt: 'Pair of oak nightstands by VBS, each with an open shelf above two drawers and angled legs',
        caption: 'Matching oak nightstands with an open shelf and two drawers.',
      },
      {
        src: carvedDoor,
        alt: 'Hand-carved wood door with a carved surround, pillars and a detailed arched header, a VBS woodworking project',
        caption: 'Carved wood door and surround, a VBS woodworking project.',
      },
      {
        src: herringboneGate,
        alt: 'Double side-yard gate by VBS with herringbone wood panels in a black frame between two brick houses',
        caption: 'Herringbone wood gate in a black frame.',
      },
    ],
    planning: [
      { title: 'Start with a reference', text: 'A photo of a piece you like, a sketch or a list of what it needs to hold is all we need to start.' },
      { title: 'Size it to the space', text: 'Measure the spot it will go, including any baseboards, windows or outlets nearby.' },
      { title: 'Choose the wood and finish', text: 'Oak, painted finishes and stained wood each give a different look. We talk through options with you.' },
      { title: 'Hardware matters', text: 'Pulls, slides and hinges change both the look and how the piece feels to use every day.' },
    ],
    faqs: [
      {
        q: 'Can you make a piece to match furniture I already have?',
        a: 'Send us photos of the furniture and the room. We can talk through wood, finish and hardware options to get close to what you have.',
      },
      {
        q: 'What kinds of pieces do you make?',
        a: 'Dressers, nightstands, doors, door surrounds, gates and other one-off pieces. If you have something else in mind, ask.',
      },
      {
        q: 'How do I get a quote for custom furniture?',
        a: 'Request a quote with a photo or sketch of what you want, rough dimensions and where it will go. We will come back with a quote.',
      },
      {
        q: 'Which areas do you serve?',
        a: `We are based in Hamilton and build for homes in ${towns} and across the GTA.`,
      },
    ],
  },
];

export const serviceLinks = services.map((s) => ({ label: s.name, href: `/${s.slug}` }));
