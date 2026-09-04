-- ============================================================================
-- LUWOMBO RESTAURANT — Seed data
-- Mirrors src/lib/seed.ts so demo mode and production match.
-- ============================================================================

-- Settings (single row) -------------------------------------------------------
insert into public.restaurant_settings
  (id, name, tagline, address, district, phone, phone_secondary, email, whatsapp, opening_hours, delivery_fee, delivery_zones, tax_rate, tax_included, currency, reservation_slot_minutes, max_party_online, socials, wifi_password)
values
  (1, 'Luwombo Restaurant', 'Slow-cooked tradition, served with love',
   'KG 652 St, Kimihurura', 'Gasabo', '+250788123456', '+250722123456', 'hello@luwombo.rw', '+250788123456',
   '{"monday":{"open":"11:00","close":"22:00"},"tuesday":{"open":"11:00","close":"22:00"},"wednesday":{"open":"11:00","close":"22:00"},"thursday":{"open":"11:00","close":"23:00"},"friday":{"open":"11:00","close":"23:30"},"saturday":{"open":"10:00","close":"23:30"},"sunday":{"open":"12:00","close":"22:00"}}'::jsonb,
   1500, array['Kimihurura','Kiyovu','Nyarutarama','Remera','Gacuriro','Kacyiru','City Center'],
   0, true, 'RWF', 30, 12,
   '{"instagram":"https://instagram.com/luwomborw","facebook":"https://facebook.com/luwomborw","tiktok":"https://tiktok.com/@luwomborw","whatsapp":"https://wa.me/250788123456"}'::jsonb,
   'Umuganda2026')
on conflict (id) do update set
  name = excluded.name, tagline = excluded.tagline, address = excluded.address,
  opening_hours = excluded.opening_hours, delivery_zones = excluded.delivery_zones,
  socials = excluded.socials;

-- Categories -------------------------------------------------------------------
insert into public.categories (id, name, slug, description, sort_order, active) values
  ('11111111-0000-4000-8000-000000000001','Signature Luwombo','signature-luwombo','Our namesake — slow-steamed in banana leaves',1,true),
  ('11111111-0000-4000-8000-000000000002','Grills & Brochettes','grills-brochettes','Charcoal-kissed skewers and flame-grilled plates',2,true),
  ('11111111-0000-4000-8000-000000000003','Rwandan Classics','rwandan-classics','Beloved home-style favourites',3,true),
  ('11111111-0000-4000-8000-000000000004','East African Fusion','east-african-fusion','Neighbourhood flavours, reimagined',4,true),
  ('11111111-0000-4000-8000-000000000005','Vegetarian & Vegan','vegetarian-vegan','Garden-fresh and fully plant-based options',5,true),
  ('11111111-0000-4000-8000-000000000006','Sides & Staples','sides-staples','The perfect companions',6,true),
  ('11111111-0000-4000-8000-000000000007','Soups & Starters','soups-starters','Warm welcomes to your meal',7,true),
  ('11111111-0000-4000-8000-000000000008','Desserts','desserts','Sweet endings',8,true),
  ('11111111-0000-4000-8000-000000000009','Beverages','beverages','Fresh juices, teas and local favourites',9,true),
  ('11111111-0000-4000-8000-000000000010','Weekend Specials','weekend-specials','Only while the weekend lasts',10,true)
on conflict (slug) do nothing;

-- Menu items (signature dishes; full catalogue maintained in admin) -------------
insert into public.menu_items
  (id, category_id, name, slug, description, price, ingredients, allergens, prep_time_min, available, featured, popular, spicy_level, is_vegetarian, is_vegan, portion_info, rating_avg, rating_count, times_ordered, customization_groups)
