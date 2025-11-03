-- MGM Museum Database Seed Data
-- Migration: Initial Seed Data
-- Created: 2025-10-13

-- ================================================
-- SEED EXHIBITIONS
-- ================================================

INSERT INTO exhibitions (slug, name, category, description, short_description, duration_minutes, capacity, images, status, featured, display_order) VALUES
(
  'full-dome-planetarium',
  'Full Dome Digital Planetarium',
  'planetarium',
  'Experience the most advanced digital planetarium in the Marathwada region. Our state-of-the-art Full Dome Digital Planetarium offers a truly immersive 360-degree experience that transports you through space and time.

The planetarium features:
- Ultra-high resolution projection system
- 360-degree immersive dome experience
- Multi-sensory audio system
- Comfortable seating with optimal viewing angles
- Live presentations by expert astronomers

Our shows cover a wide range of topics including:
- Journey through the solar system
- Exploration of distant galaxies
- The birth and death of stars
- Black holes and cosmic mysteries
- India''s space missions and ISRO achievements

Perfect for school groups, families, and space enthusiasts of all ages!',
  'Experience the most advanced digital planetarium in Marathwada with 360° shows.',
  45,
  100,
  ARRAY[
    'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=1200&q=80',
    'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=1200&q=80',
    'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=1200&q=80'
  ],
  'active',
  TRUE,
  1
),
(
  'aditya-solar-observatory',
  'Aditya Solar Observatory',
  'solar_observatory',
  'Observe the sun safely and learn about solar phenomena with our specialized equipment. Our Aditya Solar Observatory is equipped with professional-grade solar telescopes that allow you to witness the sun''s features in stunning detail.

Features:
- Safe solar viewing equipment
- Real-time sun observation
- Educational demonstrations
- Solar cycle tracking
- Professional astronomy guidance

Learn about:
- Solar flares and prominences
- Sunspots and solar cycles
- Solar energy and its impact on Earth
- Space weather and its effects
- Solar system formation

The observatory is named after India''s first solar mission, Aditya-L1, celebrating our nation''s contributions to solar research.',
  'Observe the sun safely and learn about solar phenomena with our specialized equipment.',
  30,
  25,
  ARRAY[
    'https://images.unsplash.com/photo-1506443432602-ac2fcd6f54e0?w=1200&q=80'
  ],
  'active',
  TRUE,
  2
),
(
  'outdoor-science-park',
  'Outdoor Science Park',
  'science_park',
  'Explore interactive outdoor exhibits demonstrating various scientific principles. Our Outdoor Science Park spans across 2 acres and features over 30 hands-on exhibits that make learning science fun and engaging.

Exhibits include:
- Giant pendulum demonstrations
- Optical illusions and mirrors
- Musical instruments based on physics
- Simple machines demonstrations
- Energy and motion exhibits
- Water science activities
- Ecological displays

Perfect for:
- School field trips
- Family outings
- Science enthusiasts
- Photography opportunities

All exhibits are designed to be interactive, allowing visitors to touch, play, and experiment while learning fundamental scientific concepts.',
  'Explore interactive outdoor exhibits demonstrating various scientific principles.',
  60,
  200,
  ARRAY[
    'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=1200&q=80'
  ],
  'active',
  FALSE,
  3
),
(
  'astro-gallery-isro',
  'Astro Gallery & ISRO Exhibition',
  'astro_gallery',
  'Discover India''s space exploration journey with real spacecraft models and ISRO achievements. This gallery is a tribute to the Indian Space Research Organisation''s remarkable journey and achievements in space exploration.

Highlights:
- Scale models of Indian satellites
- Mars Orbiter Mission (Mangalyaan) display
- Chandrayaan missions showcase
- ISRO''s launch vehicles
- Astronaut equipment demonstrations
- Interactive touchscreens with mission details
- Space suit replicas
- Meteorite samples

Learn about:
- India''s space program history
- Current and future missions
- Satellite technology
- Space science applications
- Careers in space research

This exhibition inspires young minds to pursue careers in space science and technology.',
  'Discover India''s space exploration journey with real spacecraft models and ISRO achievements.',
  60,
  150,
  ARRAY[
    'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=1200&q=80'
  ],
  'active',
  TRUE,
  4
),
(
  '3d-science-theatre',
  '3D Science Theatre',
  '3d_theatre',
  'The most powerful 3D film experience with science shows that immerse you in the action. Our 3D Science Theatre features state-of-the-art 3D projection technology and Dolby Atmos surround sound for an unforgettable experience.

Technical Specifications:
- 4K 3D projection
- Dolby Atmos audio
- Polarized 3D glasses
- Comfortable seating
- Climate controlled environment

Show Categories:
- Ocean exploration documentaries
- Space adventures
- Wildlife experiences
- Scientific phenomena
- Natural disasters and forces

Perfect for audiences who want to experience science in a completely immersive way. Each show is carefully selected for its educational value and entertainment quality.',
  'The most powerful 3D film experience with science shows that immerse you in the action.',
  30,
  120,
  ARRAY[
    'https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=1200&q=80'
  ],
  'active',
  TRUE,
  5
),
(
  'mathematics-lab',
  'Mathematics Laboratory',
  'math_lab',
  'Make math fun with interactive models and hands-on activities demonstrating concepts. Our Mathematics Laboratory transforms abstract mathematical concepts into tangible, visual, and interactive experiences.

Exhibits Include:
- Geometric shapes and solids
- Probability and statistics demonstrations
- Algebraic puzzles
- Number patterns
- Trigonometry visualizations
- Fractal explorations
- Mathematical art
- Calculator-free challenge zones

Activities:
- Hands-on model building
- Math puzzle solving
- Pattern recognition games
- Logical reasoning challenges

Suitable for students of all ages, from elementary to high school. Teachers can book special sessions aligned with curriculum requirements.',
  'Make math fun with interactive models and hands-on activities demonstrating concepts.',
  45,
  50,
  ARRAY[
    'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=1200&q=80'
  ],
  'active',
  FALSE,
  6
),
(
  'basic-physics-lab',
  'Basic Physics Laboratory',
  'physics_lab',
  'Conduct experiments and understand physics principles through hands-on learning. Our Physics Laboratory is equipped with modern apparatus and experimental setups that bring physics textbooks to life.

Laboratory Sections:
- Mechanics and Motion
- Electricity and Magnetism
- Light and Optics
- Heat and Thermodynamics
- Sound and Waves
- Modern Physics

Featured Experiments:
- Simple pendulum
- Projectile motion
- Electric circuits
- Magnetic fields
- Lens and mirrors
- Sound frequency
- Newton''s laws demonstrations

All experiments are supervised by experienced science educators. Students can participate in guided experiments and learn the scientific method through practice.',
  'Conduct experiments and understand physics principles through hands-on learning.',
  45,
  40,
  ARRAY[
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&q=80'
  ],
  'active',
  FALSE,
  7
),
(
  'holography-theatre',
  'Holography Theatre',
  'holography',
  'Witness the science of holography with fully three-dimensional images floating in space. Our Holography Theatre showcases one of the most fascinating applications of light and laser technology.

Features:
- Laser hologram displays
- 3D floating images
- Historical holography exhibits
- Interactive hologram creation
- Scientific principles explained
- Artistic holograms

Learn About:
- How holograms are created
- Applications in security
- Medical imaging
- Data storage
- Art and entertainment
- Future of holographic technology

The theatre presents multiple shows throughout the day, each demonstrating different aspects of holographic science and its real-world applications.',
  'Witness the science of holography with fully three-dimensional images floating in space.',
  40,
  80,
  ARRAY[
    'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&q=80'
  ],
  'active',
  TRUE,
  8
);

