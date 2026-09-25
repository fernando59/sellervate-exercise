-- Demo data for local development. Runs after the migrations on `pnpm db:reset`.
--
-- Three brands that read very differently (an e-scooter brand that must diagnose
-- before offering a return, a B2B packaging supplier that wants three exact lines,
-- and a yarn shop), two leads and three specialists, 55 replies over six weeks and
-- 46 reviews. Dates are relative to now() so "yesterday" always has work in the
-- review queue.
--
-- Everyone signs in with the password `password123`.

-- ---------------------------------------------------------------------------
-- People (Supabase Auth users + profiles)
-- ---------------------------------------------------------------------------

create temporary table seed_people (id uuid, email text, full_name text);

insert into seed_people values
  ('a0000000-0000-4000-8000-000000000001', 'marta@sellervate.test', 'Marta Ruiz'),
  ('a0000000-0000-4000-8000-000000000002', 'nuria@sellervate.test', 'Nuria Vidal'),
  ('a0000000-0000-4000-8000-000000000003', 'dani@sellervate.test',  'Dani Ortega'),
  ('a0000000-0000-4000-8000-000000000004', 'leo@sellervate.test',   'Leo Marín'),
  ('a0000000-0000-4000-8000-000000000005', 'sara@sellervate.test',  'Sara Campos');

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
select
  '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', email,
  extensions.crypt('password123', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', full_name),
  now(), now(), '', '', '', ''
from seed_people;

insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select id::text, id, jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true), 'email', now(), now(), now()
from seed_people;

insert into public.profiles (id, full_name)
select id, full_name from seed_people;

-- ---------------------------------------------------------------------------
-- Brands and who works on them
-- ---------------------------------------------------------------------------

