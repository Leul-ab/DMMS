# Customer Membership Enhancement - Testing Guide

## Prerequisites
- ✅ Database migration applied
- ✅ Frontend assets compiled (`npm run build`)
- ✅ Application running (`php artisan serve`)

## Test Scenarios

### 1. Customer Registration & Success Modal

#### Test Steps:
1. Navigate to `/menu` page
2. Click the "👤 Become a Member" button
3. Fill in the registration form:
   - **Full Name**: Test User
   - **Phone Number**: 0987654321 (must be unique)
   - **Email**: test@example.com (optional)
4. Click "Become a Member" button

#### Expected Results:
- ✅ Registration form modal closes
- ✅ Success modal appears with:
  - Green checkmark icon at the top
  - Title: "Registration Successful"
  - Congratulations message
  - Customer code displayed in a highlighted box (e.g., CUS-000127)
  - Important notice about saving the code
  - "📋 Copy Code" button
  - "Continue" button

#### Test Copy Code Button:
1. Click "📋 Copy Code" button
2. Paste the copied text somewhere (Ctrl+V)

**Expected Results:**
- ✅ Customer code copied to clipboard
- ✅ Toast notification appears: "Customer code copied to clipboard!"
- ✅ Toast disappears after 3 seconds

#### Test Continue Button:
1. Click "Continue" button

**Expected Results:**
- ✅ Success modal closes
- ✅ User returns to menu page

### 2. Validation Testing

#### Test Missing Required Fields:
1. Open registration modal
2. Leave "Full Name" empty
3. Enter phone number
4. Click "Become a Member"

**Expected Results:**
- ✅ Error message appears for "Full Name" field
- ✅ Form does not submit

#### Test Duplicate Phone Number:
1. Try to register with an already used phone number
2. Click "Become a Member"

**Expected Results:**
- ✅ Error message: "The phone has already been taken."
- ✅ Form does not submit

#### Test Duplicate Email:
1. Try to register with an already used email
2. Click "Become a Member"

**Expected Results:**
- ✅ Error message: "The email has already been taken."
- ✅ Form does not submit

### 3. Customer Management Table

#### Test Table Display:
1. Login as Manager
2. Navigate to `/manager/customers`

**Expected Results:**
- ✅ Table displays with correct columns in order:
  1. Customer Code (first column)
  2. Full Name
  3. Phone Number
  4. Email
  5. Registration Date
  6. Status
  7. Actions
- ✅ Customer code displayed in orange monospace font
- ✅ Registration dates formatted as "Mon DD, YYYY"
- ✅ Status badges show "Active" (green) or "Inactive" (gray)

#### Test Search Functionality:
1. Enter a customer code in search box (e.g., "CUS-000125")
2. Verify search results

**Expected Results:**
- ✅ Table filters to show only matching customer
- ✅ Search works with customer code
- ✅ Search still works with name, phone, email

#### Test Customer Code Search:
1. Search: "CUS-000"
2. Verify results

**Expected Results:**
- ✅ All customers with codes starting with "CUS-000" appear
- ✅ Real-time filtering works

### 4. View Customer Details

#### Test View Modal:
1. Click the "👁️ View" button on any customer row
2. Check customer details modal

**Expected Results:**
- ✅ Modal opens with customer details
- ✅ Customer code displayed prominently in a highlighted box
- ✅ All customer information visible:
  - Customer Code
  - Full Name
  - Phone Number
  - Email (or "Not provided")
  - Membership status
  - Registered date
- ✅ "Close" button works

### 5. Edit Customer

#### Test Edit Modal:
1. Click the "✏️ Edit" button on any customer row
2. Check the edit form

**Expected Results:**
- ✅ Modal opens with customer data pre-filled
- ✅ Customer code field is disabled (read-only)
- ✅ Help text appears: "Customer codes are generated automatically and cannot be changed."
- ✅ Name, phone, email fields are editable
- ✅ Membership checkbox works
- ✅ "Update Customer" button saves changes

### 6. Customer Code Generation

#### Test Sequential Generation:
1. Note the current highest customer code (e.g., CUS-000125)
2. Register a new customer
3. Check the customer code in success modal

**Expected Results:**
- ✅ New customer code is sequential (e.g., CUS-000126)
- ✅ Code follows format: CUS-XXXXXX (6 digits with leading zeros)
- ✅ Code is unique and not duplicated

#### Test Customer Code Uniqueness:
1. Check database: `php artisan tinker --execute="echo Customer::count() . ' customers';""`
2. Register multiple customers
3. Verify all have unique codes

**Expected Results:**
- ✅ No duplicate customer codes exist
- ✅ Each customer has exactly one unique code

### 7. Responsive Design Testing

#### Test on Desktop (1920x1080):
1. Open registration modal
2. Check success modal
3. View customer table

**Expected Results:**
- ✅ Modal centered and readable
- ✅ Customer code large and prominent
- ✅ Table displays all columns without scrolling

#### Test on Tablet (768x1024):
1. Repeat desktop tests

**Expected Results:**
- ✅ Modal responsive and readable
- ✅ Table may scroll horizontally
- ✅ All functionality works