-- ================================================
-- SEED PRICING
-- ================================================

-- Planetarium pricing
INSERT INTO pricing (exhibition_id, ticket_type, price, valid_from) VALUES
((SELECT id FROM exhibitions WHERE slug = 'full-dome-planetarium'), 'adult', 100.00, CURRENT_DATE),
((SELECT id FROM exhibitions WHERE slug = 'full-dome-planetarium'), 'child', 60.00, CURRENT_DATE),
((SELECT id FROM exhibitions WHERE slug = 'full-dome-planetarium'), 'student', 75.00, CURRENT_DATE),
((SELECT id FROM exhibitions WHERE slug = 'full-dome-planetarium'), 'senior', 80.00, CURRENT_DATE),
((SELECT id FROM exhibitions WHERE slug = 'full-dome-planetarium'), 'group', 70.00, CURRENT_DATE);

-- Solar Observatory pricing
INSERT INTO pricing (exhibition_id, ticket_type, price, valid_from) VALUES
((SELECT id FROM exhibitions WHERE slug = 'aditya-solar-observatory'), 'adult', 60.00, CURRENT_DATE),
((SELECT id FROM exhibitions WHERE slug = 'aditya-solar-observatory'), 'child', 30.00, CURRENT_DATE),
((SELECT id FROM exhibitions WHERE slug = 'aditya-solar-observatory'), 'student', 40.00, CURRENT_DATE);

