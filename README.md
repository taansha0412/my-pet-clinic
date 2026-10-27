# Paws and Care - Pet Clinic

Plain HTML, CSS and JavaScript frontend with a PHP and MySQL backend.

## How it works

1. The home page has two options: **Pet owner** and **Vet**.
2. **Pet owner**: enter the pet name and owner name. The site gives you a pet ID and asks you to wait for timing approval. Enter the ID any time to check status. The page also refreshes itself every 10 seconds while you wait.
3. **Vet**: log in with name and password. You see pets waiting for a time and pets already approved (pet name, owner name, date and time).
4. For a waiting pet, pick a date and time and click **Approve**. The pet moves to the approved list and the owner sees the time on their side.

## Structure

- `database/schema.sql` - tables, database user and two sample vets
- `backend/config.php` - database connection and helpers
- `backend/auth.php` - vet login and logout
- `backend/pets.php` - owner registers a pet and checks status by ID
- `backend/vets.php` - vet dashboard data (waiting and approved lists)
- `backend/appointments.php` - vet gives a waiting pet a date and time
- `frontend/index.html`, `style.css`, `app.js` - the pages

## Sample vet logins

| Name  | Password |
|-------|----------|
| Meera | meera123 |
| Arjun | arjun123 |

Change these before sharing the site. To add a vet, generate a hash with `php -r "echo password_hash('newpass', PASSWORD_DEFAULT);"` and insert it into the `vets` table.

## Run it in a GitHub Codespace

1. Install PHP and MariaDB (once):
   `sudo apt-get update && sudo apt-get install -y php php-mysql mariadb-server`
2. Start the database and load the schema (this resets the tables):
   `sudo service mariadb start`
   `sudo mysql < database/schema.sql`
3. Start the app from the repo root:
   `php -S 0.0.0.0:8000`
4. Open the **Ports** tab, click the globe next to port 8000, and add `/frontend/` to the end of the URL.

## Run it on your own computer

Install PHP and MySQL (XAMPP works on Windows), load `database/schema.sql`, then run `php -S localhost:8000` from the project folder and open `http://localhost:8000/frontend/`.
