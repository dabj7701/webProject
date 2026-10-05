# Skinfolio API

Ett backend-system för att hantera CS-skins, byggt med Node.js, Express och MariaDB (Docker).

## Förkrav
Innan du startar behöver du ha följande installerat på din dator:
* [Node.js](https://nodejs.org/)
* [Docker Desktop](https://www.docker.com/products/docker-desktop/)
* Git

## Kom igång

**1. Klona projektet**
\`\`\`bash
git clone <länk-till-ditt-github-repo>
cd <ditt-mappnamn>
\`\`\`

**2. Installera beroenden**
\`\`\`bash
npm install
\`\`\`

**3. Konfigurera miljövariabler**
Skapa en fil som heter `.env` i projektets rotmapp (denna laddas inte upp på GitHub). Lägg in följande:
\`\`\`env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=1234
DB_NAME=skinfolio
PORT=3000
\`\`\`

**4. Starta databasen (Docker)**
Se till att Docker Desktop är igång och kör sedan:
\`\`\`bash
docker-compose up -d
\`\`\`
*Detta laddar ner MariaDB, startar den på port 3306 och bygger upp databasstrukturen och testdata automatiskt via `setup.sql`.*

**5. Starta servern**
\`\`\`bash
node server.js
\`\`\`
API:et snurrar nu på `http://localhost:3000`.

## API Routes

### Skins
* `GET /api/skins` - Hämta alla skins
* `POST /api/skins` - Lägg till ett nytt skin
* `PUT /api/skins/:id` - Uppdatera ett befintligt skin
* `DELETE /api/skins/:id` - Ta bort ett skin

### Kategorier & Skick
* `GET /api/categories` - Hämta alla vapenkategorier
* `GET /api/conditions` - Hämta alla wear conditions

### Användare
* `POST /api/users` - Registrera en ny användare (lösenord hashas med bcrypt) <--- Inte klar än
