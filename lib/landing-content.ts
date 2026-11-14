/**
 * Landing page copy shared by the FAQ section and its FAQPage JSON-LD,
 * so the structured data can never drift from what the page says.
 */
export const FAQS = [
  {
    id: 'files',
    question: 'Can I upload multiple CSV files at once?',
    answer: 'Yes. Drop in as many Trading 212 exports as you want — Vizvest will merge them, strip duplicate transactions, and review the full set together. You can also add files one at a time and remove any before confirming.'
  },
  {
    id: 'csv-length',
    question: 'What is the maximum duration of data I can upload?',
    answer: 'Trading 212 only lets you export up to 12 months per file, but there is no limit on Vizvest. Export several date ranges, upload them all, and we will stitch them into one continuous history for you.'
  },
  {
    id: 'currency-mixed',
    question: 'What if my exports use different base currencies?',
    answer: 'If the files you upload cover more than one base currency, Vizvest will ask which one you want to convert everything to before showing the dashboard.'
  },
  {
    id: 'privacy',
    question: 'Is my data stored on your servers?',
    answer:
      'No. Your CSV file is processed entirely in your browser. Nothing gets uploaded or stored anywhere.'
  },
  {
    id: 'csv',
    question: 'What format does my data need to be in?',
    answer:
      'We only support CSV exports from Trading 212. The app validates the format and shows you charts for your data.'
  },
  {
    id: 'data',
    question: 'Where can I get my Trading 212 data from?',
    answer:
      'From your Trading 212 account, open Settings, then History, and choose Export. Select your desired date range and confirm the export. The CSV file will download to your device and is ready to upload here.'
  }
] as const
