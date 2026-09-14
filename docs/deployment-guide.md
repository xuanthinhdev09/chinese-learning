# Hướng dẫn triển khai VPS (HTTPS)

Kiến trúc: `nginx (80/443)` → static frontend + proxy `/api` → `backend:3000` → `postgres` (internal only).
Nguồn cấu hình: `docker/docker-compose.prod.yml`, `docker/nginx/default.conf`.

## Yêu cầu

- VPS (Ubuntu 22.04+), đã cài Docker + Docker Compose plugin
- Domain đã trỏ A record về IP của VPS
- Repo được clone vào VPS (vd `~/chinese-learning`)

## Bước 0 — Mở firewall

```bash
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw enable
```

## Bước 1 — Lấy certificate TRƯỚC khi chạy compose

Certbot standalone cần port 80 rảnh → chạy trước khi nginx container lên:

```bash
sudo apt install certbot
sudo certbot certonly --standalone -d <domain-cua-ban> \
  --agree-tos -m <email-ban> --no-eff-email
```

Copy cert vào nơi nginx mount (`docker/nginx/ssl`, đã có trong repo):

```bash
cd ~/chinese-learning
mkdir -p docker/nginx/ssl
sudo cp /etc/letsencrypt/live/<domain>/fullchain.pem docker/nginx/ssl/
sudo cp /etc/letsencrypt/live/<domain>/privkey.pem docker/nginx/ssl/
sudo chown $USER docker/nginx/ssl/*.pem
```

## Bước 2 — Cấu hình environment

```bash
cp docker/.env.example docker/.env
nano docker/.env
```

Bắt buộc đổi:
- `POSTGRES_PASSWORD` — mật khẩu mạnh
- `JWT_SECRET` — `openssl rand -base64 64`
- `AZURE_SPEECH_KEY` / `AZURE_SPEECH_REGION` — đã có key Azure thì điền, để trống = TTS fallback Web Speech

## Bước 3 — Chạy lần đầu

```bash
docker compose -f docker/docker-compose.prod.yml up -d --build
```

Backend entrypoint tự chạy `prisma migrate deploy`. Kiểm tra:

```bash
curl -k https://<domain>/health        # qua nginx → backend
docker compose -f docker/docker-compose.prod.yml ps   # cả 3 healthy
```

## Bước 4 — Nạp nội dung (DB prod bắt đầu trống)

Chọn 1 trong 2:

**Cách A — restore từ DB dev (giữ nguyên user + progress):**

```bash
# trên máy dev:
docker exec chinese_learning_postgres pg_dump -U chinese_admin chinese_learning > dump.sql
# copy dump.sql lên VPS rồi:
docker exec -i chinese_learning_postgres_prod \
  psql -U chinese_admin -d chinese_learning < dump.sql
```

**Cách B — import sách mới (chỉ có content, không có user):**

```bash
# 1. copy 15 file import lên VPS (từ máy dev):
rsync -av content-source/extracted/import/ user@<vps>:~/content-data/
# 2. trên VPS: chạy importer qua container tạm trên cùng network với postgres
#    (tên network xem bằng: docker network ls | grep chinese_learning)
for f in ~/content-data/lesson-*.import.json; do
  docker run --rm --network docker_chinese_learning_network \
    -v ~/chinese-learning/backend:/app -w /app -v ~/content-data:/data:ro \
    node:22-alpine sh -c "npm ci && npx prisma generate && \
    DATABASE_URL='postgresql://<user>:<pass>@postgres:5432/<db>' \
    npx tsx src/scripts/import-textbook-v2.ts /data/$(basename $f)"
done
```

> Cách A đơn giản và đầy đủ hơn — khuyến nghị.

## Bước 5 — Gia hạn certificate

Standalone certbot cần nginx nhường port 80 lúc gia hạn. Đăng ký hẹn gia hạn với hook:

```bash
sudo certbot renew --dry-run   # test trước
sudo crontab -e
# thêm dòng:
# 0 3 * * * certbot renew --pre-hook "cd ~/chinese-learning && docker compose -f docker/docker-compose.prod.yml stop nginx" --post-hook "cd ~/chinese-learning && docker compose -f docker/docker-compose.prod.yml start nginx" --deploy-hook "cp /etc/letsencrypt/live/<domain>/*.pem ~/chinese-learning/docker/nginx/ssl/ && cd ~/chinese-learning && docker compose -f docker/docker-compose.prod.yml restart nginx"
```

## Bước 6 — Backup định kỳ (progress học là dữ liệu duy nhất)

```bash
crontab -e
# 2h sáng hằng ngày, giữ 14 bản:
# 0 2 * * * docker exec chinese_learning_postgres_prod pg_dump -U chinese_admin chinese_learning | gzip > ~/backups/hsk2-$(date +\%Y\%m\%d).sql.gz && find ~/backups -name "*.sql.gz" -mtime +14 -delete
```

## Cập nhật app khi có code mới

```bash
cd ~/chinese-learning && git pull origin main
docker compose -f docker/docker-compose.prod.yml up -d --build
```

Migrations tự chạy lại khi backend start (`prisma migrate deploy`).

## Sự cố thường gặp

| Triệu chứng | Nguyên nhân / cách xử lý |
|---|---|
| Nginx không start, lỗi ssl certificate | Chưa copy cert vào `docker/nginx/ssl` — làm Bước 1 |
| Login xong bị văng ra | Truy cập bằng HTTP hoặc cert lệch domain — phải vào qua `https://<domain>` đúng cert |
| TTS mất giọng Azure | Volume `tts_cache` lỗi ghi — check `docker logs chinese_learning_backend_prod`; app tự fallback Web Speech |
| Quên mật khẩu DB/JWT | Sửa `docker/.env` rồi `docker compose up -d` lại (JWT_SECRET đổi → phải đăng nhập lại) |