insert into public.brands (id, slug, name, key_rule, guidelines) values
  ('b0000000-0000-4000-8000-000000000001', 'voltra', 'Voltra',
   'Diagnose before offering a return',
   'Voltra sells electric scooters. Half of the "it is broken" tickets are a setting or a five-minute fix, so every fault ticket goes through the diagnostic checklist before a return or replacement is offered:
1. Battery lock: hold the power button for 10 seconds.
2. Riding mode: Eco caps speed at 15 km/h; double-tap the power button for Sport.
3. Firmware: update from the Voltra app (Settings > Scooter > Update).
4. Tyres: 50 psi front and rear.
Only if the checklist fails, offer a return or a warranty repair.
Tone: friendly and plain, like a friend who knows scooters. First name, no corporate phrases.'),
  ('b0000000-0000-4000-8000-000000000002', 'boxwell', 'Boxwell',
   'Three lines: order number, answer, exact date',
   'Boxwell supplies boxes and packaging to other businesses. Buyers read replies between two other tasks.
- Open the order history before answering anything about an order.
- Three lines at most: the order number, the answer, the exact date (no "this week", no "soon").
- Dry and professional. No emojis, no exclamation marks.
- Quotes and bulk pricing: answer the same business day.'),
  ('b0000000-0000-4000-8000-000000000003', 'hebra', 'Hebra',
   'Warm, and exact about dye lots and returns',
   'Hebra is a yarn shop for hand knitters.
- Returns: unopened, un-wound skeins within 30 days. Opened or wound yarn cannot be returned.
- Dye lots vary: always ask for the lot number on the label before promising a match.
- Tone: warm and personal, it is a small shop. Sign with your first name.');

insert into public.brand_memberships (user_id, brand_id, role) values
  -- Marta leads Voltra and Boxwell; Nuria leads Hebra. Neither sees the other's brands.
  ('a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'lead'),
  ('a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002', 'lead'),
  ('a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000003', 'lead'),
  -- Dani: Voltra + Boxwell. Leo: Voltra + Hebra. Sara: Boxwell + Hebra.
  ('a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', 'specialist'),
  ('a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000002', 'specialist'),
  ('a0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000001', 'specialist'),
  ('a0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000003', 'specialist'),
  ('a0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000002', 'specialist'),
  ('a0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000003', 'specialist');

-- "What we changed": drawn as a marker on Voltra's trend.
insert into public.brand_events (brand_id, happened_on, note, created_by) values
  ('b0000000-0000-4000-8000-000000000001', (current_date - 21),
   'Diagnostic checklist made mandatory before any return', 'a0000000-0000-4000-8000-000000000001');

-- ---------------------------------------------------------------------------
-- Replies
-- ---------------------------------------------------------------------------
-- days_ago: when the customer wrote. received: time of day. minutes: time to reply.

create temporary table seed_replies (
  ext text, brand text, specialist text, days_ago int, received time, minutes int,
  subject text, customer_message text, reply_body text
);

insert into seed_replies values
-- Voltra --------------------------------------------------------------------
('VOL-48102', 'voltra', 'dani', 40, '09:12', 95,
 'Scooter will not turn on',
 'Hi, my Voltra S2 will not turn on since yesterday. I charged it all night and pressed the button several times, nothing. I bought it three weeks ago. I would like a refund please.

Laura',
 'Hi Laura,

Sorry to hear that! I have started a return for you. You will get a prepaid shipping label by email within 24 hours, and once we receive the scooter we will refund you in 5-7 business days.

Anything else, just let us know!
Dani'),
('VOL-48133', 'voltra', 'leo', 38, '11:40', 40,
 'Rear wheel feels wobbly',
 'The back wheel on my S2 Pro makes a clicking noise and feels loose when I turn. Is it safe to ride?',
 'Hi Tom,

Good call asking before riding. Two quick checks that fix this most of the time:
1. Tyre pressure: it should be 50 psi. A soft rear tyre feels exactly like a loose wheel in turns.
2. The axle nut on the left side of the rear wheel: tighten it with the 15 mm key from the box, about a quarter turn past snug.

If it still clicks after that, send me a short video of the wheel spinning and I will arrange a warranty repair straight away. Until then, please do not ride it.

Leo'),
('VOL-48160', 'voltra', 'dani', 36, '15:05', 210,
 'Battery drains too fast',
 'Range used to be 30 km, now I get maybe 18. The scooter is five months old.',
 'Hi Priya,

That does not sound right for a five-month-old battery. I have ordered a replacement battery for you, it should arrive within a week.

Dani'),
('VOL-48175', 'voltra', 'dani', 35, '10:40', 120,
 'Charger light stays red',
 'The charger light has been red all night and the scooter still shows one bar. Can you send me a new charger?',
 'Hi Marco,

No problem, I have sent you a new charger, it should arrive in 2-3 days. Sorry for the trouble!

Dani'),
('VOL-48201', 'voltra', 'leo', 33, '10:22', 55,
 'App will not connect to the scooter',
 'The Voltra app keeps saying "scooter not found". Bluetooth is on. I have an S2.',
 'Hi Marco,

This is almost always the firmware. Here is the full process:
1. Close the app completely.
2. Turn the scooter off and on again.
3. Open the app, go to Settings > Scooter > Update and install the latest firmware (it takes about 4 minutes, keep the phone close).
4. Turn Bluetooth off and on in your phone settings.
5. Open the app again and tap "Add scooter".
6. Hold the phone within one metre of the handlebar.
7. Wait for the double beep.
8. Name your scooter.

If it still says not found after the update, tell me your phone model and I will dig further.

Leo'),
('VOL-48236', 'voltra', 'dani', 31, '13:48', 130,
 'Brakes squeaking',
 'My front brake squeaks really loudly every time I stop. Scooter is two weeks old.',
 'Hi Sam,

Squeaky brakes are totally normal in the first 100 km, they settle down on their own. If it does not stop after that, just send it back to us.

Dani'),
('VOL-48252', 'voltra', 'leo', 30, '11:55', 45,
 'Display shows E10',
 'My display shows E10 and the scooter will not accelerate. What does it mean?',
 'Hi Sofia,

E10 means the throttle is not sending a signal. Please switch the scooter off, unplug the throttle cable under the handlebar cover, check the pins are dry and straight, and plug it back in until it clicks.

Leo'),
('VOL-48270', 'voltra', 'leo', 29, '09:30', 35,
 'Charger light stays red',
 'I plugged the charger in six hours ago and the light is still red. Is the charger broken?',
 'Hi Anna,

Red means it is still charging and green means full, so it may simply be taking longer than usual. A few things to check:
- Try a different wall socket, and make sure the plug is fully pushed into the scooter (it clicks).
- Leave it for two more hours.
If it is still red after 8 hours in total, reply with a photo of the charger label and I will send a new charger under warranty.

Leo'),
('VOL-48299', 'voltra', 'dani', 27, '17:15', 300,
 'Scooter stops at 15 km/h',
 'My scooter will not go faster than 15 km/h. It used to reach 25. What is wrong with it?',
 'Hi Jordan,

It sounds like a motor fault. I have arranged a replacement motor for you under warranty, a technician will contact you to book a visit.

Dani'),
('VOL-48310', 'voltra', 'dani', 26, '14:25', 160,
 'Brakes feel weak',
 'The front brake on my S2 barely stops me anymore. I have had it for two months.',
 'Hi Anna,

Brake pads on the S2 are covered by the warranty for the first year, so I have ordered a new front brake assembly for you. It ships tomorrow.

Dani'),
('VOL-48331', 'voltra', 'leo', 24, '12:02', 60,
 'Folding latch is stiff',
 'The folding latch is really hard to close, I have to push it with my foot.',
 'Hi Grace,

That usually means the latch pin is dry. A drop of silicone lubricant on the pin (not WD-40, it attracts dirt), then open and close it five or six times, should make it smooth again.

Leo'),
('VOL-48350', 'voltra', 'dani', 22, '09:35', 85,
 'Scooter turns off on hills',
 'Every time I go up the hill to my office the scooter just switches off. Then it turns on again after a minute.',
 'Hello,

We are sorry for the inconvenience. This can happen when the battery is low. Please make sure it is fully charged before riding uphill. If the problem continues, please contact us again.

Kind regards,
Dani'),
('VOL-48372', 'voltra', 'dani', 20, '08:55', 70,
 'Will not turn on after winter storage',
 'I stored the scooter in the garage over winter and now it does nothing when I press the button. Do I need to send it in?',
 'Hi Pablo,

Hopefully not! After a long storage the battery often locks itself to protect the cells. Can you try this:
1. Hold the power button for 10 seconds, until you hear a beep.
2. If nothing happens, charge it for a full 8 hours and try again.

If it still does not turn on after both steps, reply here and I will set up a warranty return for you.

Dani'),
('VOL-48405', 'voltra', 'leo', 18, '14:37', 45,
 'Display shows E3',
 'My display shows "E3" and the throttle does nothing.',
 'Hi Chloe,

E3 is the throttle sensor, and nine times out of ten it is a loose cable after a bump. With the scooter off, open the small cover under the display (two screws), unplug the grey connector and plug it back in firmly until it clicks.

If E3 comes back, send me a photo of that connector and we will take it from there.

Leo'),
('VOL-48420', 'voltra', 'dani', 16, '12:45', 60,
 'Charger light stays red',
 'Charged the scooter overnight, the charger light is still red this morning. Is the charger broken?',
 'Hi Elena,

Probably not! Two quick checks first:
1. Unplug the charger from the wall for 30 seconds, then plug the wall side in before the scooter side.
2. Look inside the charging port: a bent or dirty pin keeps the light red. A dry cotton bud cleans it.

If it is still red after that, send me a photo of the label on the charger and I will send a new one the same day.

Dani'),
('VOL-48441', 'voltra', 'dani', 15, '10:10', 90,
 'Tyre keeps going flat',
 'The front tyre has gone flat three times in two weeks. I pump it up and a few days later it is soft again.',
 'Dear customer,

Please be advised that tyre pressure should be maintained at 50 psi. Kindly inspect the tyre for any embedded objects such as thorns or glass. Should the issue persist, we will dispatch a replacement inner tube under warranty.

Kind regards,
Dani'),
('VOL-48468', 'voltra', 'leo', 13, '16:20', 50,
 'Can I ride in the rain?',
 'Is the S2 waterproof? I commute every day and it rains a lot here.',
 'Hi Ben,

The S2 is rated IPX5: fine in light rain and wet roads, but avoid puddles deeper than the wheel hub and never leave it outside overnight in the rain. Braking distance is longer on wet roads, so go easy on the brakes.

Leo'),
('VOL-48485', 'voltra', 'leo', 11, '08:50', 30,
 'Folding latch is loose',
 'The stem wobbles a little when I ride, I think the folding latch is loose. Is it safe?',
 'Hi Kai,

Please do not ride it until this is fixed. The latch has an adjustment screw under the rubber cap on the hinge: turn it clockwise with the 4 mm key from the box, a half turn at a time, until the latch closes firmly with no play.

If it still wobbles, send me a short video and I will book a free pickup.

Leo'),
('VOL-48502', 'voltra', 'dani', 10, '09:48', 65,
 'Deck arrived scratched',
 'My new scooter arrived with a long scratch on the deck. Not happy for the price I paid.',
 'Hi Elena,

That is not how it should arrive, sorry. Could you send me a photo of the scratch? Once I have it, I can offer you either a 15% refund if you want to keep the scooter, or a brand new one with a free pickup of this one. Your choice.

Dani'),
('VOL-48536', 'voltra', 'leo', 8, '11:15', 40,
 'Scooter beeps when unlocked',
 'Every time I unlock the scooter from the app it beeps three times. Is that a warning?',
 'Hi Nadia,

No warning, three beeps just confirms the unlock. If you would rather turn it off, go to Settings > Sounds in the app and switch off "Unlock sound".

Leo'),
('VOL-48570', 'voltra', 'dani', 6, '13:30', 80,
 'Lost range after the update',
 'After the last firmware update my range dropped from 30 to about 22 km.',
 'Hi Oscar,

After a firmware update the battery reading sometimes needs recalibrating. Charge it to 100%, ride until it switches itself off, then charge to 100% again without interruption. Your range should come back after that.

Dani'),
('VOL-48603', 'voltra', 'leo', 4, '10:05', 30,
 'Throttle feels sticky',
 'The throttle does not spring back straight away, it stays pressed for a second.',
 'Hi Iris,

Please do not ride it until this is fixed, a throttle that does not return is a safety issue. Usually it is grit under the lever: with the scooter off, blow compressed air under the lever and press it 20 times. If it still sticks, reply here and I will send a new throttle with a video guide, it is a 10-minute swap.

Leo'),
('VOL-48644', 'voltra', 'dani', 1, '09:05', 55,
 'Scooter will not turn on',
 'My S2 will not switch on. It was fine last night. I need it for work tomorrow, can you replace it?',
 'Hi Hugo,

Let us try to get you riding tonight. First, hold the power button for 10 seconds until you hear a beep, that releases the battery lock. If nothing happens, charge it for at least 3 hours and try again.

If it still will not turn on, reply here and I will send a replacement the same day so you are not stuck without it.

Dani'),
('VOL-48651', 'voltra', 'leo', 1, '10:30', 25,
 'Second charger',
 'Can I buy a second charger to keep at the office? Which one fits the S2?',
 'Hi Ruth,

Yes, the S2 uses the 42V 2A charger, it is in the shop under Accessories > Chargers. Any Voltra charger labelled 42V fits.

Leo'),
('VOL-48660', 'voltra', 'dani', 1, '12:10', 140,
 'Handlebar is loose',
 'The handlebar moves side to side a little when I ride. It is a bit scary.',
 'Hi Victor,

Sorry about that. I have started a return for you: you will get the shipping label by email, and a new scooter will go out as soon as we receive this one.

Dani'),
('VOL-48672', 'voltra', 'leo', 1, '15:45', 35,
 'How long is the warranty?',
 'How long is the warranty on the S2 Pro and does it cover the battery?',
 'Hi Kate,

Two years on the scooter and the battery, from the delivery date. Tyres and brake pads are wear parts and are not covered.

Leo'),
-- Boxwell -------------------------------------------------------------------
('BW-20931', 'boxwell', 'sara', 41, '09:20', 50,
 'Delivery date for order BW-20931',
 'Hello, can you confirm the delivery date for order BW-20931? We need the boxes for a launch on the 14th.
Mark Ellis, Purchasing, Northfield Coffee',
 'Hi Mark!

Your order ships this week, so you should be all good for your launch :)

Thanks,
Sara'),
('BW-20940', 'boxwell', 'dani', 39, '11:30', 40,
 'Invoice address',
 'Please change the invoice address on order BW-20940 to our new warehouse, Calle Industria 14, Getafe.',
 'Hi,

Done: the invoice for order BW-20940 now goes to Calle Industria 14, Getafe. The address on your account is updated too, so future orders will use it. Let me know if the delivery address should change as well.

Dani'),
('BW-20955', 'boxwell', 'dani', 37, '10:45', 30,
 'Invoice copy',
 'Please send a copy of the invoice for order BW-20955, our accounts team cannot find it.',
 'Order BW-20955: invoice INV-88412 attached.
It was also sent to accounts@greenleafteas.co on the order date, 12 days ago.
Regards, Dani'),
('BW-20988', 'boxwell', 'sara', 34, '14:00', 60,
 'Lid does not close properly',
 'The lids on the last batch of mailer boxes do not stay closed. Order BW-20988.',
 'Hi,

Sorry about this. We will look into it and get back to you.

Sara'),
('BW-21040', 'boxwell', 'sara', 30, '11:05', 45,
 'Wrong box size delivered',
 'We received 30x20x15 cm boxes. We need 30x20x20. Order BW-21040. Please fix urgently.',
 'Hi,

So sorry for the mix-up! We will send 400 boxes in 30x20x20 today at no cost, and you can keep the ones you received.

Sara'),
('BW-21066', 'boxwell', 'dani', 28, '16:30', 35,
 'Change delivery address',
 'Please change the delivery address for BW-21066 to our new warehouse: Unit 4, Hollins Park, Leeds LS12 6BU.',
 'Hi there! 😊

Thanks so much for letting us know about your move, and congratulations on the new warehouse, how exciting!

I have gone ahead and updated the delivery address for your order BW-21066 to Unit 4, Hollins Park, Leeds LS12 6BU.

The delivery date does not change, so you can still expect it on the 3rd.

If there is anything else at all we can help with, please do not hesitate to reach out!

Have a wonderful day!
Dani'),
('BW-21080', 'boxwell', 'sara', 27, '10:20', 50,
 'Where is my order?',
 'Order BW-21080 was due yesterday and nothing arrived. Please advise.',
 'Hi,

Sorry for the delay. Orders usually ship within 5 business days, so it should be with you soon.

Sara'),
('BW-21102', 'boxwell', 'sara', 25, '09:10', 1500,
 'Bulk pricing for 5,000 units',
 'We are planning an order of 5,000 double-wall shipping boxes (40x30x30). What is your unit price at that volume?',
 'Order quote Q-5512: 5,000 double-wall boxes 40x30x30 at 0.84 per unit, excl. VAT.
Valid until the end of the month; production takes 10 working days from approval.
Regards, Sara'),
('BW-21477', 'boxwell', 'sara', 22, '13:25', 40,
 'Where is my order BW-21477?',
 'Order BW-21477 was due yesterday and has not arrived. Where is it?',
 'Hi,

It is on its way! Should be with you very soon.

Sara'),
('BW-21510', 'boxwell', 'dani', 19, '10:00', 25,
 'Custom print lead time',
 'What is the lead time for 2,000 custom-printed mailer boxes, one colour?',
 'Custom one-colour print, 2,000 mailers: 12 working days from artwork approval.
If you approve the proof by Friday, delivery is on the 2nd of next month.
Regards, Dani'),
('BW-21548', 'boxwell', 'sara', 16, '15:15', 55,
 'Missing boxes',
 'Order BW-21548: we received 3 pallets, the delivery note says 4.',
 'Hi,

Thanks for letting us know. I have asked the warehouse to check.

Sara'),
('BW-21570', 'boxwell', 'dani', 14, '13:10', 30,
 'Reorder same boxes',
 'We need the same shipping boxes as last time, 500 units. Can you set it up?',
 'Hi,

Order BW-21570 is set up: 500 units of the 40x30x20 single-wall box, same size and print as your last order.
Ships Thursday, delivered Friday before 14:00.

Dani'),
('BW-21590', 'boxwell', 'sara', 12, '09:40', 35,
 'Pallet arrived damaged',
 'One pallet of order BW-21590 arrived crushed on one side, about 60 boxes are unusable. Photos attached.',
 'Order BW-21590: 60 boxes credited (credit note CN-3021), replacements ship on the 18th with DPD.
Photos received; no need to return the damaged boxes.
Regards, Sara'),
('BW-21622', 'boxwell', 'dani', 9, '11:50', 30,
 'VAT number on invoice',
 'Our VAT number is missing from invoice INV-89020 (order BW-21622). We need it corrected.',
 'Order BW-21622: corrected invoice INV-89020-A attached, with VAT number GB 294 8812 03.
The original is cancelled.
Regards, Dani'),
('BW-21640', 'boxwell', 'sara', 7, '10:05', 40,
 'Change delivery date',
 'Can order BW-21640 arrive on Monday instead of Wednesday? Our warehouse is closed midweek.',
 'Hi,

Order BW-21640 is ready in our warehouse, so Monday works: delivery Monday between 08:00 and 12:00, same carrier.
The Wednesday slot is cancelled.

Sara'),
('BW-21655', 'boxwell', 'sara', 5, '14:20', 45,
 'Reorder same as last time',
 'We would like to reorder exactly what we got last time. Can you set that up?',
 'Your last order was BW-21390: 1,200 mailers 25x18x8, kraft, one-colour logo.
Reorder placed as BW-21655, same price; delivery on the 26th.
Regards, Sara'),
('BW-21690', 'boxwell', 'sara', 1, '09:30', 40,
 'Delivery slot',
 'Can the delivery for BW-21690 arrive before 11:00? Our dock closes at noon.',
 'Order BW-21690: booked for the 24th, 08:00-11:00 slot, with DPD.
The driver will call 30 minutes before arrival.
Regards, Sara'),
('BW-21698', 'boxwell', 'dani', 1, '11:15', 60,
 'Samples request',
 'Can you send samples of your recycled kraft mailers in three sizes?',
 'Hi!

Absolutely, we would love to send you some samples! Which sizes are you thinking of? We have loads to choose from, so just let me know and I will get them out to you as soon as possible. 📦

Dani'),
('BW-21703', 'boxwell', 'sara', 1, '14:05', 35,
 'Delivery date',
 'When will order BW-21703 arrive?',
 'Hi,

It should arrive next week.

Sara'),
-- Hebra ---------------------------------------------------------------------
('HB-7702', 'hebra', 'leo', 39, '10:15', 60,
 'Colour looks different',
 'I bought two more skeins of Musgo to finish my jumper and they look slightly lighter than the first ones. Is that normal?',
 'Hi Marta,

It can be, and I am sorry it happened mid-project. Hand-dyed yarn changes a little from one dye lot to the next. Could you check the lot number on the labels of the old and new skeins? If they differ, send them to me and I will look for skeins from your original lot. If we have none left, alternating two rows of each for the last part blends the change beautifully.

Leo'),
('HB-7731', 'hebra', 'sara', 32, '12:40', 90,
 'Where is my order?',
 'I ordered three weeks ago and nothing has arrived.',
 'Hi,

Can you send me your order number?

Sara'),
('HB-7760', 'hebra', 'leo', 26, '17:05', 45,
 'Pattern missing a page',
 'The Brisa cardigan pattern I downloaded jumps from page 3 to page 5.',
 'Hi Lucy,

Oh no, sorry about that! I have attached the full pattern again, page 4 is the sleeve decreases. The download link on your account is fixed now too.

Happy knitting,
Leo'),
('HB-7788', 'hebra', 'sara', 21, '10:30', 55,
 'Return opened skeins',
 'I wound two skeins but changed my mind about the project. Can I return them?',
 'Hi Clara,

Of course! Just send them back within 30 days and we will refund you in full.

Sara'),
('HB-7815', 'hebra', 'leo', 17, '15:20', 50,
 'Substitute for merino',
 'I am allergic to wool. Can I use something else for the Olas shawl?',
 'Hi Jess,

Yes! Our Algodón Pima has the same weight and drapes beautifully for a shawl. It is a little less stretchy, so go up half a needle size.

Leo'),
('HB-7843', 'hebra', 'sara', 11, '09:55', 40,
 'Order not arrived',
 'My order HB-7843 was supposed to arrive on Monday.',
 'Hi Irene,

I have checked your order: it left us on Friday with Correos and the tracking shows it at your local office since yesterday (tracking PQ4410982). It should be with you tomorrow; if not, write to me and I will chase it.

Sara'),
('HB-7870', 'hebra', 'leo', 7, '14:10', 35,
 'Needle size for Nube',
 'What needle size do you recommend for the Nube mohair?',
 'Hi Paula,

4.5 mm for a light, airy fabric, or 4 mm if you want it a bit denser. Swatch first, mohair is hard to frog!

Leo'),
('HB-7899', 'hebra', 'sara', 3, '11:25', 30,
 'Gift wrapping',
 'Can you gift wrap my order? It is a birthday present for my mum.',
 'Hi Rosa,

What a lovely present! I have added gift wrapping to your order at no charge and a little card, tell me what you would like it to say.

Sara'),
('HB-7921', 'hebra', 'leo', 1, '10:50', 40,
 'Yarn for a baby blanket',
 'Which yarn would you use for a baby blanket? It needs to go in the washing machine.',
 'Hi Alba,

Our Algodón Pima or the Suave merino (superwash) both go in the machine at 30°. For a baby blanket I would pick the Suave, it is softer and keeps its shape.

Leo'),
('HB-7930', 'hebra', 'sara', 1, '16:15', 25,
 'Discount code not working',
 'The code WELCOME10 says it is invalid.',
 'Hi,

That code expired last month, sorry.

Sara');

insert into public.replies (
  brand_id, specialist_id, source, external_id, ticket_ref,
  subject, customer_message, reply_body, received_at, sent_at
)
select
  b.id, p.id, 'seed', r.ext, r.ext,
  r.subject, r.customer_message, r.reply_body,
  -- Times of day are Madrid time, and "days ago" counts Madrid days: the app
  -- measures "yesterday" in Europe/Madrid (apps/web/server/time.ts). With UTC
  -- dates, between 22:00 and 24:00 UTC the queue would find no replies.
  ((now() at time zone 'Europe/Madrid')::date - r.days_ago + r.received) at time zone 'Europe/Madrid',
  ((now() at time zone 'Europe/Madrid')::date - r.days_ago + r.received) at time zone 'Europe/Madrid'
    + make_interval(mins => r.minutes)
from seed_replies r
join public.brands b on b.slug = r.brand
join seed_people p on p.email = r.specialist || '@sellervate.test';

-- ---------------------------------------------------------------------------
-- Reviews
-- ---------------------------------------------------------------------------
-- Replies left out here are unreviewed, including most of yesterday's, so the
-- review queue has work in it.

create temporary table seed_reviews (
  ext text, score smallint, issues text[], is_exemplar boolean, comment text
);

insert into seed_reviews values
-- Voltra (Marta). Before the checklist: returns offered without diagnosis.
('VOL-48102', 1, '{skipped_procedure}', false,
 'No diagnosis at all. At Voltra, "will not turn on" after a full charge is almost always the battery lock: ask her to hold the power button for 10 seconds. We are now paying shipping both ways for a scooter that most likely works.'),
('VOL-48133', 5, '{}', true,
 'Exactly the Voltra flow: two checks the customer can do in five minutes, a clear next step if they fail, and a safety note. Good example for onboarding.'),
('VOL-48175', 2, '{skipped_procedure}', false,
 'A red charger light after a night is usually a dirty charging port or the wall-first plug order. Two checks first, a new charger only if they fail.'),
('VOL-48160', 2, '{skipped_procedure}', false,
 'Range loss at five months is almost always tyre pressure or Eco mode. Ask for both before sending a 300 euro battery.'),
('VOL-48201', 3, '{length}', false,
 'Right diagnosis (firmware first). Eight steps is a lot to read on a phone: link the update guide and keep the three steps that matter.'),
('VOL-48236', 2, '{wrong_info}', false,
 'Squeaking is not "normal": the Voltra fix is re-aligning the caliper. Telling a customer something wrong about their own scooter is the mistake that loses the account, worse than any tone issue.'),
('VOL-48252', 3, '{incomplete}', false,
 'Right first check, but no next step if the cable is fine. Tell her we replace the throttle under warranty so she does not have to write again.'),
('VOL-48270', 4, '{}', false,
 'Explains what the light means, gives a check and a clear threshold for the warranty. Could have asked for the charger label in the first reply and saved a round trip.'),
('VOL-48299', 1, '{wrong_info,skipped_procedure}', false,
 '15 km/h is Eco mode, not a motor fault: double-tap the power button for Sport. We booked a technician visit for a setting. Please run the checklist before any replacement, every time.'),
('VOL-48310', 2, '{wrong_info}', false,
 'Brake pads are a wear part and not covered by the warranty. The S2 fix is tightening the cable at the lever, one turn of the barrel adjuster. We just promised a free part we do not give.'),
('VOL-48331', 3, '{incomplete}', false,
 'Right fix, but nothing about what to do if the lubricant does not help. She will write back.'),
('VOL-48350', 3, '{tone}', false,
 'Low battery is the right first guess on a hill. But "Hello" and "kind regards" is not how Voltra talks, and ask for the battery level shown on the display so we know.'),
-- After the checklist became mandatory.
('VOL-48372', 4, '{}', false,
 'Much better: battery lock first, then a full charge, and only then the return. This is the checklist working.'),
('VOL-48405', 5, '{}', false,
 'Knows the error code, gives a fix the customer can do, and asks for a photo if it fails.'),
('VOL-48420', 4, '{}', false,
 'Same problem as VOL-48175 a few weeks ago, and this time the checks come first. Could have said how long the full charge should take.'),
('VOL-48441', 3, '{tone}', false,
 'Right steps, but "Dear customer" and "please be advised" is not Voltra. We write like a friend who knows scooters: first name, plain words.'),
('VOL-48468', 5, '{}', false,
 'Exact rating, what it means in practice, and a safety note on braking.'),
('VOL-48485', 5, '{}', false,
 'Stops the ride first, then a fix with the right tool, then a free fallback.'),
('VOL-48502', 4, '{}', false,
 'Clear options and asks for the photo first. Could have told her the pickup is free of charge up front.'),
('VOL-48536', 5, '{}', false,
 'Short, correct, and tells her how to turn it off.'),
('VOL-48570', 3, '{incomplete}', false,
 'Recalibration is right, but the update also resets the app to Eco mode, which caps range. Mention both or he will write back next week.'),
('VOL-48603', 5, '{}', true,
 'Safety first, then a fix, then a fallback with a time estimate. Onboarding material.'),
('VOL-48644', 5, '{}', false,
 'Compare with VOL-48102 six weeks ago, same problem: battery lock first, charge second, replacement only if both fail, and a same-day promise because he needs it for work. Great progress, Dani.'),
-- Boxwell (Marta).
('BW-20931', 2, '{no_order_check,incomplete}', false,
 'No date, and "this week" is wrong: the order was on hold waiting for artwork approval. A ten-second look at the order history would have shown it. The customer has a launch on the 14th.'),
('BW-20940', 4, '{length}', false,
 'Correct and done. The last line is one too many: Boxwell buyers ask if they need something else.'),
('BW-20955', 5, '{}', true,
 'This is the Boxwell reply: order number, the answer, the date. Three lines.'),
('BW-20988', 2, '{no_order_check,incomplete}', false,
 'The order history shows this batch came from the new supplier. Say so, send replacement lids and give a date. "We will look into it" means they write again.'),
('BW-21040', 1, '{no_order_check,wrong_info}', false,
 'The order history shows they ordered 30x20x15 and approved the proof. We shipped 400 boxes for free for a mistake that was not ours. Always open the order before answering.'),
('BW-21066', 3, '{length,tone}', false,
 'Correct, but eight lines and emojis. Boxwell buyers want three: order number, what changed, the date.'),
('BW-21080', 2, '{no_order_check}', false,
 'The order shipped in two parts and the first one was delivered yesterday to reception. The tracking was one click away.'),
('BW-21102', 3, '{slow}', false,
 'Perfect reply, 25 hours late. Quotes are answered the same business day at Boxwell, or the buyer asks someone else.'),
('BW-21477', 2, '{no_order_check,incomplete}', false,
 'The order was split into two shipments and the second one is in the warehouse. Third ticket this month closed without opening the order history. Let us talk today.'),
('BW-21510', 5, '{}', false,
 'Exact lead time and an exact date tied to their approval. Nothing to add.'),
('BW-21548', 3, '{incomplete}', false,
 'Right to check the warehouse, but give them a time for the answer. A missing pallet stops their packing line.'),
('BW-21570', 4, '{}', false,
 'Looked up the last order and gave the ship and delivery days. Name the Thursday date so nobody has to check a calendar.'),
('BW-21590', 4, '{}', false,
 'Order checked, credit note, exact date. This is the standard. Could say which carrier tracking to expect.'),
('BW-21622', 5, '{}', false,
 'Fast and exact.'),
('BW-21640', 4, '{}', false,
 'Checked the order status before promising Monday. Three lines, exact slot.'),
('BW-21655', 4, '{}', false,
 'Good: looked up the previous order instead of asking the customer what they bought.'),
('BW-21690', 5, '{}', false,
 'Exact slot, carrier and what happens next. Big improvement over the last month.'),
-- Hebra (Nuria).
('HB-7702', 5, '{}', true,
 'Warm, explains dye lots without jargon, asks for the lot number before promising anything, and offers a knitter''s fix. Lovely.'),
('HB-7760', 4, '{}', false,
 'Quick and kind. Good that you also fixed the download link.'),
('HB-7788', 2, '{wrong_info}', false,
 'We cannot take back wound skeins, only unopened ones. Now we either break our policy or go back on our word.'),
('HB-7815', 4, '{incomplete}', false,
 'Good substitute. Tell her how many skeins of Pima she needs, the yardage is different.'),
('HB-7843', 4, '{}', false,
 'Checked the order and the tracking before answering. Warm enough, well done.'),
('HB-7899', 5, '{}', false,
 'This is the Hebra voice.');

insert into public.reviews (reply_id, brand_id, reviewer_id, score, comment, is_exemplar, created_at, updated_at)
select
  rp.id, rp.brand_id, m.user_id, s.score, s.comment, s.is_exemplar,
  least(rp.sent_at + interval '20 hours', now()), least(rp.sent_at + interval '20 hours', now())
from seed_reviews s
join public.replies rp on rp.source = 'seed' and rp.external_id = s.ext
join public.brand_memberships m on m.brand_id = rp.brand_id and m.role = 'lead';

insert into public.review_issues (review_id, issue_code)
select rv.id, unnest(s.issues)
from seed_reviews s
join public.replies rp on rp.source = 'seed' and rp.external_id = s.ext
join public.reviews rv on rv.reply_id = rp.id;
