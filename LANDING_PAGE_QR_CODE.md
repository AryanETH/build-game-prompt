# Landing Page QR Code Feature ✅

## QR Code Added (Desktop Only - Right Side)

### Location
- **Position:** Hero section, right side
- **Visibility:** Only visible on desktop (xl breakpoint and above)

### Features
- **Links to Android app:** https://www.appcreator24.com/app3825715-wkm26q
- **Includes Oplus logo**
- **Text:** "Download Oplus — now available on Android for free."
- **Smartphone icon** for visual appeal
- **Adapts to light/dark theme**
- **Glassmorphism design** with backdrop blur

### Technical Implementation

```typescript
// QR Code Generation
useEffect(() => {
  const generateQR = async () => {
    try {
      const url = await QRCode.toDataURL('https://www.appcreator24.com/app3825715-wkm26q', {
        width: 200,
        margin: 2,
        color: {
          dark: isDarkMode ? '#FFFFFF' : '#000000',
          light: isDarkMode ? '#000000' : '#FFFFFF'
        }
      });
      setQrCodeUrl(url);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };
  generateQR();
}, [isDarkMode]);
```

### Responsive Behavior
- **Desktop (xl+):** QR code visible on right side
- **Mobile/Tablet:** QR code hidden for better UX

### Design Details
- **Size:** 200x200px QR code
- **Container:** Glassmorphism card with backdrop blur
- **Border:** 2px border adapting to theme
- **Padding:** 6 (1.5rem) for comfortable spacing
- **Border Radius:** 2xl (1rem) for modern look

## Footer Links Added

### Company Section
- About Us
- Contact Us
- Blog

### Legal Section
- Privacy Policy
- Terms & Conditions
- Cookie Policy

### Connect Section
- Instagram (with icon)
- Email (with icon)

All links are theme-aware and have hover effects!
