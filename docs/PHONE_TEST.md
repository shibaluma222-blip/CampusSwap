# Real phone test checklist

Live site: https://campusswap-teal.vercel.app (Settings > Version shows the build number, so you can confirm both phones run the same build).

Use **two phones**: Phone A is the buyer, Phone B is the seller. Tick each box. If something looks wrong, screenshot it and note the phone model, OS version and browser.

Accounts
- Phone A: your CityU email (code arrives in the inbox or junk, 8 digits).
- Phone B: a teammate's CityU email, or `kenji@demo.campusswap.test` (password is `DEMO_PASSWORD` in your local `.env.local`).

## 1. Login
- [ ] Code email arrives (note how long it took and whether it landed in junk).
- [ ] The 8 boxes fit the screen. Pasting the whole code into the first box works.
- [ ] A wrong code shows "Invalid or expired code" and clears the boxes.
- [ ] Close the browser tab and reopen the site: you are still signed in.

## 2. Browse
- [ ] No sideways scrolling anywhere. Bottom tab bar is not hidden behind the browser bar or home indicator.
- [ ] Search, Goods/Services toggle, category chips and the Filter sheet work with one thumb.
- [ ] Heart a listing, open Profile > Saved items: it is there. Unheart: it disappears.
- [ ] Tapping into a text box does not zoom the page.

## 3. Post with the camera
- [ ] Post > Add photos > take a photo with the camera. It appears as a thumbnail.
- [ ] Post. The photo shows on Home and on the listing page (a normal phone photo should upload in a couple of seconds).
- [ ] Try choosing 3 photos from the gallery.
- [ ] Open your listing, tap Remove my listing: a confirmation appears first.

## 4. Chat, offer, pickup (both phones at the same time)
- [ ] A opens a listing posted by B, taps Chat / Make Offer, sends a message. B sees it within a few seconds without refreshing, and the Messages tab shows an unread badge.
- [ ] Open the keyboard in the chat: the message box stays visible above the keyboard and the header does not scroll away.
- [ ] A sends an offer. B sees Accept / Decline and accepts. A sees "Offer accepted".
- [ ] A proposes a pickup. B accepts. Both see "Pickup set".

## 5. QR handover
- [ ] A opens Handover QR. A QR and a 12 character code are shown.
- [ ] B taps Scan QR code, allows the camera, scans A's screen. Both phones show "Handover confirmed".
- [ ] Repeat with another deal and use the manual code instead of the camera.
- [ ] If the camera does not start, note the browser and the message shown.
- [ ] A rates the seller. B's profile rating changes.

## 6. Safety
- [ ] Three dots menu: Report sends. Block removes that user's listings from Home.
- [ ] Profile > Settings > Blocked users: Unblock works.
- [ ] As admin (`admin@demo.campusswap.test`): Profile > Moderation shows the report. Dismiss works.

## 7. Settings and install
- [ ] Settings > Edit profile saves a new name. Safety tips, Help and Terms open and scroll.
- [ ] Add to Home Screen (iPhone: Share > Add to Home Screen. Android: browser menu > Install app). The icon is the CampusSwap logo and the app opens full screen.

## 8. Bad network
- [ ] Switch to airplane mode for 10 seconds, then back. The chat catches up without a manual refresh (within about 10 seconds).

## Known gaps (not bugs)
- Chat images and push notifications do not exist.
- Photos of deleted accounts stay in storage.
- Login code email may land in junk because it is sent from a Gmail address.
