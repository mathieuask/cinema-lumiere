# Database Project - Cinema

## Virtual Database Business - GBBA 3

### Nils SCHAEFER - nils.schaefer@ext.neoma-bs.fr

---

## Group members

- Mathieu ASKAMP
- Bonan
- Sala
- Scao

---

## 1. Structure of the database with explanations

### 1.1 Context

We built a database for a cinema called "Cinema Lumiere". Our database handles the following data:

- **Movies**: films shown in the cinema, with their title, synopsis, director, duration, release date and poster
- **Categories**: movie genres (Action, Comedy, Drama, Horror, Sci-Fi, Documentary, Historical, etc.)
- **Rooms**: the different screening rooms of the cinema, with their name and capacity
- **Seats**: individual seats inside each room, identified by row letter and seat number, with a seat type (standard, premium, VIP)
- **Screenings**: the schedule of movie projections, linking a movie to a room at a specific date/time, with a base price
- **Customers**: people who book tickets, with their first name, last name, email, birth date
- **Reservations**: the bookings made by customers for specific screenings and seats, with the amount paid and status (confirmed, pending, cancelled)
- **Pricing**: different pricing tiers (Full price, Student, Senior, Child) with a multiplier applied to the base price of a screening

We added **Seats** and **Pricing** beyond the minimum requirements because:
- Seats allow us to manage seat selection during booking (row, number, type) which is realistic for a real cinema
- Pricing allows us to handle different tariffs (student discounts, senior discounts, etc.) which is essential for a real cinema business

---

### 1.2 CDM (Conceptual Data Model)

The CDM represents the entities and their associations with cardinalities.

#### Entities and their attributes

**Movies**
- idMovie (PK)
- Title
- Synopsis
- DurationMin
- ReleaseDate
- Director

**Categories**
- idCategory (PK)
- Name

**Rooms**
- idRoom (PK)
- Name
- Capacity

**Seats**
- idSeat (PK)
- RowLetter
- SeatNumber
- SeatType

**Screenings**
- idScreening (PK)
- StartTime
- BasePrice

**Customers**
- idCustomer (PK)
- FirstName
- LastName
- Email
- BirthDate

**Pricing**
- idPricing (PK)
- Label
- Multiplier

**Reservations**
- idReservation (PK)
- AmountPaid
- ReservedAt
- Status

#### Associations and cardinalities

```
Movies ----0,n---- is a ----0,n---- Categories
                   (association n-n)

Rooms ----1,n---- contains ----1,1---- Seats
                  (a room contains many seats, a seat belongs to one room)

Movies ----0,n---- projected in ----0,n---- Rooms
                   Screenings (association with attributes: StartTime, BasePrice)
                   (a movie can be projected in many rooms, a room can project many movies)

Note: Screenings is modeled as an entity because it has its own PK and
      multiple associations. It links Movies and Rooms.

Screenings ----1,1---- projects ----0,n---- Movies
                       (a screening projects one movie, a movie can have many screenings)

Screenings ----1,1---- takes place in ----0,n---- Rooms
                       (a screening is in one room, a room can have many screenings)

Customers ----0,n---- reserves ----0,n---- Screenings
                      Reservations (association with attributes: AmountPaid, ReservedAt, Status)

Reservations ----1,1---- for seat ----0,n---- Seats
                         (a reservation is for one seat, a seat can have many reservations over time)

Reservations ----1,1---- at price ----0,n---- Pricing
                         (a reservation uses one pricing tier, a pricing tier can be used many times)
```

#### CDM Diagram (text representation in the format of the course)

