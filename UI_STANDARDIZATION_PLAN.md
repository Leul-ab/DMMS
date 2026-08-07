# UI Standardization Plan - White Background with Green/Red Borders

## Objective
Convert all buttons in the DMMS application to have white backgrounds with colored borders and text:
- **Green**: Positive/Primary actions (Add, Save, Edit, etc.)
- **Red**: Destructive actions (Delete, Cancel, Reject, etc.)

## Button Design Specifications

### Green (Positive) Buttons
```css
Default:
- background: white
- border: 2px solid green-600
- text: green-600
- shadow: sm

Hover:
- background: green-600
- border: 2px solid green-600
- text: white
- shadow: md
```

### Red (Destructive) Buttons
```css
Default:
- background: white
- border: 2px solid red-600
- text: red-600
- shadow: sm

Hover:
- background: red-600
- border: 2px solid red-600
- text: white
- shadow: md
```

## Implementation Status

### ✅ Step 1: Core Component Update
- [x] Update `resources/js/components/ui/button.tsx`
  - [x] Change `default` variant to white bg with green border/text
  - [x] Change `destructive` variant to white bg with red border/text
  - [x] Add hover states (filled background with white text)

### 🔄 Step 2: Authentication Pages

#### Login Page (`resources/js/pages/auth/login.tsx`)
- [ ] Line ~324: Login button - Change from orange gradient to default (green)
- [ ] Update any secondary buttons to use appropriate variant

#### Register Page (`resources/js/pages/auth/register.tsx`)
- [ ] Line ~149: Register button - Use default variant (green)
- [ ] Line ~154: Cancel/back button - Use destructive variant (red) if applicable

#### Other Auth Pages
- [ ] `reset-password.tsx`: Submit button (green)
- [ ] `confirm-password.tsx`: Confirm button (green)
- [ ] `two-factor-challenge.tsx`: Verify button (green)
- [ ] `verification.tsx`: Verify button (green)

###  🔄 Step 3: Dashboard Pages

#### Main Dashboard (`resources/js/pages/dashboard.tsx`)
- [ ] Review stat cards (decorative colors can stay)
- [ ] Update any action buttons to new standard

#### Kitchen Dashboard (`resources/js/pages/kitchen/dashboard.tsx`)
- [ ] Line ~626: Accept Order button → Green
- [ ] Line ~638: Set Timer & Start button → Green
- [ ] Line ~659: Mark Ready button → Green
- [ ] Line ~652: Add Time button → Green outline
- [ ] Refresh button → Green

### 🔄 Step 4: Manager Pages

#### Menu Items (`resources/js/pages/manager/items/index.tsx`)
- [ ] "Add Menu Item" button (Plus icon) → Green
- [ ] Edit buttons in table → Green
- [ ] Delete buttons → Red
- [ ] Modal submit buttons → Green
- [ ] Modal cancel buttons → Red
- [ ] Pagination buttons → Green outline

#### Categories (`resources/js/pages/manager/categories/index.tsx`)
- [ ] "Add Category" button → Green
- [ ] Edit buttons → Green
- [ ] Delete buttons → Red
- [ ] Modal form submit → Green
- [ ] Modal form cancel → Red

#### Tables (`resources/js/pages/manager/tables/index.tsx`)
- [ ] "Add Table" button → Green
- [ ] "Regenerate QR" button → Green
- [ ] "Print QR" button → Green
- [ ] Edit buttons → Green
- [ ] Delete buttons → Red

#### Orders (`resources/js/pages/manager/orders/index.tsx`)
- [ ] Status filter buttons → Green outline
- [ ] Action buttons → Green/Red as appropriate
- [ ] Export buttons → Green

#### Customers (`resources/js/pages/manager/customers/`)
- [ ] "Add Customer" button → Green
- [ ] Edit buttons → Green
- [ ] Delete buttons → Red
- [ ] Form submit → Green
- [ ] Form cancel → Red

#### Staff (`resources/js/pages/manager/staff/index.tsx`)
- [ ] "Add Staff" button → Green
- [ ] Edit buttons → Green
- [ ] Delete buttons → Red

#### Bookings (`resources/js/pages/manager/bookings/index.tsx`)
- [ ] Action buttons → Green/Red as appropriate
- [ ] Confirm buttons → Green
- [ ] Reject buttons → Red

#### Payment Verification (`resources/js/pages/manager/payment-verification/index.tsx`)
- [ ] Line ~414: "Verify Payment" button → Green
- [ ] Line ~422: "Reject Payment" button → Red
- [ ] Line ~333: Search button → Green
- [ ] Line ~338: Clear filter → Red

#### Reports (`resources/js/pages/manager/reports/index.tsx`)
- [ ] Tab navigation → Green outline
- [ ] Export buttons → Green
- [ ] Filter buttons → Green outline

#### Feedback (`resources/js/pages/manager/feedback/index.tsx`)
- [ ] Line ~173: Export button → Green
- [ ] Line ~409: Apply filters → Green
- [ ] Pagination buttons → Green outline

### 🔄 Step 5: Customer-Facing Pages

#### Menu Page (`resources/js/pages/menu/index.tsx`)
- [ ] "Add to Cart" buttons → Green
- [ ] "Place Order" button → Green
- [ ] "Become a Member" button → Green
- [ ] Line ~320-330: Registration form submit → Green
- [ ] Cancel buttons → Red
- [ ] Checkout buttons → Green
- [ ] Cart controls (+ / -) → Green outline