values
  ('22222222-0000-4000-8000-000000000101','11111111-0000-4000-8000-000000000001','Chicken Luwombo','chicken-luwombo',
   'Tender chicken slow-steamed in banana leaves with groundnut sauce, served with rice or matoke.',8500,
   array['Chicken','Groundnut paste','Banana leaves','Onions','Tomatoes'],array['Peanuts'],35,true,true,true,1,false,false,'Serves one generously',4.8,214,1204,
   '[{"id":"g-rice","name":"Choose your side","type":"single","required":true,"options":[{"name":"Steamed rice","price":0},{"name":"Matoke","price":500},{"name":"Chapati","price":300},{"name":"Sweet potatoes","price":300}]}]'::jsonb),
  ('22222222-0000-4000-8000-000000000102','11111111-0000-4000-8000-000000000001','Beef Luwombo','beef-luwombo',
   'Slow-cooked beef in a rich banana-leaf parcel with dodo greens.',9500,
   array['Beef','Dodo greens','Banana leaves'],array[]::text[],40,true,true,true,1,false,false,'Serves one generously',4.9,187,987,
   '[]'::jsonb),
  ('22222222-0000-4000-8000-000000000103','11111111-0000-4000-8000-000000000001','Goat Luwombo','goat-luwombo',
   'Marinated goat steamed until falling-apart tender, with a smoky depth of flavour.',9000,
   array['Goat meat','Green bananas','Banana leaves'],array[]::text[],42,true,true,false,2,false,false,'Serves one generously',4.7,143,756,
   '[]'::jsonb),
  ('22222222-0000-4000-8000-000000000201','11111111-0000-4000-8000-000000000002','Goat Brochettes','goat-brochettes',
   'Flame-grilled goat skewers with onion and green pepper, served with akabanga chilli oil.',4500,
   array['Goat meat','Onion','Green pepper'],array[]::text[],20,true,true,true,2,false,false,'Three skewers',4.9,301,2103,'[]'::jsonb),
  ('22222222-0000-4000-8000-000000000202','11111111-0000-4000-8000-000000000002','Beef Brochettes','beef-brochettes',
   'Juicy beef cubes grilled over charcoal, glazed with a house marinade.',4200,
   array['Beef','House marinade'],array[]::text[],18,true,true,true,1,false,false,'Three skewers',4.8,265,1890,'[]'::jsonb),
  ('22222222-0000-4000-8000-000000000203','11111111-0000-4000-8000-000000000002','Tilapia Grill','tilapia-grill',
   'Whole Lake Kivu tilapia grilled with garlic and lemon, with fries or plantain.',12500,
   array['Tilapia','Garlic','Lemon'],array['Fish'],28,true,true,false,1,false,false,'Whole fish',4.8,178,890,
   '[{"id":"g-side","name":"Side dish","type":"single","required":true,"options":[{"name":"Fries","price":0},{"name":"Fried plantain","price":500}]}]'::jsonb),
  ('22222222-0000-4000-8000-000000000301','11111111-0000-4000-8000-000000000003','Isombe with Matoke','isombe-matoke',
   'Cassava leaves simmered in peanut sauce with mashed green bananas — pure comfort.',5500,
   array['Cassava leaves','Peanut paste','Green bananas'],array['Peanuts'],25,true,false,true,0,true,false,'Hearty portion',4.7,96,540,'[]'::jsonb),
  ('22222222-0000-4000-8000-000000000302','11111111-0000-4000-8000-000000000003','Ubugari na Igikoma','ubugari-igikoma',
   'Traditional cassava staple with hearty bean stew.',3500,
   array['Cassava flour','Beans'],array[]::text[],18,true,false,false,0,true,true,'Hearty portion',4.5,54,320,'[]'::jsonb),
  ('22222222-0000-4000-8000-000000000401','11111111-0000-4000-8000-000000000004','Rolex Wrap','rolex-wrap',
   'East Africa&apos;s favourite street food — eggs rolled with vegetables in warm chapati.',2500,
   array['Eggs','Chapati','Tomatoes','Onions'],array['Eggs','Gluten'],10,true,false,true,1,false,false,'Two wraps',4.6,88,1120,'[]'::jsonb),
  ('22222222-0000-4000-8000-000000000501','11111111-0000-4000-8000-000000000005','Vegan Luwombo','vegan-luwombo',
   'Seasonal vegetables and beans steamed in banana leaves with coconut curry.',6000,
   array['Mixed vegetables','Beans','Coconut milk','Banana leaves'],array[]::text[],30,true,false,false,0,true,true,'Serves one',4.6,41,220,'[]'::jsonb),
  ('22222222-0000-4000-8000-000000000601','11111111-0000-4000-8000-000000000006','Matoke','matoke','Slow-cooked green bananas with a touch of turmeric.',2000,
   array['Green bananas','Turmeric'],array[]::text[],15,true,false,false,0,true,true,'Side portion',4.5,72,640,'[]'::jsonb),
  ('22222222-0000-4000-8000-000000000602','11111111-0000-4000-8000-000000000006','Chapati','chapati','Layered flatbread, fresh off the pan.',800,
   array['Wheat flour'],array['Gluten'],8,true,false,true,0,true,true,'One piece',4.7,110,1500,'[]'::jsonb),
  ('22222222-0000-4000-8000-000000000701','11111111-0000-4000-8000-000000000007','Beef Broth (Inyama Y&apos;inka)','beef-broth',
   'Clear, nourishing beef broth with banana and potatoes.',3800,
   array['Beef','Banana','Potatoes'],array[]::text[],20,true,false,false,0,false,false,'Bowl',4.6,63,310,'[]'::jsonb),
  ('22222222-0000-4000-8000-000000000801','11111111-0000-4000-8000-000000000008','Mandazi & Honey','mandazi-honey','Pillowy fried dough with Rwanda forest honey.',1800,
   array['Flour','Coconut milk','Honey'],array['Gluten'],10,true,false,false,0,true,false,'Four pieces',4.7,59,480,'[]'::jsonb),
  ('22222222-0000-4000-8000-000000000901','11111111-0000-4000-8000-000000000009','Passion Fruit Juice','passion-juice','Freshly pressed Rwandan passion fruit, lightly sweetened.',1500,
   array['Passion fruit'],array[]::text[],5,true,false,true,0,true,true,'Tall glass',4.9,142,1980,
   '[{"id":"g-size","name":"Size","type":"single","required":true,"options":[{"name":"Regular","price":0},{"name":"Large","price":700}]}]'::jsonb),
  ('22222222-0000-4000-8000-000000000902','11111111-0000-4000-8000-000000000009','Urwarwa (Banana Beer)','urwarwa','Traditional fermented banana beverage, served chilled.',2200,
   array['Bananas','Sorghum'],array[]::text[],3,true,false,false,0,false,false,'Calabash serving',4.4,38,290,'[]'::jsonb),
  ('22222222-0000-4000-8000-000000001001','11111111-0000-4000-8000-000000000010','Sunday Family Platter','family-platter',
   'A sharing feast for four: chicken luwombo, brochettes, matoke, chapati and salads.',28000,
   array['Chicken','Goat','Plantain','Salads'],array['Peanuts'],55,true,true,true,1,false,false,'Feeds four',5.0,52,168,'[]'::jsonb)
