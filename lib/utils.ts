import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// The design system adds its own type scale, radii and shadows to Tailwind.
// tailwind-merge has to know about them, otherwise it reads `text-p-sm` as a
// colour and drops it when a real colour class follows.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        { text: ['h1', 'h2', 'h2-m', 'h3', 'h4', 'h5', 'p-lg', 'p', 'p-sm', 'small', 'label'] },
      ],
      rounded: [{ rounded: ['xs', 'field'] }],
      shadow: [{ shadow: ['demo-surface', 'frame', 'ring-secondary', 'field', 'field-focus'] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