#### Menu View (`resources/js/pages/menu/menu-view.tsx`)
- [ ] Cart action buttons → Green
- [ ] Place Order button → Green
- [ ] Line ~1068, 1145: Member verification buttons → Green
- [ ] Add to cart buttons → Green

#### Booking Page (`resources/js/pages/booking/index.tsx`)
- [ ] Table selection buttons → Green outline
- [ ] Confirm booking → Green
- [ ] Cancel booking → Red
- [ ] Continue buttons → Green

#### Landing Page (`resources/js/pages/LandingPage.tsx`)
- [ ] Line ~323: Registration submit → Green
- [ ] Member login → Green
- [ ] Copy code button → Green

### 🔄 Step 6: Service Pages

#### Serve Page (`resources/js/pages/serve/index.tsx`)
- [ ] Line ~258: "Complete Order" button (currently green gradient) → Green with white bg
- [ ] Line ~114: Refresh button → Green
- [ ] Line ~83: History button → Green outline

### 🔄 Step 7: Settings Pages

#### Profile (`resources/js/pages/settings/profile.tsx`)
- [ ] Line ~149: "Update Profile" → Green
- [ ] Delete account → Red

#### Security (`resources/js/pages/settings/security.tsx`)
- [ ] Line ~159: "Update Password" → Green
- [ ] Enable 2FA → Green
- [ ] Disable 2FA → Red
- [ ] Regenerate codes → Green

#### Two-Factor Setup (`resources/js/components/settings/manage-two-factor.tsx`)
- [ ] Line ~67: Enable button → Green
- [ ] Line ~103: Disable button → Red

#### Recovery Codes (`resources/js/components/settings/two-factor-recovery-codes.tsx`)
- [ ] Line ~91: Regenerate button → Green

### 🔄 Step 8: Modal Components

#### Feedback Modal (`resources/js/components/feedback-modal.tsx`)
- [ ] Submit feedback → Green
- [ ] Close button → Red

#### Receipt Modal (`resources/js/components/receipt-modal.tsx`)
- [ ] Print button → Green
- [ ] Close button → Red

#### QR Preview Modal (`resources/js/components/qr-preview-modal.tsx`)
- [ ] Print QR → Green
- [ ] Close → Red

#### Two-Factor Setup Modal (`resources/js/pages/settings/two-factor-setup-modal.tsx`)
- [ ] Line ~216: Enable button → Green
- [ ] Cancel button → Red

#### Passkey Register (`resources/js/pages/settings/passkey-register.tsx`)
- [ ] Line ~99: Register passkey → Green

#### Delete User (`resources/js/components/settings/delete-user.tsx`)
- [ ] Line ~105: Delete confirmation → Red

### 🔄 Step 9: Additional Components

#### Badge Component
- [ ] Review badge colors (may need green/red variants)

#### Dialog/Alert Components
- [ ] Confirm buttons → Green
- [ ] Cancel buttons → Red

#### Toast Notifications
- [ ] Action buttons → Green/Red as appropriate

## Color Reference

### Green (Positive Actions)
- **Tailwind Class**: `green-600`
- **Hex**: `#16a34a`
- **Use For**: Add, Save, Create, Edit, Update, Login, Register, Verify, Submit, Confirm, Accept, Complete, View, Print, Download, Export

### Red (Destructive Actions)
- **Tailwind Class**: `red-600`
- **Hex**: `#dc2626`
- **Use For**: Delete, Remove, Cancel, Reject, Close, Reset, Clear, Logout, Deny

### Disabled State
- **Background**: `white` or `gray-100`
- **Border**: `gray-300`
- **Text**: `gray-400`
- **No hover effect**
- **Not clickable**

## Custom Button Examples

### Example 1: Green Submit Button
```jsx
<button
  type="submit"
  className="rounded-xl bg-white border-2 border-green-600 px-5 py-3.5 font-bold text-green-600 transition-colors hover:bg-green-600 hover:text-white"
>
  Submit
</button>
```

### Example 2: Red Cancel Button
```jsx
<button
  type="button"
  onClick={handleCancel}
  className="rounded-xl bg-white border-2 border-red-600 px-5 py-3.5 font-bold text-red-600 transition-colors hover:bg-red-600 hover:text-white"
>
  Cancel
</button>
```

### Example 3: Using Button Component
```jsx
<Button variant="default">Save</Button>
<Button variant="destructive">Delete</Button>
```

## Testing Checklist

After implementation, test each page:
- [ ] All buttons have white backgrounds
- [ ] Positive actions use green borders/text
- [ ] Destructive actions use red borders/text
- [ ] Hover states work correctly (colored bg, white text)
- [ ] Disabled states show properly
- [ ] Icons match button colors
- [ ] Mobile responsive
- [ ] Keyboard navigation works
- [ ] Screen reader accessible

## Notes

1. **Icon Colors**: Icons inside buttons should inherit the button's text color
2. **Badge Colors**: Review and potentially create green/red badge variants
3. **Stat Cards**: Decorative colors on dashboard stat cards can remain as-is
4. **Links**: Text links can remain as primary color unless they're action buttons
5. **Tabs**: Tab navigation can use green outline style for active state

## Priority Order

1. **High Priority**: Authentication, Manager pages, Customer-facing pages
2. **Medium Priority**: Dashboard, Settings, Modal components
3. **Low Priority**: Decorative elements, informational components

## Estimated Files to Update

- Core component: 1 file ✅
- Page components: ~30-40 files
- Modal/Dialog components: ~10 files
- Settings components: ~5 files
- Total: ~45-55 files

## Current Progress

- ✅ Button component updated
- 🔄 Page-by-page implementation in progress
- ⏳ Testing pending
- ⏳ Documentation pending
