# Admin Panel - Pure Black & White Theme Update

## Changes Needed

Replace all gray colors with pure black/white:

### Dark Mode (Night Mode)
- Background: `bg-black` (pure black)
- Cards: `bg-white/5` (5% white overlay)
- Borders: `border-white/10` (10% white)
- Text Primary: `text-white`
- Text Secondary: `text-white/60`
- Text Tertiary: `text-white/40`
- Icons: `text-white/20`
- Hover: `hover:bg-white/10`

### Light Mode  
- Background: `bg-white` (pure white)
- Cards: `bg-black/5` (5% black overlay)
- Borders: `border-black/10` (10% black)
- Text Primary: `text-black`
- Text Secondary: `text-black/60`
- Text Tertiary: `text-black/40`
- Icons: `text-black/20`
- Hover: `hover:bg-black/10`

## Find and Replace

In `src/pages/Admin.tsx`, replace:

```
bg-gray-900 → bg-black
bg-gray-800 → bg-white/5
bg-gray-700 → bg-white/10
bg-gray-50 → bg-white

border-gray-700 → border-white/10
border-gray-600 → border-white/20
border-gray-200 → border-black/10

text-gray-900 → text-black
text-gray-400 → text-white/60
text-gray-500 → text-white/40
text-gray-600 → text-black/60

hover:bg-gray-750 → hover:bg-white/10
hover:bg-gray-50 → hover:bg-black/5
```

## Result

Pure black and white theme with subtle transparency for depth.