-- Science Park pricing
INSERT INTO pricing (exhibition_id, ticket_type, price, valid_from) VALUES
((SELECT id FROM exhibitions WHERE slug = 'outdoor-science-park'), 'adult', 50.00, CURRENT_DATE),
((SELECT id FROM exhibitions WHERE slug = 'outdoor-science-park'), 'child', 25.00, CURRENT_DATE),
((SELECT id FROM exhibitions WHERE slug = 'outdoor-science-park'), 'student', 35.00, CURRENT_DATE);

-- Astro Gallery pricing
INSERT INTO pricing (exhibition_id, ticket_type, price, valid_from) VALUES
((SELECT id FROM exhibitions WHERE slug = 'astro-gallery-isro'), 'adult', 80.00, CURRENT_DATE),
((SELECT id FROM exhibitions WHERE slug = 'astro-gallery-isro'), 'child', 40.00, CURRENT_DATE),
((SELECT id FROM exhibitions WHERE slug = 'astro-gallery-isro'), 'student', 60.00, CURRENT_DATE);

-- 3D Theatre pricing
INSERT INTO pricing (exhibition_id, ticket_type, price, valid_from) VALUES
((SELECT id FROM exhibitions WHERE slug = '3d-science-theatre'), 'adult', 75.00, CURRENT_DATE),
((SELECT id FROM exhibitions WHERE slug = '3d-science-theatre'), 'child', 45.00, CURRENT_DATE),
((SELECT id FROM exhibitions WHERE slug = '3d-science-theatre'), 'student', 60.00, CURRENT_DATE);

-- Math Lab pricing
INSERT INTO pricing (exhibition_id, ticket_type, price, valid_from) VALUES
((SELECT id FROM exhibitions WHERE slug = 'mathematics-lab'), 'adult', 50.00, CURRENT_DATE),
((SELECT id FROM exhibitions WHERE slug = 'mathematics-lab'), 'child', 25.00, CURRENT_DATE),
((SELECT id FROM exhibitions WHERE slug = 'mathematics-lab'), 'student', 35.00, CURRENT_DATE);

-- Physics Lab pricing
INSERT INTO pricing (exhibition_id, ticket_type, price, valid_from) VALUES
((SELECT id FROM exhibitions WHERE slug = 'basic-physics-lab'), 'adult', 50.00, CURRENT_DATE),
((SELECT id FROM exhibitions WHERE slug = 'basic-physics-lab'), 'child', 25.00, CURRENT_DATE),
((SELECT id FROM exhibitions WHERE slug = 'basic-physics-lab'), 'student', 35.00, CURRENT_DATE);

