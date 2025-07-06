# 12.xyz's SchoolSync

![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

A modern web application built with Vite + React frontend, Node.js backend, PostgreSQL database, and Docker containerization.

## Features

- ⚡️ Blazing fast Vite + React frontend
- 🚀 Node.js backend with Express
- 🐘 PostgreSQL database with Docker
- 📦 Full Docker containerization
- 🔒 Environment-based configuration
- 🔄 Hot-reloading development environment
- 📱 Responsive design

## Prerequisites

Before you begin, ensure you have installed:

- [Node.js](https://nodejs.org/) (v18+)
- [Docker](https://www.docker.com/get-started/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Git](https://git-scm.com/)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/project-name.git
cd project-name
```

### 2. Setup environment variables

Create environment files from examples:

```bash
# Frontend
cp frontend/.env.example frontend/.env

# Backend
cp backend/.env.example backend/.env
```

Edit these files with your actual configuration values.

### 3. Start with Docker Compose (Recommended)

```bash
docker compose up --build
```

This will:
- Build the Docker images
- Start PostgreSQL container
- Start backend API server
- Start frontend development server

### 4. Access the application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api
- PostgreSQL: `localhost:5432` (default credentials in docker-compose.yml)

## Alternative Setup (Without Docker)

### 1. Start PostgreSQL

Install and start PostgreSQL on your machine, or use:

```bash
docker run --name my-postgres -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 -d postgres
```

### 2. Start Backend

```bash
cd backend
npm install
npm run migrate  # Run database migrations
npm run dev      # Start development server
```

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```bash
.
├── backend/               # Node.js API server
│   ├── src/               # Source code
│   ├── Dockerfile         # Backend Docker configuration
│   ├── package.json
│   └── .env.example
├── frontend/              # Vite + React app
│   ├── public/            # Static assets
│   ├── src/               # React components
│   ├── Dockerfile         # Frontend Docker configuration
│   ├── package.json
│   └── .env.example
├── docker-compose.yml     # Main Docker configuration
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

## Environment Variables

### Backend (.env)

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgres://user:password@postgres:5432/dbname
JWT_SECRET=your_jwt_secret_here
```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME="My Awesome App"
```

## Available Commands

### Docker-based commands

```bash
# Start all services
docker compose up

# Start in detached mode
docker compose up -d

# Stop all services
docker compose down

# Rebuild containers
docker compose up --build

# View logs
docker compose logs -f
```

### Backend commands

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run database migrations
npm run migrate

# Run tests
npm test
```

### Frontend commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Database Management

Access PostgreSQL container:

```bash
docker compose exec postgres psql -U postgres
```

Common SQL commands:
```sql
\l        # List databases
\c dbname # Connect to database
\dt       # List tables
```

## Deployment

To deploy to production:

1. Build production images:
```bash
docker compose -f docker-compose.prod.yml build
```

2. Start production stack:
```bash
docker compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

**Database connection issues:**
- Ensure PostgreSQL container is running
- Verify credentials in backend/.env match docker-compose.yml
- Check port mappings

**Docker build failures:**
- Clear Docker cache: `docker builder prune`
- Check Dockerfile syntax

**Missing dependencies:**
- Run `docker compose build --no-cache` to rebuild from scratch

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## License

Distributed under the MIT License. See `LICENSE` for more information.
