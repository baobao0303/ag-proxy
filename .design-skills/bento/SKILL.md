---
name: bento
description: Modular grid layout with card-like blocks, clear hierarchy, soft spacing, and subtle visual contrast for organized, scannable interfaces.
license: MIT
metadata:
  author: typeui.sh / bergside/awesome-design-skills
---

# Bento Design System Skill (Universal)

## Mission
Expert design-system guidelines for Bento Grid Architecture and Modern Glassmorphism.
Creates practical, high-aesthetic, implementation-ready guidance for modern AI dashboards.

## Brand & Visual Philosophy
- **Bento Box Philosophy:** Presents complex AI systems in visually appealing, organized modular blocks of varying sizes.
- **Visual Style:** Modern, clean, glassmorphic accents, high-contrast readability.
- **Typography Scale:** 10/12/14/16/20/24/32 | Font: Inter / Geist Sans | Mono: JetBrains Mono
- **Color Palette Tokens:**
  - Primary (Electric Violet): `#5A45FF`
  - Primary Gradient: `linear-gradient(135deg, #5A45FF 0%, #7B68EE 100%)`
  - Success (Online / Active): `#10B981`
  - Warning (Rate Limit Alert): `#F59E0B`
  - Danger (Error / Expired): `#EF4444`
  - Surface Light: `#FFFFFF` (Glass opacity 80-95%)
  - Background Light: `#F4F5FA`
  - Surface Dark: `#181528` / `#13111C`
- **Spacing Rhythm:** 4 / 8 / 12 / 16 / 20 / 24 / 32px

## Component Rules
1. **Cards & Containers:**
   - Always use `rounded-3xl` (24px) for hero containers and `rounded-2xl` (16px) for module cards.
   - Borders: Subtly tinted `border-border/40` or luminous `border-white/20` with soft shadows (`shadow-sm hover:shadow-md`).
   - Cards must feel tangible and scannable.
2. **Pill Switches:**
   - Clear binary state indicators (OFF in Rose-500, ON in Violet `#5A45FF`).
   - Smooth transform translations (`duration-200 ease-in-out`).
3. **Data Visualization (Charts & Gauges):**
   - Use high-contrast color coding for distinct models (Gemini in Purple `#5A45FF`, Claude in Rose `#EF4444`, Other in Amber `#F59E0B`).
   - Circular radial dials with smooth stroke-dashoffset transitions.
4. **Interaction & Micro-States:**
   - Explicit hover feedback (`hover:scale-[1.01]`, `active:scale-[0.99]`).
   - Keyboard accessible and WCAG 2.2 AA compliant.