-- Holography Theatre pricing
INSERT INTO pricing (exhibition_id, ticket_type, price, valid_from) VALUES
((SELECT id FROM exhibitions WHERE slug = 'holography-theatre'), 'adult', 90.00, CURRENT_DATE),
((SELECT id FROM exhibitions WHERE slug = 'holography-theatre'), 'child', 55.00, CURRENT_DATE),
((SELECT id FROM exhibitions WHERE slug = 'holography-theatre'), 'student', 70.00, CURRENT_DATE);

-- ================================================
-- SEED TIME SLOTS
-- ================================================

-- Shows time slots (for all shows)
INSERT INTO time_slots (show_id, day_of_week, start_time, end_time, capacity) VALUES
((SELECT id FROM shows WHERE slug = 'full-dome-planetarium'), NULL, '10:00', '10:45', 100),
((SELECT id FROM shows WHERE slug = 'full-dome-planetarium'), NULL, '13:00', '13:45', 100),
((SELECT id FROM shows WHERE slug = 'full-dome-planetarium'), NULL, '16:00', '16:45', 100),
((SELECT id FROM shows WHERE slug = 'cosmos-journey'), NULL, '11:00', '11:45', 100),
((SELECT id FROM shows WHERE slug = 'cosmos-journey'), NULL, '14:00', '14:45', 100),
((SELECT id FROM shows WHERE slug = 'our-solar-system'), NULL, '12:00', '12:40', 100),
((SELECT id FROM shows WHERE slug = 'our-solar-system'), NULL, '15:00', '15:40', 100);

-- 3D Theatre time slots
INSERT INTO time_slots (exhibition_id, day_of_week, start_time, end_time, capacity) VALUES
((SELECT id FROM exhibitions WHERE slug = '3d-science-theatre'), NULL, '10:30', '11:00', 120),
((SELECT id FROM exhibitions WHERE slug = '3d-science-theatre'), NULL, '12:00', '12:30', 120),
((SELECT id FROM exhibitions WHERE slug = '3d-science-theatre'), NULL, '14:00', '14:30', 120),
((SELECT id FROM exhibitions WHERE slug = '3d-science-theatre'), NULL, '16:00', '16:30', 120);

-- Holography Theatre time slots
INSERT INTO time_slots (exhibition_id, day_of_week, start_time, end_time, capacity) VALUES
((SELECT id FROM exhibitions WHERE slug = 'holography-theatre'), NULL, '11:30', '12:10', 80),
((SELECT id FROM exhibitions WHERE slug = 'holography-theatre'), NULL, '13:30', '14:10', 80),
((SELECT id FROM exhibitions WHERE slug = 'holography-theatre'), NULL, '15:30', '16:10', 80),
((SELECT id FROM exhibitions WHERE slug = 'holography-theatre'), NULL, '17:00', '17:40', 80);

-- ================================================
-- SEED SHOWS
-- ================================================