```
+-------------+                                              +-------------+
| Categories  |                                              |   Pricing   |
|-------------|                                              |-------------|
| idCategory  |                                              | idPricing   |
| Name        |                                              | Label       |
+------+------+                                              | Multiplier  |
       |0,n                                                  +------+------+
       |                                                            |0,n
  +----+----+                                                       |
  |  is a   |                                                  +----+-----+
  +---------+                                                  | at price |
       |0,n                                                    +----------+
       |                                                            |1,1
+------+------+     +----------+     +---------+     +------+------+------+
|   Movies    |     | projects |     |Screenings|     | Reservations      |
|-------------|     +----------+     |---------|     |-------------------|
| idMovie     +--0,n----+  +---1,1---+ idScreen|     | idReservation     |
| Title       |         |  |         | StartTime+0,n-+ reserves +--0,n--+ Customers  |
| Synopsis    |         +--+         | BasePrice|     | AmountPaid        | |-----------|
| DurationMin |                      +----+----+     | ReservedAt        | | idCustomer|
| ReleaseDate |                           |1,1       | Status            | | FirstName |
| Director    |                      +----+------+   +--------+----------+ | LastName  |
+-------------+                      |takes place|            |1,1         | Email     |
                                     |    in     |       +----+----+       | BirthDate |
                                     +-----------+       | for seat|       +-----------+
                                          |0,n           +---------+
                                     +----+----+              |0,n
                                     |  Rooms  |         +----+----+
                                     |---------|         |  Seats  |
                                     | idRoom  |--1,n----+---------|
                                     | Name    | contains| idSeat  |
                                     | Capacity|         | RowLetter|
                                     +---------+         | SeatNumber|
                                                         | SeatType |
                                                         +----------+
```

Summary of cardinalities:

| Association | Entity 1 | Cardinality | Entity 2 | Cardinality |
|---|---|---|---|---|
| is a | Movies | 0,n | Categories | 0,n |
| projects | Screenings | 1,1 | Movies | 0,n |
| takes place in | Screenings | 1,1 | Rooms | 0,n |
| contains | Rooms | 1,n | Seats | 1,1 |
| reserves | Customers | 0,n | Screenings | 0,n |
| for seat | Reservations | 1,1 | Seats | 0,n |
| at price | Reservations | 1,1 | Pricing | 0,n |

---

### 1.3 LDM (Logical Data Model)

Applying the conversion rules from the course:

- **Rule 1**: Each entity becomes a table
- **Rule 2**: For a 1-n association, the primary key of the "n" side is copied as a foreign key on the "1" side
- **Rule 3**: For a n-n association, the association becomes a table with the 2 primary keys as foreign keys

#### Textual LDM (format of the course)

**Movies**(<u>idMovie</u>, Title, Synopsis, DurationMin, ReleaseDate, Director)

**Categories**(<u>idCategory</u>, Name)

