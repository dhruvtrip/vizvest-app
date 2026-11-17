// Single source for the FAQ section and its structured data in app/page.tsx.
export const FAQS = [
  {
    id: 'files',
    question: 'Can I upload more than one CSV?',
    answer:
      'Yes. Drop in as many Trading 212 exports as you like. Vizvest merges them, removes duplicate transactions and analyses the full set together. You can add files one at a time and remove any before you confirm.',
  },
  {
    id: 'history',
    question: 'How far back can my data go?',
    answer:
      'Trading 212 exports up to 12 months per file, and Vizvest has no limit. Export several date ranges, upload them together and they are stitched into one continuous history.',
  },
  {
    id: 'currencies',
    question: 'What if my exports use different base currencies?',
    answer:
      'If your files cover more than one base currency, Vizvest asks which one to convert everything to before it shows the dashboard.',
  },
  {
    id: 'privacy',
    question: 'Is my data stored on your servers?',
    answer:
      'No. Your CSV is processed entirely in your browser. It is never uploaded or stored, and it is cleared when you refresh or close the page.',
  },
  {
    id: 'format',
    question: 'What format does my data need to be in?',
    answer:
      'A CSV export from Trading 212. Vizvest checks the file before it builds your dashboard and tells you if anything is missing.',
  },
  {
    id: 'export',
    question: 'Where do I get my Trading 212 export?',
    answer:
      'In the Trading 212 app or on the web, open the Menu in your Invest or Stocks ISA account, choose History, then tap the export icon in the top-right corner. Pick a date range of up to 12 months and the data types you want, confirm, and the CSV downloads to your device, ready to upload here.',
  },
  {
    id: 'price',
    question: 'Is Vizvest free?',
    answer: 'Yes. Vizvest is free to use, and no account is required.',
  },
] as const