INSERT INTO shows (slug, name, description, type, duration_minutes, thumbnail_url, status) VALUES
(
  'full-dome-planetarium',
  'Full Dome Digital Planetarium',
  'Experience the most advanced digital planetarium in the Marathwada region. Our state-of-the-art Full Dome Digital Planetarium offers a truly immersive 360-degree experience that transports you through space and time.

The planetarium features:
- Ultra-high resolution projection system
- 360-degree immersive dome experience
- Multi-sensory audio system
- Comfortable seating with optimal viewing angles
- Live presentations by expert astronomers

Our shows cover a wide range of topics including:
- Journey through the solar system
- Exploration of distant galaxies
- The birth and death of stars
- Black holes and cosmic mysteries
- India''s space missions and ISRO achievements

Perfect for school groups, families, and space enthusiasts of all ages!',
  'planetarium',
  45,
  'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=800&q=80',
  'active'
),
(
  'cosmos-journey',
  'Cosmos: A Journey Through Time',
  'Experience the birth and evolution of the universe in stunning 360° visuals. Travel through space and time to witness cosmic events from the Big Bang to the formation of galaxies, stars, and planets. This show combines cutting-edge astronomical data with breathtaking visualizations.',
  'planetarium',
  45,
  'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=800&q=80',
  'active'
),
(
  'our-solar-system',
  'Our Solar System',
  'Explore our cosmic neighborhood with detailed views of planets, moons, and other celestial bodies. From the scorching surface of Mercury to the icy plains of Pluto, journey through our amazing solar system and learn fascinating facts about each world.',
  'planetarium',
  40,
  'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=800&q=80',
  'active'
),
(
  '3d-ocean-depths',
  'Ocean Depths 3D',
  'Dive deep into the ocean and explore marine life in stunning 3D. Experience the underwater world like never before, from coral reefs teeming with life to the mysterious creatures of the deep sea. Witness the beauty and fragility of our ocean ecosystems.',
  '3d_theatre',
  30,
  'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800&q=80',
  'active'
),
(
  'holographic-wonders',
  'Holographic Wonders',
  'Witness the science of holography with fully three-dimensional images that seem to float in mid-air. Learn about the physics of light, lasers, and interference patterns that make holograms possible, and explore the future applications of this fascinating technology.',
  'holography',
  40,
  'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80',
  'active'
);

-- ================================================
-- SEED EVENTS
-- ================================================

INSERT INTO events (title, slug, description, event_date, start_time, end_time, location, max_participants, featured_image, status) VALUES
(
  '100 Hours of Astronomy',
  '100-hours-astronomy-2025',
  'Join us for a spectacular weekend of stargazing, telescope observations, and astronomy workshops. This global event brings together astronomy enthusiasts from around the world to celebrate the wonders of the night sky. Activities include guided sky tours, astrophotography workshops, and talks by professional astronomers.',
  CURRENT_DATE + INTERVAL '30 days',
  '18:00',
  '23:00',
  'MGM Science Centre Campus',
  200,
  'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&q=80',
  'upcoming'
),
(
  'National Science Day Celebration',
  'national-science-day-2025',
  'Celebrate National Science Day with special demonstrations, experiments, and interactive sessions. Learn about CV Raman''s discovery and its impact on modern science. Participate in science quizzes, competitions, and hands-on workshops suitable for all ages.',
  CURRENT_DATE + INTERVAL '150 days',
  '09:30',
  '17:30',
  'All Galleries',
  500,
  'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80',
  'upcoming'
),
(
  'Robotics Workshop for Students',
  'robotics-workshop-november',
  'A comprehensive robotics workshop for students aged 12-18. Learn the basics of robot building, programming, and artificial intelligence. Participants will build and program their own robots and participate in friendly competitions. All materials provided.',
  CURRENT_DATE + INTERVAL '45 days',
  '10:00',
  '16:00',
  'Science Park Workshop Hall',
  50,
  'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80',
  'upcoming'
);

-- ================================================
-- SEED CONTENT PAGES
-- ================================================

INSERT INTO content_pages (slug, title, content, meta_title, meta_description, published) VALUES
(
  'about-us',
  'About MGM Science Centre',
  '{"blocks": [{"type": "heading", "data": {"text": "Our Mission", "level": 2}}, {"type": "paragraph", "data": {"text": "To inspire curiosity and foster scientific learning through interactive exhibitions and hands-on experiences."}}, {"type": "heading", "data": {"text": "Our Vision", "level": 2}}, {"type": "paragraph", "data": {"text": "To become the leading science education center in Maharashtra, making science accessible and fun for everyone."}}]}'::jsonb,
  'About MGM Science Centre | Mission & Vision',
  'Learn about MGM APJ Abdul Kalam Astrospace Science Centre, our mission, vision, and commitment to science education in Aurangabad.',
  TRUE
);

-- Migration complete!






