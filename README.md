# Paws and Care - Pet Clinic

Plain HTML, CSS and JavaScript frontend with a PHP and MySQL backend.

Features: register and log in, add and remove pets, see the vets, book and cancel appointments (a vet cannot be double-booked).

## Structure

- `database/schema.sql` - tables, a database user and sample vets
- `backend/` - PHP API: `auth.php`, `pets.php`, `vets.php`, `appointments.php`, `config.php`
- `frontend/` - `index.html`, `style.css`, `app.js`

## Run it in a GitHub Codespace

1. Install PHP and MariaDB (once):
   `sudo apt-get update && sudo apt-get install -y php php-mysql mariadb-server`
2. Start the database and load the schema:
   `sudo service mariadb start`
   `sudo mysql < database/schema.sql`
3. Start the app from the repo root:
   `php -S 0.0.0.0:8000`
4. Open the **Ports** tab, click the globe next to port 8000, and add `/frontend/` to the end of the URL.

If you change the database user or password, update them in `backend/config.php`.
