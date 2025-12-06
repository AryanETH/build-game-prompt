# Create Page - Under Development Overlay

## Overview

The Create page now displays an "Under Development" overlay with a blur effect and a support button that allows users to contribute to the project via UPI payment.

## Features Implemented

### 1. **Under Development Overlay**
- Full-screen overlay with blur effect (`backdrop-blur-md`)
- Semi-transparent black background (`bg-black/40`)
- Prevents interaction with underlying content (`pointer-events-none`)
- Content behind is blurred and dimmed (`opacity-50`)

### 2. **Visual Design**
- **Construction Icon**: Animated yellow construction icon with pulse effect
- **Ping Animation**: Expanding ring animation around the icon
- **Title**: "Under Development" in large, bold text
- **Description**: Friendly message explaining the feature is coming soon
- **Support Button**: Prominent gradient button with heart icon

### 3. **Support Dialog (UPI Payment)**
Reuses the same UPI payment system from GamePlayer tipping:

#### Features:
- **Currency Selection**: INR (₹) or USD ($)
- **Live Exchange Rate**: Fetches real-time USD to INR conversion
- **Amount Input**: Custom amount entry
- **Quick Select Buttons**: 
  - INR: ₹50, ₹100, ₹500
  - USD: $2, $5, $10
- **Conversion Display**: Shows INR equivalent for USD amounts
- **UPI Integration**: Opens user's UPI app (PhonePe, Google Pay, Paytm, etc.)

#### Payment Flow:
1. User clicks "Support This Project" button
2. Dialog opens with currency and amount options
3. User selects currency (INR/USD)
4. User enters or quick-selects amount
5. If USD, shows live INR conversion
6. User clicks "Send via UPI"
7. UPI app opens with pre-filled payment details
8. User completes payment in their UPI app
9. Success toast shows appreciation message

### 4. **UPI Configuration**
```typescript
const UPI_ID = "6260976807@axl";
const UPI_NAME = "ANIL";
```

UPI link format:
```
upi://pay?pa=6260976807@axl&pn=ANIL&mc=0000&mode=02&purpose=00&tn=Support%20Oplus%20Development&am=100&cu=INR
```

## Visual Layout

```
┌─────────────────────────────────────────┐
│                                         │
│         [Blurred Background]            │
│                                         │
│    ┌─────────────────────────────┐     │
│    │                             │     │
│    │    🚧 (animated pulse)      │     │
│    │                             │     │
│    │   Under Development         │     │
│    │                             │     │
│    │   We're working hard to     │     │
│    │   bring you an amazing      │     │
│    │   game creation experience  │     │
│    │                             │     │
│    │  [💜 Support This Project]  │     │
│    │                             │     │
│    │  Your support helps us...   │     │
│    │                             │     │
│    └─────────────────────────────┘     │
│                                         │
└─────────────────────────────────────────┘
```

## Support Dialog Layout

```
┌─────────────────────────────────────┐
│ 💜 Support Oplus Development        │
├─────────────────────────────────────┤
│                                     │
│ Your support helps us build...     │
│                                     │
│ Currency:                           │
│ ○ INR (₹)                          │
│ ○ USD ($) ≈ ₹83.45                │
│                                     │
│ Amount (₹):                         │
│ [_____________]                     │
│                                     │
│ Quick Select:                       │
│ [₹50]  [₹100]  [₹500]              │
│                                     │
│ ℹ️ Payment via UPI                  │
│ You'll be redirected to your       │
│ UPI app to complete payment        │
│                                     │
│         [Cancel]  [💵 Send via UPI] │
└─────────────────────────────────────┘
```

## Technical Implementation

### State Management
```typescript
const [supportDialogOpen, setSupportDialogOpen] = useState(false);
const [supportAmount, setSupportAmount] = useState("");
const [supportCurrency, setSupportCurrency] = useState<"INR" | "USD">("INR");
const [exchangeRate, setExchangeRate] = useState<number>(83);
const [isLoadingRate, setIsLoadingRate] = useState(false);
```

### Exchange Rate API
- **Provider**: exchangerate-api.com (free, no API key)
- **Endpoint**: `https://api.exchangerate-api.com/v4/latest/USD`
- **Fallback**: 83 INR per USD if API fails
- **Fetching**: Triggered when support dialog opens

### UPI Payment Handler
```typescript
const handleSupport = () => {
  const amount = parseFloat(supportAmount);
  const amountInINR = supportCurrency === "USD" 
    ? Math.round(amount * exchangeRate) 
    : amount;
  
  const upiLink = `upi://pay?pa=${UPI_ID}&pn=${UPI_NAME}&tn=Support%20Oplus%20Development&am=${amountInINR}&cu=INR`;
  
  window.location.href = upiLink;
  toast.success("Thank you for supporting Oplus! 💜");
};
```

## Styling Details

### Overlay
- `absolute inset-0 z-50` - Full screen, above content
- `bg-black/40 backdrop-blur-md` - Semi-transparent with blur
- `flex items-center justify-center` - Centered content

### Background Content
- `pointer-events-none` - Prevents clicks
- `select-none` - Prevents text selection
- `opacity-50` - Dimmed appearance

### Animations
- Construction icon: `animate-pulse`
- Ring effect: `animate-ping`
- Button hover: `hover:scale-105 transition-transform`

## User Experience

### Benefits:
1. **Clear Communication**: Users immediately know the feature is unavailable
2. **Positive Framing**: "Coming soon" rather than "Not available"
3. **Engagement Opportunity**: Support button turns limitation into contribution
4. **Professional Look**: Polished overlay with animations
5. **Easy Support**: One-click UPI payment with multiple currency options

### Accessibility:
- High contrast text on dark background
- Large, readable fonts
- Clear button labels
- Keyboard accessible (dialog can be closed with Escape)
- Screen reader friendly

## Future Enhancements

When ready to enable the Create feature:
1. Remove or comment out the overlay div
2. Remove `pointer-events-none` and `opacity-50` from background
3. Keep the support dialog for voluntary contributions
4. Add "Support" button to navigation or settings

## Testing Checklist

- [ ] Overlay displays on page load
- [ ] Background content is blurred and non-interactive
- [ ] Construction icon animates smoothly
- [ ] Support button opens dialog
- [ ] Currency toggle works (INR/USD)
- [ ] Exchange rate fetches successfully
- [ ] Amount input accepts numbers
- [ ] Quick select buttons populate amount
- [ ] USD amounts show INR conversion
- [ ] UPI link opens payment app
- [ ] Success toast appears after payment initiation
- [ ] Dialog closes after payment
- [ ] Works on mobile and desktop
- [ ] Responsive design looks good on all screen sizes

## Notes

- The UPI payment system is the same as the game tipping feature
- Exchange rates update each time the dialog opens
- Payment is processed through user's UPI app (secure)
- No payment processing happens on the website
- UPI is India-specific but USD option available for international users