on conflict (slug) do nothing;

-- Coupons ------------------------------------------------------------------------
insert into public.coupons (code, type, value, min_order, max_uses, ends_at, active) values
  ('WELCOME10','percentage',10,10000,1000, now() + interval '90 days', true),
  ('LUNCH2000','fixed',2000,8000,500,   now() + interval '30 days', true),
  ('TEAMLUNCH','percentage',15,30000,200, now() + interval '60 days', true),
  ('UMUGANDA15','fixed',3000,15000,300,  now() + interval '14 days', true)
on conflict (code) do nothing;

-- Promotions ----------------------------------------------------------------------
insert into public.promotions (title, description, badge, type, active, starts_at, ends_at) values
  ('First Order Feast','Enjoy 10% off your very first order with code WELCOME10','-10%','first_order',true,now(),now() + interval '90 days'),
  ('Weekend Family Platter','Order the family platter every Saturday and Sunday for a special treat.','Special','seasonal',true,date_trunc('week', now()) + interval '5 days',date_trunc('week', now()) + interval '7 days'),
  ('Happy Hour Juices','All fresh juices half price between 3pm and 5pm daily.','-50%','happy_hour',true,now(),now() + interval '30 days');

-- FAQs -----------------------------------------------------------------------------
insert into public.faqs (question, answer, visible, sort_order) values
  ('What is a luwombo?','Luwombo is a traditional Ugandan-Rwandan dish where meat, groundnut sauce or vegetables are wrapped in banana leaves and slowly steamed — sealing in every flavour. It is our signature cooking style.',true,1),
  ('Do you deliver across Kigali?','Yes! We deliver to Kimihurura, Kiyovu, Nyarutarama, Remera, Gacuriro, Kacyiru and the City Centre. Standard delivery is 1,500 RWF and typically takes 25–45 minutes.',true,2),
  ('Can I book a table for a large group?','Online reservations cover parties up to 12. For larger groups or private events, call us on +250 788 123 456 and our events team will take care of you.',true,3),
  ('How do I pay?','MTN MoMo, Airtel Money, Visa/Mastercard, cash on delivery, or pay at the counter — whatever suits you.',true,4),
  ('Are there vegetarian options?','Absolutely. From Isombe to our Vegan Luwombo, plant-based guests have plenty to celebrate. Every dish is labelled on the menu.',true,5),
  ('Do you cater for events?','We do! Weddings, conferences, umuganura celebrations — tell us about your event via the contact page and we will send a tailored quote within 24 hours.',true,6);

-- Tables ---------------------------------------------------------------------------
insert into public.restaurant_tables (label, area, seats, qr_token) values
  ('Table 1','main_hall',4,'t1-kimih'),
  ('Table 2','main_hall',4,'t2-urugo'),
  ('Table 3','main_hall',6,'t3-inzu'),
  ('Table 4','terrace',2,'t4-umuri'),
  ('Table 5','terrace',4,'t5-izuba'),
  ('Table 6','garden',6,'t6-ubuki'),
  ('Table 7','garden',4,'t7-agataki'),
  ('Table 8','private',8,'t8-inyange'),
  ('Table 9','private',10,'t9-umusho'),
  ('Table 10','terrace',4,'t10-teka')
on conflict (label) do nothing;
