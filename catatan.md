# Docker Commands Reference

## Perintah Dasar Docker

### Container Management
```bash
# Menjalankan container
docker run <image_name>

# Menjalankan container di background (detached mode)
docker run -d <image_name>

# Menjalankan container dengan mapping port
docker run -p <host_port>:<container_port> <image_name>

# Menjalankan container dengan volume
docker run -v <host_path>:<container_path> <image_name>

# Menjalankan container dengan nama
docker run --name <container_name> <image_name>

# Contoh lengkap
docker run -d -p 3000:3000 -v $(pwd):/app --name my-app node:20-alpine
```

### Melihat Container
```bash
# List container yang sedang berjalan
docker ps

# List semua container (termasuk yang stopped)
docker ps -a

# Melihat detail container
docker inspect <container_id|container_name>
```

### Menghentikan Container
```bash
# Menghentikan container
docker stop <container_id|container_name>

# Menghentikan container dengan paksa
docker kill <container_id|container_name>

# Menghapus container
docker rm <container_id|container_name>

# Menghapus semua container yang stopped
docker container prune
```

### Exec dan Logs
```bash
# Melihat logs container
docker logs <container_id|container_name>

# Melihat logs secara real-time
docker logs -f <container_id|container_name>

# Masuk ke dalam container (interactive shell)
docker exec -it <container_id|container_name> sh
docker exec -it <container_id|container_name> bash

# Menjalankan perintah di dalam container
docker exec <container_id|container_name> <command>
```

## Image Management

### Melihat Image
```bash
# List semua image
docker images
docker image ls

# Melihat detail image
docker inspect <image_id|image_name>
```

### Pull dan Build Image
```bash
# Download image dari Docker Hub
docker pull <image_name>:<tag>

# Build image dari Dockerfile
docker build -t <image_name>:<tag> .

# Build image dengan Dockerfile spesifik
docker build -f Dockerfile.dev -t <image_name>:<tag> .
```

### Menghapus Image
```bash
# Menghapus image
docker rmi <image_id|image_name>

# Menghapus semua image yang tidak digunakan
docker image prune

# Menghapus semua image (termasuk yang digunakan container)
docker image prune -a
```

### Tag dan Push
```bash
# Memberi tag pada image
docker tag <image_id> <username>/<repo>:<tag>

# Push image ke Docker Hub
docker push <username>/<repo>:<tag>

# Login ke Docker Hub
docker login
```

## Volume Management

```bash
# List semua volume
docker volume ls

# Membuat volume baru
docker volume create <volume_name>

# Melihat detail volume
docker volume inspect <volume_name>

# Menghapus volume
docker volume rm <volume_name>

# Menghapus semua volume yang tidak digunakan
docker volume prune
```

## Network Management

```bash
# List semua network
docker network ls

# Membuat network baru
docker network create <network_name>

# Menghubungkan container ke network
docker network connect <network_name> <container_name>

# Memutuskan container dari network
docker network disconnect <network_name> <container_name>

# Menghapus network
docker network rm <network_name>

# Menghapus semua network yang tidak digunakan
docker network prune
```

## Docker Compose

### Perintah Dasar
```bash
# Menjalankan services di background
docker compose up -d

# Menjalankan services di foreground
docker compose up

# Menjalankan dengan build ulang image
docker compose up --build

# Menjalankan services dengan nama tertentu
docker compose up <service_name> <service_name> --build

# Menghentikan services
docker compose down

# Menghentikan services dan hapus volumes
docker compose down -v

# Melihat status services
docker compose ps

# Melihat logs
docker compose logs
docker compose logs -f
docker compose logs <service_name>
```

### Development
```bash
# Menjalankan service spesifik
docker compose up <service_name>

# Rebuild service tertentu
docker compose build <service_name>

# Restart services
docker compose restart

# Stop services
docker compose stop

# Start services yang sudah di-stop
docker compose start
```

### Exec dan Shell
```bash
# Menjalankan perintah di service
docker compose exec <service_name> <command>

# Masuk ke shell di service
docker compose exec <service_name> sh
docker compose exec <service_name> bash

# Menjalankan dengan user tertentu
docker compose exec -u <user> <service_name> <command>
```

### Monitoring
```bash
# Melihat resource usage
docker compose top

# Melihat stats real-time
docker stats
```

## Cleanup dan Maintenance

```bash
# Menghapus semua yang tidak digunakan (system prune)
docker system prune

# Menghapus semua termasuk volumes
docker system prune -a --volumes

# Melihat penggunaan disk
docker system df

# Melihat informasi sistem Docker
docker info
```

## Contoh Penggunaan di Project Ini

```bash
# Build dan jalankan development environment
docker compose up --build

# Jalankan di background
docker compose up -d

# Lihat logs
docker compose logs -f

# Masuk ke container app
docker compose exec app sh

# Stop semua services
docker compose down

# Rebuild setelah perubahan Dockerfile
docker compose build --no-cache
docker compose up -d
```

## Tips

1. Gunakan `-d` untuk menjalankan container di background
2. Gunakan `--rm` untuk auto-remove container setelah berhenti
3. Gunakan `-it` untuk interactive terminal
4. Selalu beri nama container dengan `--name` untuk memudahkan management
5. Gunakan `.dockerignore` untuk mengurangi ukuran build context
6. Gunakan multi-stage build untuk production image yang lebih kecil
