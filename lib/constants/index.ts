// MGM APJ Abdul Kalam Astrospace Science Centre - Constants

export const MUSEUM_INFO = {
  name: "MGM APJ Abdul Kalam Astrospace Science Centre & Club",
  shortName: "MGM Museum",
  location: "Aurangabad, Maharashtra, India",
  email: "info@mgmapjscicentre.org",
  phone: "+91 (240) 123-4567",
  website: "https://www.mgmapjscicentre.org/",
  address: {
    street: "MGM Campus",
    city: "Aurangabad",
    state: "Maharashtra",
    pincode: "431003",
    country: "India",
  },
  coordinates: {
    lat: 19.8762,
    lng: 75.3433,
  },
  socialMedia: {
    facebook: "https://facebook.com/mgmmuseum",
    twitter: "https://twitter.com/mgmmuseum",
    instagram: "https://instagram.com/mgmmuseum",
    youtube: "https://youtube.com/@mgmmuseum",
  },
};

export const OPENING_HOURS = {
  weekdays: {
    open: "09:30",
    close: "17:30",
  },
  weekends: {
    open: "09:30",
    close: "17:30",
  },
  closedDays: [1], // Monday (0 = Sunday, 1 = Monday, etc.)
  specialClosures: [], // Add special dates here
};

export const EXHIBITION_CATEGORIES = [
  {
    id: "solar_observatory",
    label: "Aditya Solar Observatory",
    description: "Explore the mysteries of our sun",
    icon: "sun",
  },
  {
    id: "science_park",
    label: "Outdoor Science Park",
    description: "Interactive outdoor exhibits",
    icon: "trees",
  },
  {
    id: "planetarium",
    label: "Planetarium",
    description: "Full dome digital planetarium shows",
    icon: "globe",
  },
  {
    id: "astro_gallery",
    label: "Astro Gallery & ISRO",
    description: "Indian space research showcase",
    icon: "rocket",
  },
  {
    id: "3d_theatre",
    label: "3D Theatre",
    description: "Immersive 3D science experiences",
    icon: "film",
  },
  {
    id: "math_lab",
    label: "Mathematics Lab",
    description: "Interactive math concepts",
    icon: "calculator",
  },
  {
    id: "physics_lab",
    label: "Basic Physics Lab",
    description: "Hands-on physics experiments",
    icon: "atom",
  },
  {
    id: "holography",
    label: "Holography Theatre",
    description: "3D holographic displays",
    icon: "cube",
  },
] as const;

export const TICKET_TYPES = [
  {
    id: "adult",
    label: "Adult",
    description: "Ages 13 and above",
    minAge: 13,
  },
  {
    id: "child",
    label: "Child",
    description: "Ages 3-12 years",
    minAge: 3,
    maxAge: 12,
  },
  {
    id: "student",
    label: "Student",
    description: "With valid student ID",
    requiresId: true,
  },
  {
    id: "senior",
    label: "Senior Citizen",
    description: "60 years and above",
    minAge: 60,
  },
  {
    id: "group",
    label: "Group",
    description: "10 or more people",
    minQuantity: 10,
  },
] as const;

export const DEFAULT_TIME_SLOTS = {
  exhibitions: [
    { start: "09:30", end: "10:30" },
    { start: "11:00", end: "12:00" },
    { start: "13:00", end: "14:00" },
    { start: "15:00", end: "16:00" },
    { start: "16:30", end: "17:30" },
  ],
  planetarium: [
    { start: "10:00", end: "10:45" },
    { start: "13:00", end: "13:45" },
    { start: "16:00", end: "16:45" },
  ],
  "3d_theatre": [
    { start: "10:30", end: "11:00" },
    { start: "12:00", end: "12:30" },
    { start: "14:00", end: "14:30" },
    { start: "16:00", end: "16:30" },
  ],
};

export const BOOKING_SETTINGS = {
  maxAdvanceBookingDays: 90,
  minAdvanceBookingHours: 2,
  maxTicketsPerBooking: 50,
  minTicketsPerBooking: 1,
  cancellationCutoffHours: 24,
  serviceFeePercentage: 2,
  gstPercentage: 18,
};

export const SEAT_MAP_CONFIG = {
  rows: ["A", "B", "C", "D", "E", "F", "G", "H"],
  seatsPerRow: 12,
  aisleAfterSeat: 6, // Create aisle after this seat number
  premiumRows: ["E", "F", "G"], // Premium seats
  disabledSeats: [], // Seats not available for booking
};

export const PAYMENT_METHODS = [
  { id: "upi", label: "UPI", icon: "smartphone" },
  { id: "card", label: "Credit/Debit Card", icon: "credit-card" },
  { id: "netbanking", label: "Net Banking", icon: "building" },
  { id: "wallet", label: "Digital Wallet", icon: "wallet" },
] as const;

export const SPECIAL_EVENTS = [
  {
    id: "100_hours_astronomy",
    name: "100 Hours of Astronomy",
    description: "Annual astronomy observation event",
    recurring: true,
  },
  {
    id: "science_day",
    name: "National Science Day",
    description: "Celebration on February 28",
    date: "02-28",
    recurring: true,
  },
] as const;

export const NAVIGATION_MENU = [
  { label: "Home", href: "/", value: "home" },
  { label: "Exhibitions", href: "/exhibitions", value: "exhibitions" },
  { label: "Shows", href: "/shows", value: "shows" },
  { label: "Events", href: "/events", value: "events" },
  { label: "Plan Visit", href: "/plan-visit", value: "plan-visit" },
  { label: "Gallery", href: "/gallery", value: "gallery" },
  { label: "About", href: "/about", value: "about" },
  { label: "Contact", href: "/contact", value: "contact" },
] as const;

export const VISITOR_GUIDELINES = [
  "Ticket must be purchased before entry",
  "Photography is allowed in designated areas only",
  "Food and beverages are not allowed inside exhibition areas",
  "Children must be accompanied by adults",
  "Please maintain silence in planetarium and theatre areas",
  "Touch and interact with exhibits marked as 'Interactive'",
  "Follow museum staff instructions at all times",
  "Emergency exits are clearly marked",
] as const;

export const FAQ_ITEMS = [
  {
    question: "What are the museum timings?",
    answer:
      "The museum is open from 9:30 AM to 5:30 PM on all days except Monday.",
  },
  {
    question: "Is photography allowed?",
    answer:
      "Yes, photography is allowed in most areas. However, flash photography and videography may be restricted in certain exhibitions.",
  },
  {
    question: "Are there any discounts for groups?",
    answer:
      "Yes, we offer special group discounts for parties of 10 or more. Please contact us for group booking arrangements.",
  },
  {
    question: "Is the museum wheelchair accessible?",
    answer:
      "Yes, the museum is fully wheelchair accessible with ramps and elevators available.",
  },
  {
    question: "Can I cancel or reschedule my booking?",
    answer:
      "Cancellations and rescheduling can be done up to 24 hours before your visit time. Please check our cancellation policy for details.",
  },
  {
    question: "Are there food facilities available?",
    answer:
      "Yes, we have a cafeteria serving snacks and beverages. Outside food is not allowed inside the museum.",
  },
] as const;

export const API_ENDPOINTS = {
  graphql: "/api/graphql",
  weather: "/api/weather",
  generateTicket: "/api/bookings/generate-ticket",
  sendConfirmation: "/api/bookings/send-confirmation",
  analytics: "/api/analytics",
} as const;

