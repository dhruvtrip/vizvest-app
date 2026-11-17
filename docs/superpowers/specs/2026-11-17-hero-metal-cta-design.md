# Hero metal CTA design

## Intent

Make the landing hero's primary call to action stand out with a liquid metal ring and glow, in the style of the reference screenshot. The label changes to "Try For Free". The owner wants to see three colour versions on the real page and pick one.

## Goals

- The hero primary CTA reads "Try For Free", links to `/dashboard` and keeps the `dashboard_cta_clicked` PostHog event with `location: 'hero_section'`.
- An animated metal-fx ring and glow sit around that button only.
- Three tones can be compared on the live landing page: `gold` (closest to the bronze brand), `silver` and `chromatic` (rainbow).

## Non-goals

- No ring on any other button.
- No proximity reflections, cursor bend or cursor light.
- No custom bronze tint yet. If the owner picks gold and it reads too yellow, tuning it toward `--brand` is a follow-up.

## Anti-goals

- The hero must not paint later or shift layout because of the effect.
- The button size stays the default pill (`h-9 px-4`). No new sizes.
- Nothing in `components/ui/` changes.

## Constraints

- metal-fx v2 needs WebGL2. Without it, the plain button shows.
- metal-fx compiles one shared WebGL program per page, so presets are global. Only one tone can show on a page at a time, which rules out a side-by-side comparison on one page.
- The site theme comes from next-themes. metal-fx's `theme="auto"` follows the OS, so the theme must be passed in from `resolvedTheme`.
- Reduced motion pauses the ring and leaves it visible.

## Approaches

1. **metal-fx shader (picked).** Matches the reference and the owner's sample code. Adds a 140 KB dependency, loaded lazily after hydration.
2. CSS conic-gradient ring. No dependency, but reads as a sweeping shine, not flowing metal. Rejected by the owner.

Tone comparison: a temporary `?cta=gold|silver|chromatic` query parameter on `/`, defaulting to `gold`. It's removed once a tone is chosen. A preview route was ruled out because presets are global per page, so it couldn't show the three side by side either.

## Decided

- Wrapper component `MetalRing` in `components/motion/metal-ring.tsx`.
- metal-fx is imported dynamically in an effect. Until it resolves, the child renders bare.
- Engine: metal-fx. Colour: owner picks from three tones.
- The duplicate "Free" goes from the line under the buttons. It now reads "No account needed."

## Left to the builder

- Whether to set `innerShadow`, and the `strength` value, after seeing the ring in both themes.
