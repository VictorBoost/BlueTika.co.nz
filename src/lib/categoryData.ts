export const categoryData = {
  cleaning: {
    title: "Cleaning Services in New Zealand",
    description: "Professional cleaning services for your home or business. From regular house cleaning to deep commercial cleans, find verified local cleaners on BlueTika.",
    commonProblems: [
      "Moving in/out and need a deep clean",
      "Regular weekly or fortnightly house cleaning",
      "Commercial office cleaning",
      "Carpet and upholstery cleaning",
      "End of tenancy cleaning",
      "Spring cleaning and decluttering"
    ],
    howBlueTikaHelps: [
      "Get multiple quotes from verified cleaners in your area",
      "Compare prices and read reviews from past clients",
      "Payment protection - funds held in escrow until job complete",
      "24-hour dispute window after completion",
      "All cleaners background-checked and verified"
    ]
  },
  handyman: {
    title: "Handyman Services in New Zealand",
    description: "Skilled handymen for all your home repairs and maintenance. From fixing doors to assembling furniture, hire trusted local handymen on BlueTika.",
    commonProblems: [
      "Furniture assembly and installation",
      "Minor repairs around the house",
      "Painting touch-ups and small jobs",
      "Hanging shelves, TVs, and artwork",
      "Deck and fence repairs",
      "General maintenance and odd jobs"
    ],
    howBlueTikaHelps: [
      "Post your job once, receive bids from skilled handymen",
      "Review provider profiles and past work examples",
      "Secure payment system with escrow protection",
      "Insurance and verification checks on all providers",
      "Direct messaging to clarify job requirements"
    ]
  },
  movers: {
    title: "Moving Services in New Zealand",
    description: "Reliable moving and transportation services across New Zealand. Whether local or long-distance, find professional movers on BlueTika.",
    commonProblems: [
      "House or apartment relocation",
      "Office moves and business relocations",
      "Furniture delivery and pickup",
      "Interstate and long-distance moves",
      "Packing and unpacking services",
      "Storage solutions during moves"
    ],
    howBlueTikaHelps: [
      "Compare quotes from licensed moving companies",
      "Read verified reviews from past moves",
      "Insurance coverage verification",
      "Transparent pricing with no hidden fees",
      "Payment protection until move completed"
    ]
  },
  electrical: {
    title: "Electrician Services in New Zealand",
    description: "Licensed electricians for all your electrical work. From installing lights to rewiring homes, hire registered sparkies on BlueTika.",
    commonProblems: [
      "Light fitting installation and repairs",
      "Power outlet installation",
      "Safety inspections and compliance",
      "Rewiring and upgrades",
      "Switchboard repairs",
      "Appliance installation and setup"
    ],
    howBlueTikaHelps: [
      "All electricians are registered and licensed",
      "Trade certificates verified before bidding",
      "Get detailed quotes with timeline estimates",
      "Escrow payment protection",
      "Certificate of Compliance provided"
    ]
  },
  plumbing: {
    title: "Plumbing Services in New Zealand",
    description: "Qualified plumbers for all plumbing needs. From fixing leaks to full bathroom renovations, find certified plumbers on BlueTika.",
    commonProblems: [
      "Leaking taps and pipes",
      "Blocked drains and toilets",
      "Hot water cylinder repairs",
      "Bathroom renovations",
      "Kitchen plumbing installation",
      "Emergency plumbing repairs"
    ],
    howBlueTikaHelps: [
      "Certified plumbers with trade qualifications",
      "Emergency services available",
      "Upfront pricing with detailed quotes",
      "Payment held securely until job done",
      "Workmanship guarantees from providers"
    ]
  },
  landscaping: {
    title: "Landscaping Services in New Zealand",
    description: "Professional landscaping and garden maintenance. From lawn care to complete garden makeovers, hire skilled landscapers on BlueTika.",
    commonProblems: [
      "Lawn mowing and maintenance",
      "Garden design and installation",
      "Tree trimming and removal",
      "Hedge trimming and shaping",
      "Decking and outdoor structures",
      "Garden cleanup and weeding"
    ],
    howBlueTikaHelps: [
      "View portfolios of completed projects",
      "Get design ideas and expert advice",
      "Compare quotes for your specific needs",
      "Payment protection throughout project",
      "Photo evidence required before payment release"
    ]
  },
  painting: {
    title: "Painting Services in New Zealand",
    description: "Professional painters for interior and exterior work. From single rooms to whole houses, find experienced painters on BlueTika.",
    commonProblems: [
      "Interior room painting",
      "Exterior house painting",
      "Commercial painting projects",
      "Deck and fence staining",
      "Wallpaper removal and prep",
      "Renovation painting"
    ],
    howBlueTikaHelps: [
      "View before/after photos from past jobs",
      "Get detailed quotes including materials",
      "Verified painters with references",
      "Progress updates with photo evidence",
      "Secure payment until final inspection"
    ]
  },
  "domestic-helper": {
    title: "Domestic Helper Services in New Zealand",
    description: "Trusted domestic helpers for childcare, eldercare, and household support. All helpers are police-checked and first aid certified on BlueTika.",
    commonProblems: [
      "Childcare and nanny services",
      "Elderly care and companionship",
      "Household management",
      "Meal preparation and cooking",
      "Light housekeeping",
      "Pet care and walking"
    ],
    howBlueTikaHelps: [
      "All helpers police-checked and verified",
      "First aid certification required",
      "Read detailed reviews and ratings",
      "Interview candidates before hiring",
      "Flexible payment schedules",
      "Background verification included"
    ]
  }
};

export const getCategoryData = (slug: string) => {
  return categoryData[slug as keyof typeof categoryData] || null;
};