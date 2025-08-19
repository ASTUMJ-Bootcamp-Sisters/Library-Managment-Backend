📚 Library Management System – Backend

This is the backend for the Library Management System project built with Node.js and Express.js.

It includes:

REST API structure

Authentication & authorization scaffolding

File uploads support

🔹 Getting Started
1. Clone the repo
git clone https://github.com/ASTUMJ-Bootcamp-Sisters/Library-Managment-Backend.git
cd Library-Managment-Backend

2. Install Dependencies

Recommended (pnpm):

pnpm install


Using npm (make sure npm version 9 to avoid installation issues):

npm install


Note: Do not use npm install -g npm@9 inside the project. If needed, downgrade npm globally before installing dependencies.

3. Run the Dev Server
pnpm run dev
# or
npm run dev


The server will start locally on port 5000 (default).

🔹 Installed Packages

express – Web framework

mongoose – MongoDB ODM (database not yet connected)

cors – Cross-Origin Resource Sharing

dotenv – Environment variable management

bcryptjs – Password hashing

jsonwebtoken – JWT authentication

multer – File uploads

🔹 Project Structure
Library-Managment-Backend/

├─ controllers/        # API controllers

├─ models/             # MongoDB schemas

├─ routes/             # API routes

├─ middleware/         # Auth & error handling

├─ config/             # App configurations

├─ index.js            # Entry point

├─ package.json

└─ .env.example        # Environment variables template


✅ Ready for your team to clone, install dependencies, and start developing the backend APIs.