**movie_categories**(<u>#idMovie, #idCategory</u>)
- Rule 3 applied: n-n association "is a" becomes a table

**Rooms**(<u>idRoom</u>, Name, Capacity)

**Seats**(<u>idSeat</u>, RowLetter, SeatNumber, SeatType, #idRoom)
- Rule 2 applied: 1-n association "contains" → FK idRoom added to Seats

**Screenings**(<u>idScreening</u>, StartTime, BasePrice, #idMovie, #idRoom)
- Rule 2 applied twice: FK idMovie (from "projects") and FK idRoom (from "takes place in")

**Customers**(<u>idCustomer</u>, FirstName, LastName, Email, BirthDate)

**Pricing**(<u>idPricing</u>, Label, Multiplier)

**Reservations**(<u>idReservation</u>, AmountPaid, ReservedAt, Status, #idCustomer, #idScreening, #idSeat, #idPricing)
- Rule 2 applied 4 times: FK for customer, screening, seat and pricing

#### LDM Diagram description

| Table | Primary Key | Foreign Keys | Points to |
|---|---|---|---|
| Movies | idMovie | - | - |
| Categories | idCategory | - | - |
| movie_categories | idMovie + idCategory | #idMovie, #idCategory | Movies, Categories |
| Rooms | idRoom | - | - |
| Seats | idSeat | #idRoom | Rooms |
| Screenings | idScreening | #idMovie, #idRoom | Movies, Rooms |
| Customers | idCustomer | - | - |
| Pricing | idPricing | - | - |
| Reservations | idReservation | #idCustomer, #idScreening, #idSeat, #idPricing | Customers, Screenings, Seats, Pricing |

---

### 1.4 PDM (Physical Data Model)

The database is implemented on PostgreSQL (Supabase). Here are the CREATE TABLE statements:

```sql
CREATE TABLE movies
(
  id INT NOT NULL AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  synopsis TEXT,
  duration_min INT NOT NULL,
  release_date DATE,
  director VARCHAR(100),
  PRIMARY KEY(id)
);

CREATE TABLE categories
(
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  PRIMARY KEY(id)
);

CREATE TABLE movie_categories
(
  movie_id INT NOT NULL,
  category_id INT NOT NULL,
  PRIMARY KEY(movie_id, category_id),
  FOREIGN KEY(movie_id) REFERENCES movies(id),
  FOREIGN KEY(category_id) REFERENCES categories(id)
);

CREATE TABLE rooms
(
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  capacity INT NOT NULL,
  PRIMARY KEY(id)
);

CREATE TABLE seats
(
  id INT NOT NULL AUTO_INCREMENT,
  room_id INT NOT NULL,
  row_letter CHAR(1) NOT NULL,
  seat_number INT NOT NULL,
  seat_type VARCHAR(20) NOT NULL DEFAULT 'standard',
  PRIMARY KEY(id),
  FOREIGN KEY(room_id) REFERENCES rooms(id)
);

CREATE TABLE screenings
(
  id INT NOT NULL AUTO_INCREMENT,
  movie_id INT NOT NULL,
  room_id INT NOT NULL,
  start_time DATETIME NOT NULL,
  base_price FLOAT NOT NULL,
  PRIMARY KEY(id),
  FOREIGN KEY(movie_id) REFERENCES movies(id),
  FOREIGN KEY(room_id) REFERENCES rooms(id)
);

CREATE TABLE customers
(
  id INT NOT NULL AUTO_INCREMENT,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(200) NOT NULL,
  birth_date DATE,
  PRIMARY KEY(id)
);

CREATE TABLE pricing
(
  id INT NOT NULL AUTO_INCREMENT,
  label VARCHAR(50) NOT NULL,
  multiplier FLOAT NOT NULL,
  PRIMARY KEY(id)
);

CREATE TABLE reservations
(
  id INT NOT NULL AUTO_INCREMENT,
  customer_id INT NOT NULL,
  screening_id INT NOT NULL,
  seat_id INT NOT NULL,
  pricing_id INT NOT NULL,
  amount_paid FLOAT NOT NULL,
  reserved_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
  PRIMARY KEY(id),
  FOREIGN KEY(customer_id) REFERENCES customers(id),
  FOREIGN KEY(screening_id) REFERENCES screenings(id),
  FOREIGN KEY(seat_id) REFERENCES seats(id),
  FOREIGN KEY(pricing_id) REFERENCES pricing(id)
);
```

**Notes on datatype choices:**
- `title`, `name`, `email`, `director` → VARCHAR because variable-length text
- `synopsis` → TEXT because it can be a long description
- `duration_min`, `capacity`, `seat_number` → INT because these are numbers we could do calculations with
- `release_date`, `birth_date` → DATE (format yyyy-mm-dd)
- `start_time`, `reserved_at` → DATETIME (format yyyy-mm-dd hh:mm:ss)
- `base_price`, `amount_paid`, `multiplier` → FLOAT for decimal values
- `row_letter` → CHAR(1) because it's always a single letter (A, B, C...)
- `seat_type` → VARCHAR(20) for values like 'standard', 'premium', 'VIP'
- `status` → VARCHAR(20) for values like 'confirmed', 'pending', 'cancelled'
**Important:** We create the tables WITHOUT foreign keys first (movies, categories, rooms, customers, pricing), then the tables WITH foreign keys (seats, screenings, movie_categories, reservations), because a foreign key must reference an existing table.

---

## 2. Example data

We inserted example data into all tables. Here are some examples:

### Categories
| id | name |
|---|---|
| 1 | Action |
| 2 | Comedy |
| 3 | Drama |
| 4 | Sci-Fi |
| 5 | Horror |
| 6 | Documentary |
| 7 | Historical |
| 8 | Animation |
| 9 | Thriller |

### Movies (sample)
| id | title | director | duration_min | release_date |
|---|---|---|---|---|
| 1 | Avatar 2 | James Cameron | 192 | 2022-12-14 |
| 2 | Oppenheimer | Christopher Nolan | 180 | 2023-07-19 |
| 3 | The Dark Knight | Christopher Nolan | 152 | 2008-07-18 |
| 4 | Inception | Christopher Nolan | 148 | 2010-07-16 |
| 5 | Parasite | Bong Joon-ho | 132 | 2019-05-30 |

### Rooms
| id | name | capacity |
|---|---|---|
| 1 | Salle Lumiere | 200 |
| 2 | Salle Melies | 150 |
| 3 | Salle Chaplin | 100 |
| 4 | Salle Truffaut | 80 |

### Pricing
| id | label | multiplier |
|---|---|---|
| 1 | Plein tarif | 1.00 |
| 2 | Etudiant | 0.70 |
| 3 | Senior | 0.80 |
| 4 | Enfant | 0.50 |

### Screenings (sample)
| id | movie_id | room_id | start_time | base_price |
|---|---|---|---|---|
| 1 | 1 | 1 | 2024-03-01 14:00:00 | 12.00 |
| 2 | 2 | 2 | 2024-03-01 17:00:00 | 11.00 |
| 3 | 3 | 1 | 2024-03-02 20:00:00 | 12.00 |

### Customers (sample)
| id | first_name | last_name | email | birth_date |
|---|---|---|---|---|
| 1 | Jean | Dupont | jean.dupont@email.com | 1990-05-15 |
| 2 | Marie | Martin | marie.martin@email.com | 1985-11-20 |
| 3 | Paul | Bernard | paul.bernard@email.com | 2001-03-08 |

---

## 3. SQL Queries for documents

### 10 imposed queries

**Query 1: Rooms of the cinema with number of places**
```sql
SELECT r.name AS salle, r.capacity AS nombre_de_places
FROM rooms r
ORDER BY r.capacity DESC
```

**Query 2: Cinema schedule from 2024-03-01 to 2024-03-07**
```sql
SELECT m.title AS film, r.name AS salle, s.start_time AS horaire
FROM screenings s
JOIN movies m ON s.movie_id = m.id
JOIN rooms r ON s.room_id = r.id
WHERE s.start_time BETWEEN '2024-03-01' AND '2024-03-07 23:59:59'
ORDER BY s.start_time
```

**Query 3: Number of screenings for each film during 2024**
```sql
SELECT m.title AS film, COUNT(s.id) AS nombre_projections
FROM movies m
JOIN screenings s ON s.movie_id = m.id
WHERE EXTRACT(YEAR FROM s.start_time) = 2024
GROUP BY m.id, m.title
ORDER BY nombre_projections DESC
```

**Query 4: Number of movies per categories**
```sql
SELECT c.name AS categorie, COUNT(mc.movie_id) AS nombre_films
FROM categories c
LEFT JOIN movie_categories mc ON mc.category_id = c.id
GROUP BY c.id, c.name
ORDER BY nombre_films DESC
```

**Query 5: Cinema schedule for action movies for 2024-03-01**
```sql
SELECT m.title AS film, r.name AS salle, s.start_time AS horaire
FROM screenings s
JOIN movies m ON s.movie_id = m.id
JOIN rooms r ON s.room_id = r.id
JOIN movie_categories mc ON mc.movie_id = m.id
JOIN categories c ON c.id = mc.category_id
WHERE c.name = 'Action'
  AND DATE(s.start_time) = '2024-03-01'
ORDER BY s.start_time
```

**Query 6: Number of entries for each film in 2024 except for the documentary category**
```sql
SELECT m.title AS film, COUNT(res.id) AS nombre_entrees
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
ORDER BY nombre_entrees DESC
```

**Query 7: Average occupancy of each room in 2024**
```sql
SELECT r.name AS salle, r.capacity,
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
ORDER BY taux_occupation_moyen DESC
```

**Query 8: Number of movies seen in 2024 for each customer**
```sql
SELECT c.first_name, c.last_name, COUNT(DISTINCT s.movie_id) AS films_vus
FROM customers c
JOIN reservations res ON res.customer_id = c.id
JOIN screenings s ON s.id = res.screening_id
WHERE EXTRACT(YEAR FROM s.start_time) = 2024
  AND res.status = 'confirmed'
GROUP BY c.id, c.first_name, c.last_name
ORDER BY films_vus DESC
```

**Query 9: Historical movies scheduled during january 2024 in the biggest room**
```sql
SELECT DISTINCT m.title AS film, s.start_time AS horaire
FROM screenings s
JOIN movies m ON s.movie_id = m.id
JOIN rooms r ON s.room_id = r.id
JOIN movie_categories mc ON mc.movie_id = m.id
JOIN categories c ON c.id = mc.category_id
WHERE c.name = 'Historique'
  AND s.start_time BETWEEN '2024-01-01' AND '2024-01-31 23:59:59'
  AND r.capacity = (SELECT MAX(capacity) FROM rooms)
ORDER BY s.start_time
```

**Query 10: Amount of cash earned with the movie "Avatar 2" during February 2024**
```sql
SELECT m.title AS film, SUM(res.amount_paid) AS montant_total
FROM movies m
JOIN screenings s ON s.movie_id = m.id
JOIN reservations res ON res.screening_id = s.id
WHERE m.title = 'Avatar 2'
  AND s.start_time BETWEEN '2024-02-01' AND '2024-02-29 23:59:59'
  AND res.status = 'confirmed'
GROUP BY m.id, m.title
```

### 5 personal queries

**Query 11: Top 5 most loyal customers (by total amount spent)**
```sql
SELECT c.first_name, c.last_name,
  COUNT(res.id) AS nb_reservations,
  SUM(res.amount_paid) AS total_depense
FROM customers c
JOIN reservations res ON res.customer_id = c.id
WHERE res.status = 'confirmed'
GROUP BY c.id, c.first_name, c.last_name
ORDER BY total_depense DESC
LIMIT 5
```

**Query 12: Total revenue per month in 2024**
```sql
SELECT EXTRACT(MONTH FROM s.start_time)::int AS mois,
  SUM(res.amount_paid) AS recette_mensuelle
FROM reservations res
JOIN screenings s ON s.id = res.screening_id
WHERE EXTRACT(YEAR FROM s.start_time) = 2024
  AND res.status = 'confirmed'
GROUP BY EXTRACT(MONTH FROM s.start_time)
ORDER BY mois
```

**Query 13: Movies that have never been booked**
```sql
SELECT m.title, m.director, m.release_date
FROM movies m
WHERE m.id NOT IN (
  SELECT DISTINCT s.movie_id
  FROM screenings s
  JOIN reservations res ON res.screening_id = s.id
  WHERE res.status = 'confirmed'
)
```

**Query 14: Distribution of pricing tiers used**
```sql
SELECT p.label AS tarif,
  COUNT(res.id) AS nb_utilisations,
  ROUND(COUNT(res.id) * 100.0 / (SELECT COUNT(*) FROM reservations WHERE status = 'confirmed'), 2) AS pourcentage
FROM pricing p
JOIN reservations res ON res.pricing_id = p.id
WHERE res.status = 'confirmed'
GROUP BY p.id, p.label
ORDER BY nb_utilisations DESC
```

**Query 15: Top 10 most profitable screenings**
```sql
SELECT m.title AS film, r.name AS salle, s.start_time,
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
LIMIT 10
```

---

## 4. SQL concepts used (summary)

This table shows all the SQL concepts from the course that we used in our queries:

| Concept | Course session | Used in queries |
|---|---|---|
| SELECT, FROM | SQL Part 1 | All queries |
| WHERE | SQL Part 1 | Q2, Q3, Q5, Q6, Q7, Q8, Q9, Q10, Q11, Q12, Q13, Q14, Q15 |
| ORDER BY | SQL Part 1 | Q1, Q2, Q3, Q4, Q5, Q8, Q9, Q10, Q11, Q12, Q14, Q15 |
| COUNT(*) | SQL Part 1 | Q3, Q4, Q6, Q8, Q11, Q14, Q15 |
| SUM() | SQL Part 1 | Q10, Q11, Q12, Q15 |
| AVG() | SQL Part 1 | Q7 |
| MAX() | SQL Part 1 | Q9 |
| ROUND() | SQL Part 1 | Q7, Q14, Q15 |
| GROUP BY | SQL Part 1 | Q3, Q4, Q6, Q7, Q8, Q10, Q11, Q12, Q14, Q15 |
| DISTINCT | SQL Part 1 | Q8, Q9, Q13 |
| BETWEEN | SQL Part 1 | Q2, Q9, Q10 |
| NOT IN (subquery) | SQL Part 1 | Q6, Q13 |
| JOIN ... ON | SQL Part 2 | Q2, Q3, Q4, Q5, Q6, Q7, Q8, Q9, Q10, Q11, Q12, Q14, Q15 |
| LEFT JOIN | SQL Part 2 | Q4, Q7 |
| Multiple JOINs (3+ tables) | SQL Part 2 | Q5, Q6, Q8, Q9, Q10, Q15 |
| Subquery in WHERE | SQL Part 2 | Q6, Q9, Q13, Q14 |
| Subquery in FROM | Advanced | Q7 |
| EXTRACT(YEAR/MONTH FROM ...) | Session 3 | Q3, Q5, Q8, Q12 |
| LIMIT | Advanced | Q11, Q15 |

---

## 5. Encountered problems and improvements

### Problems encountered

1. **Order of table creation**: We had to create tables without foreign keys first (movies, categories, rooms, customers, pricing), then tables with foreign keys (seats, screenings, movie_categories, reservations). If you try to create `screenings` before `movies`, PostgreSQL returns an error because the foreign key references a table that doesn't exist yet.

2. **Inserting data with foreign keys**: When inserting data into `reservations`, we had to make sure that the referenced customer_id, screening_id, seat_id and pricing_id already existed in their respective tables. PostgreSQL rejects any INSERT with a foreign key value that doesn't exist in the referenced table (referential integrity).

3. **The n-n association between Movies and Categories**: A movie can belong to multiple categories (e.g., "Inception" is both Sci-Fi and Action). This required creating the `movie_categories` association table with a composite primary key (movie_id, category_id), as learned in Rule 3 of the LDM (Session 2).

4. **Date filtering**: For queries like "schedule from March 1 to March 7", we had to be careful to include the full last day by using `'2024-03-07 23:59:59'` instead of just `'2024-03-07'`, because DATETIME includes the time component.

5. **Average occupancy calculation (Query 7)**: This was the most complex query. We needed a subquery to first count the number of reservations per screening, then join this result with the rooms table to calculate the percentage. This uses a subquery in the FROM clause, which goes slightly beyond what was covered in the course.

6. **NULL values**: Some movies have no reservations yet. Using a regular JOIN would exclude them from the results. We had to use LEFT JOIN in queries 4 and 7 to include categories/rooms with zero results (showing 0 instead of hiding them).

### Possible improvements

1. **Add a "sessions" or "showtimes" concept**: Currently a screening has only one start_time. We could add recurring sessions (e.g., every day at 14h, 17h, 20h) to avoid inserting each screening manually.

2. **Add a "payments" table**: To track different payment methods (card, cash, online) and separate the payment from the reservation.

3. **Add constraints**: We could add UNIQUE constraints (e.g., a customer's email should be unique) and CHECK constraints (e.g., amount_paid must be positive, capacity must be > 0).

4. **Manage seat availability better**: Currently we check seat availability by looking at reservations. We could add a trigger or constraint to prevent double-booking of the same seat for the same screening.
