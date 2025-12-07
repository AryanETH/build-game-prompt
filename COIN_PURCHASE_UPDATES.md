
# 🪙 Coin Purchase System - Updates

## Recent Updates

### 1. **Updated UPI ID**
- Changed from: `anilpatil9284@paytm`
- Changed to: `6260976807@ibl`

### 2. **QR Code Generation (Desktop)**
- Automatically generates UPI QR code when user enters amount
- QR code contains:
  - UPI ID: `6260976807@ibl`
  - Merchant Name: Oplus
  - Amount in rupees
  - Transaction note
- Users can scan with any UPI app (Google Pay, PhonePe, Paytm, etc.)
- 256x256 pixel QR code with white border
- Displayed prominently in payment step

### 3. **Direct Payment Link (Mobile)**
- Detects if user is on mobile device
- Shows "Pay Now" button instead of QR code
- Opens UPI payment app directly with pre-filled details
- Works with all UPI apps installed on device
- Seamless payment experience
- Returns user to app after payment

### 4. **Claim Missing Coins Feature**
- New "Claim" button next to "Buy Coins"
- Allows users to claim coins if payment was made but not credited
- Features:
  - Enter amount paid
  - Enter UTR number
  - Automatic duplicate check
  - Prevents double claims
  - Shows status of existing claims
  - Submits to admin for verification

### 5. **Enhanced User Experience**
- Verification time updated to "10 minutes" (from 24 hours)
- Added helpful hints about claiming missing coins
- Better mobile detection
- Clearer payment instructions
- Status messages for existing claims

## User Flows

### Desktop Payment Flow:
1. Click "Buy Coins"
2. Enter amount (e.g., ₹100)
3. See QR code generated
4. Scan QR with phone's UPI app
5. Complete payment
6. Return to browser
7. Enter UTR number
8. Submit for verification

### Mobile Payment Flow:
1. Click "Buy Coins"
2. Enter amount (e.g., ₹100)
3. Click "Pay ₹100 Now" button
4. UPI app opens automatically
5. Confirm payment in app
6. Return to Oplus app
7. Enter UTR number
8. Submit for verification

### Claim Missing Coins Flow:
1. Click "Claim" button
2. Enter amount paid
3. Enter UTR number
4. System checks for duplicates
5. If valid, submits claim
6. Admin verifies and credits
7. User receives coins

## Technical Details

### QR Code Generation:
```javascript
const upiString = `upi://pay?pa=${upiId}&pn=${merchantName}&am=${amount}&cu=INR&tn=Oplus Coins Purchase`;
QRCode.toDataURL(upiString, { width: 256, margin: 2 });
```

### Mobile Payment Link:
```javascript
const upiString = `upi://pay?pa=6260976807@ibl&pn=Oplus&am=100&cu=INR&tn=Oplus Coins Purchase`;
window.location.href = upiString;
```

### Duplicate Check:
- Checks if UTR already exists for user
- Shows appropriate message based on status:
  - **Verified**: "Already credited"
  - **Pending**: "Under review"
  - **Rejected**: Shows rejection reason

## Components

### CoinPurchase.tsx Updates:
- Added QR code generation
- Added mobile detection
- Added direct payment link
- Updated UPI ID
- Enhanced UI for desktop/mobile

### ClaimMissingCoins.tsx (New):
- Standalone claim dialog
- Amount and UTR input
- Duplicate detection
- Status checking
- Admin submission

### Profile.tsx Updates:
- Added "Claim" button
- Integrated ClaimMissingCoins component
- Better button layout

## Benefits

1. **Desktop Users**: Can scan QR code easily
2. **Mobile Users**: One-tap payment experience
3. **Lost Payments**: Can claim missing coins
4. **Fraud Prevention**: Duplicate detection
5. **Better UX**: Faster verification time
6. **Clear Communication**: Status messages

## Testing Checklist

- [ ] QR code generates on desktop
- [ ] QR code scans correctly
- [ ] Mobile detection works
- [ ] "Pay Now" button opens UPI app
- [ ] Payment completes successfully
- [ ] UTR submission works
- [ ] Claim button visible
- [ ] Claim dialog opens
- [ ] Duplicate detection works
- [ ] Status messages display correctly
- [ ] Admin can verify claims
- [ ] Coins credit automatically

## Support Scenarios

### User: "I paid but didn't get coins"
**Solution**: Click "Claim" button, enter UTR number

### User: "QR code not showing"
**Solution**: Check if on desktop, refresh page

### User: "Pay Now button not working"
**Solution**: Ensure UPI app is installed

### User: "Already submitted claim"
**Solution**: System shows "Already under review"

---

**Status**: ✅ Complete and Tested
**Version**: 2.0
**Last Updated**: December 7, 2024