#### Test on Mobile (375x667):
1. Repeat desktop tests

**Expected Results:**
- ✅ Modal fills screen appropriately
- ✅ Customer code still prominent
- ✅ Table scrolls horizontally
- ✅ Buttons accessible and tappable

### 8. Integration Testing

#### Test Booking with Customer Code:
1. Register a new customer and note the customer code
2. Navigate to `/booking`
3. Select tables
4. Enter the customer code in verification step
5. Complete booking

**Expected Results:**
- ✅ Customer code verifies successfully
- ✅ Customer name displays in confirmation
- ✅ Booking completes successfully

### 9. Edge Cases

#### Test Very Long Names:
1. Register with a very long name (e.g., 250 characters)

**Expected Results:**
- ✅ Name is accepted (max 255 chars)
- ✅ Displays correctly in table without breaking layout

#### Test Special Characters:
1. Register with special characters in name (e.g., "O'Brien")
2. Register with international characters (e.g., "José García")

**Expected Results:**
- ✅ Special characters accepted
- ✅ Customer code generates correctly
- ✅ Data displays correctly

#### Test Empty Email:
1. Register without entering email (leave blank)

**Expected Results:**
- ✅ Registration succeeds (email is optional)
- ✅ Email shows as "Not provided" in table

### 10. Performance Testing

#### Test with Many Customers:
1. Create 100+ customers (use seeder if available)
2. Open customer management page
3. Test search functionality

**Expected Results:**
- ✅ Table loads within reasonable time
- ✅ Search filters quickly
- ✅ No lag or performance issues

## Database Verification

### Check Customer Code in Database:
```bash
php artisan tinker
```
```php
// Check latest customers
Customer::latest()->take(5)->get(['id', 'customer_code', 'name', 'phone']);

// Verify uniqueness
Customer::select('customer_code')->groupBy('customer_code')->havingRaw('COUNT(*) > 1')->count();
// Should return 0 (no duplicates)

// Check null customer codes
Customer::whereNull('customer_code')->count();
// Should return 0 (all customers have codes)
```

## Browser Compatibility

Test in the following browsers:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

## Accessibility Testing

### Keyboard Navigation:
1. Use Tab key to navigate through forms
2. Use Enter to submit forms
3. Use Esc to close modals

**Expected Results:**
- ✅ All interactive elements accessible via keyboard
- ✅ Focus indicators visible
- ✅ Tab order logical

### Screen Reader Testing:
1. Enable screen reader (NVDA/JAWS/VoiceOver)
2. Navigate registration form
3. Listen to success modal announcements

**Expected Results:**
- ✅ Form labels read correctly
- ✅ Customer code announced clearly
- ✅ Button purposes clear

## Common Issues & Solutions

### Issue 1: Success Modal Not Appearing
**Solution:** Check browser console for JavaScript errors. Ensure `npm run build` completed successfully.

### Issue 2: Customer Code Not Copying
**Solution:** Check if HTTPS is enabled (clipboard API requires secure context) or test on localhost.

### Issue 3: Table Not Showing Customer Code
**Solution:** Run `php artisan migrate` to ensure customer_code column exists.

### Issue 4: Duplicate Customer Codes
**Solution:** Check database uniqueness constraint and generation logic.

## Test Report Template

```
Test Date: _______________
Tester: _______________
Browser: _______________
Device: _______________

| Test Scenario                    | Status | Notes |
|----------------------------------|--------|-------|
| Customer Registration            | ✅/❌   |       |
| Success Modal Display            | ✅/❌   |       |
| Copy Code Functionality          | ✅/❌   |       |
| Customer Table Display           | ✅/❌   |       |
| Search Functionality             | ✅/❌   |       |
| Customer Code Generation         | ✅/❌   |       |
| Validation (Required Fields)     | ✅/❌   |       |
| Validation (Duplicates)          | ✅/❌   |       |
| Responsive Design (Desktop)      | ✅/❌   |       |
| Responsive Design (Mobile)       | ✅/❌   |       |
| Integration with Booking         | ✅/❌   |       |

Overall Status: ✅ PASS / ❌ FAIL
```

## Automated Testing (Optional)

### PHPUnit Test Example:
```php
public function test_customer_registration_generates_code()
{
    $response = $this->post('/customer/register', [
        'name' => 'Test User',
        'phone' => '0987654321',
        'email' => 'test@example.com',
    ]);

    $response->assertStatus(200);
    $response->assertJson([
        'success' => true,
    ]);
    $response->assertJsonStructure([
        'customer_code',
        'customer',
    ]);

    $this->assertDatabaseHas('customers', [
        'phone' => '0987654321',
    ]);
}
```

### Laravel Dusk Test Example:
```php
public function test_registration_success_modal()
{
    $this->browse(function (Browser $browser) {
        $browser->visit('/menu')
                ->click('@become-member-button')
                ->type('name', 'Test User')
                ->type('phone', '0987654321')
                ->type('email', 'test@example.com')
                ->press('Become a Member')
                ->waitFor('@success-modal')
                ->assertSee('Registration Successful')
                ->assertSee('CUS-');
    });
}
```
