// 15 SQL Queries — adapted for PostgreSQL (Supabase)
// These are used in the admin dashboard to display results

export const queries = [
  {
    id: 1,
    title: "Cinema rooms with seat count",
    sql: `SELECT r.name AS salle, r.capacity AS nombre_de_places
FROM rooms r
ORDER BY r.capacity DESC`,
  },
  {
    id: 2,
    title: "Cinema schedule from 2024-03-01 to 2024-03-07",
    sql: `SELECT m.title AS film, r.name AS salle, s.start_time AS horaire
FROM screenings s
JOIN movies m ON s.movie_id = m.id
JOIN rooms r ON s.room_id = r.id
WHERE s.start_time BETWEEN '2024-03-01' AND '2024-03-07 23:59:59'
ORDER BY s.start_time`,
  },
  {
    id: 3,
    title: "Number of screenings per movie in 2024",
    sql: `SELECT m.title AS film, COUNT(s.id) AS nombre_projections
FROM movies m
JOIN screenings s ON s.movie_id = m.id
WHERE EXTRACT(YEAR FROM s.start_time) = 2024
GROUP BY m.id, m.title
ORDER BY nombre_projections DESC`,
  },
  {
    id: 4,
    title: "Number of movies per category",
    sql: `SELECT c.name AS categorie, COUNT(mc.movie_id) AS nombre_films
FROM categories c
LEFT JOIN movie_categories mc ON mc.category_id = c.id
GROUP BY c.id, c.name
ORDER BY nombre_films DESC`,
  },
  {
    id: 5,
    title: "Action movies schedule for 2024-03-01",
    sql: `SELECT m.title AS film, r.name AS salle, s.start_time AS horaire
FROM screenings s
JOIN movies m ON s.movie_id = m.id
JOIN rooms r ON s.room_id = r.id
JOIN movie_categories mc ON mc.movie_id = m.id
JOIN categories c ON c.id = mc.category_id
WHERE c.name = 'Action'
  AND DATE(s.start_time) = '2024-03-01'
ORDER BY s.start_time`,
  },
  {
    id: 6,
    title: "Number of admissions per movie in 2024 (excluding documentaries)",
    sql: `SELECT m.title AS film, COUNT(res.id) AS nombre_entrees
FROM movies m
JOIN screenings s ON s.movie_id = m.id
JOIN reservations res ON res.screening_id = s.id
WHERE EXTRACT(YEAR FROM s.start_time) = 2024
  AND res.status = 'confirmed'
  AND m.id NOT IN (
    SELECT mc.movie_id FROM movie_categories mc
    JOIN categories c ON c.id = mc.category_id
    WHERE c.name = 'Documentaire'
  )
GROUP BY m.id, m.title
ORDER BY nombre_entrees DESC`,
  },
  {
    id: 7,
    title: "Average occupancy rate per room in 2024",
    sql: `SELECT r.name AS salle, r.capacity,
  ROUND(AVG(occupation.nb_reservations * 100.0 / r.capacity), 2) AS taux_occupation_moyen
FROM rooms r
JOIN (
  SELECT s.room_id, s.id AS screening_id, COUNT(res.id) AS nb_reservations
  FROM screenings s
  LEFT JOIN reservations res ON res.screening_id = s.id AND res.status = 'confirmed'
  WHERE EXTRACT(YEAR FROM s.start_time) = 2024
  GROUP BY s.room_id, s.id
) AS occupation ON occupation.room_id = r.id
GROUP BY r.id, r.name, r.capacity
ORDER BY taux_occupation_moyen DESC`,
  },
  {
    id: 8,
    title: "Number of movies watched in 2024 per customer",
    sql: `SELECT c.first_name, c.last_name, COUNT(DISTINCT s.movie_id) AS films_vus
FROM customers c
JOIN reservations res ON res.customer_id = c.id
JOIN screenings s ON s.id = res.screening_id
WHERE EXTRACT(YEAR FROM s.start_time) = 2024
  AND res.status = 'confirmed'
GROUP BY c.id, c.first_name, c.last_name
ORDER BY films_vus DESC`,
  },
  {
    id: 9,
    title: "Historical movies scheduled in January 2024 in the largest room",
    sql: `SELECT DISTINCT m.title AS film, s.start_time AS horaire
FROM screenings s
JOIN movies m ON s.movie_id = m.id
JOIN rooms r ON s.room_id = r.id
JOIN movie_categories mc ON mc.movie_id = m.id
JOIN categories c ON c.id = mc.category_id
WHERE c.name = 'Historique'
  AND s.start_time BETWEEN '2024-01-01' AND '2024-01-31 23:59:59'
  AND r.capacity = (SELECT MAX(capacity) FROM rooms)
ORDER BY s.start_time`,
  },
  {
    id: 10,
    title: "Revenue earned from Avatar 2 in February 2024",
    sql: `SELECT m.title AS film, SUM(res.amount_paid) AS montant_total
FROM movies m
JOIN screenings s ON s.movie_id = m.id
JOIN reservations res ON res.screening_id = s.id
WHERE m.title = 'Avatar 2'
  AND s.start_time BETWEEN '2024-02-01' AND '2024-02-29 23:59:59'
  AND res.status = 'confirmed'
GROUP BY m.id, m.title`,
  },
  {
    id: 11,
    title: "Top 5 most loyal customers (by amount spent)",
    sql: `SELECT c.first_name, c.last_name,
  COUNT(res.id) AS nb_reservations,
  SUM(res.amount_paid) AS total_depense
FROM customers c
JOIN reservations res ON res.customer_id = c.id
WHERE res.status = 'confirmed'
GROUP BY c.id, c.first_name, c.last_name
ORDER BY total_depense DESC
LIMIT 5`,
  },
  {
    id: 12,
    title: "Total revenue per month in 2024",
    sql: `SELECT EXTRACT(MONTH FROM s.start_time)::int AS mois,
  SUM(res.amount_paid) AS recette_mensuelle
FROM reservations res
JOIN screenings s ON s.id = res.screening_id
WHERE EXTRACT(YEAR FROM s.start_time) = 2024
  AND res.status = 'confirmed'
GROUP BY EXTRACT(MONTH FROM s.start_time)
ORDER BY mois`,
  },
  {
    id: 13,
    title: "Movies never booked",
    sql: `SELECT m.title, m.director, m.release_date
FROM movies m
WHERE m.id NOT IN (
  SELECT DISTINCT s.movie_id
  FROM screenings s
  JOIN reservations res ON res.screening_id = s.id
  WHERE res.status = 'confirmed'
)`,
  },
  {
    id: 14,
    title: "Distribution of pricing tiers used",
    sql: `SELECT p.label AS tarif,
  COUNT(res.id) AS nb_utilisations,
  ROUND(COUNT(res.id) * 100.0 / (SELECT COUNT(*) FROM reservations WHERE status = 'confirmed'), 2) AS pourcentage
FROM pricing p
JOIN reservations res ON res.pricing_id = p.id
WHERE res.status = 'confirmed'
GROUP BY p.id, p.label
ORDER BY nb_utilisations DESC`,
  },
  {
    id: 15,
    title: "Most profitable screenings (top 10)",
    sql: `SELECT m.title AS film, r.name AS salle, s.start_time,
  COUNT(res.id) AS nb_places_vendues,
  SUM(res.amount_paid) AS recette_seance,
  ROUND(COUNT(res.id) * 100.0 / r.capacity, 2) AS taux_remplissage
FROM screenings s
JOIN movies m ON s.movie_id = m.id
JOIN rooms r ON s.room_id = r.id
JOIN reservations res ON res.screening_id = s.id
WHERE res.status = 'confirmed'
GROUP BY s.id, m.title, r.name, s.start_time, r.capacity
ORDER BY recette_seance DESC
LIMIT 10`,
  },
]
