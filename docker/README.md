# Docker Setup for Vitamin Tracker

This folder contains Docker configuration for running Vitamin Tracker in a container.

## Quick Start

### Using Docker Compose (Recommended)

```bash
# From the docker/ directory
docker-compose up -d

# Or from project root
docker-compose -f docker/docker-compose.yml up -d
```

The app will be available at http://localhost:3000

### Using Docker directly

```bash
# From project root directory
# First, copy .dockerignore to project root
cp docker/.dockerignore .dockerignore

# Build the image
docker build -f docker/Dockerfile -t vitamins-tracker .

# Run the container
docker run -d \
  --name vitamins-tracker \
  -p 3000:3000 \
  -v vitamins-data:/app/data \
  vitamins-tracker
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Port the app listens on |
| `DATABASE_URL` | `file:/app/data/vitamins.db` | SQLite database path |
| `NODE_ENV` | `production` | Node environment |

### Volumes

- `/app/data` - SQLite database storage (persist this!)

## Managing the Container

```bash
# View logs
docker-compose logs -f vitamins

# Stop
docker-compose down

# Stop and remove data
docker-compose down -v

# Rebuild after code changes
docker-compose up -d --build
```

## Database

The SQLite database is stored in a Docker volume for persistence. On first run, the database schema is automatically created.

### Backup Database

```bash
# Copy database from container
docker cp vitamins-tracker:/app/data/vitamins.db ./backup.db
```

### Restore Database

```bash
# Copy database to container
docker cp ./backup.db vitamins-tracker:/app/data/vitamins.db
docker restart vitamins-tracker
```

## Troubleshooting

### Container won't start
Check logs: `docker-compose logs vitamins`

### Database permission issues
The container runs as non-root user `nextjs`. Ensure the data volume has correct permissions.

### Port already in use
Change the port mapping in docker-compose.yml: `"3001:3000"`
