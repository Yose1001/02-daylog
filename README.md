# 📋 DayLog — ระบบบันทึกข้อมูลส่วนตัว

โปรเจ็คเล็ก ๆ สำหรับ **เข้าสู่ระบบ → คีย์บันทึก (หัวข้อ/รายละเอียด/วันที่) → ดูประวัติย้อนหลัง**

| ส่วน | เทคโนโลยี |
|------|-----------|
| Frontend | React 18 + Vite (HTML/CSS) — รันด้วย Node.js |
| Backend | Python + FastAPI |
| Database | MongoDB |
| Auth | JWT + bcrypt |

```
02-daylog/
├── backend/          # Python FastAPI API
│   ├── main.py       # routes (auth + records)
│   ├── config.py     # อ่านค่าจาก .env
│   ├── database.py   # เชื่อมต่อ MongoDB
│   ├── security.py   # hash รหัสผ่าน + JWT
│   ├── models.py     # โครงสร้างข้อมูล (Pydantic)
│   └── requirements.txt
└── frontend/         # React + Vite
    └── src/
        ├── App.jsx
        ├── auth.jsx              # เก็บสถานะล็อกอิน
        ├── api.js                # axios + แนบ token
        └── components/
            ├── Login.jsx         # เข้าสู่ระบบ / สมัคร
            ├── RecordForm.jsx    # คีย์ข้อมูล
            └── History.jsx       # ประวัติย้อนหลัง
```

---

## 1) เตรียม MongoDB (เลือก 1 วิธี)

> เครื่องนี้ยังไม่มี MongoDB ติดตั้ง — เลือกวิธีใดวิธีหนึ่งด้านล่าง

**วิธี A — MongoDB Atlas (คลาวด์ ฟรี ไม่ต้องติดตั้ง) ✅ แนะนำสำหรับเริ่มต้น**
1. สมัครที่ https://www.mongodb.com/cloud/atlas แล้วสร้าง Cluster ฟรี (M0)
2. สร้าง Database User + อนุญาต IP (`0.0.0.0/0` สำหรับทดสอบ)
3. กด **Connect → Drivers** คัดลอก connection string มาใส่ใน `backend/.env`
   เช่น `MONGODB_URL=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net`

**วิธี B — Homebrew (ติดตั้งบนเครื่อง macOS)**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community   # เปิดทิ้งไว้เป็น service
```

**วิธี C — Docker**
```bash
docker run -d -p 27017:27017 --name mongo mongo:7
```

วิธี B และ C ใช้ค่า default ได้เลย: `MONGODB_URL=mongodb://localhost:27017`

---

## 2) รัน Backend (Python / FastAPI)

เปิด Terminal หน้าต่างที่ 1:
```bash
cd backend

# สร้าง virtual environment
python3 -m venv .venv
source .venv/bin/activate

# ติดตั้งไลบรารี
pip install -r requirements.txt

# ตั้งค่า environment
cp .env.example .env
# 👉 แก้ค่า MONGODB_URL และ SECRET_KEY ในไฟล์ .env

# รันเซิร์ฟเวอร์ (พอร์ต 8000)
uvicorn main:app --reload --port 8000
```
ทดสอบ: เปิด http://localhost:8000/docs (Swagger UI) — ลองยิง API ได้เลย

---

## 3) รัน Frontend (React / Vite)

เปิด Terminal หน้าต่างที่ 2:
```bash
cd frontend

npm install
npm run dev
```
เปิดเว็บ: **http://localhost:3000**

> Vite จะ proxy ทุก request ที่ขึ้นต้นด้วย `/api` ไปยัง backend (`:8000`) ให้อัตโนมัติ
> ดังนั้นในโหมด dev ไม่ต้องตั้งค่าอะไรเพิ่ม

---

## 4) วิธีใช้งาน

1. หน้าแรก → **สมัครสมาชิก** (ชื่อผู้ใช้ ≥ 3 ตัว, รหัสผ่าน ≥ 6 ตัว)
2. แท็บ **✏️ บันทึกใหม่** → กรอกหัวข้อ / วันที่ / รายละเอียด → กดบันทึก
3. แท็บ **🕘 ประวัติย้อนหลัง** → ดูรายการทั้งหมด (ใหม่สุดอยู่บน) กด **แก้ไข** เพื่อปรับข้อมูลในรายการเดิม หรือ **ลบ** ได้

---

## API Endpoints

| Method | Path | คำอธิบาย | ต้องล็อกอิน |
|--------|------|----------|:---:|
| POST | `/api/auth/register` | สมัครสมาชิก → ได้ token | – |
| POST | `/api/auth/login` | เข้าสู่ระบบ → ได้ token | – |
| GET | `/api/auth/me` | ข้อมูลผู้ใช้ปัจจุบัน | ✅ |
| POST | `/api/records` | เพิ่มบันทึกใหม่ | ✅ |
| GET | `/api/records` | ดูประวัติทั้งหมด (ของตัวเอง) | ✅ |
| PUT | `/api/records/{id}` | แก้ไขบันทึก | ✅ |
| DELETE | `/api/records/{id}` | ลบบันทึก | ✅ |

---

## หมายเหตุด้านความปลอดภัย (สำหรับขึ้น production จริง)
- เปลี่ยน `SECRET_KEY` เป็นค่าสุ่มยาว ๆ และอย่า commit ไฟล์ `.env`
- โปรเจ็คนี้เก็บ JWT ไว้ใน `localStorage` เพื่อความง่ายในการเรียนรู้ — งานจริงควรพิจารณา httpOnly cookie
- จำกัด `CORS_ORIGINS` ให้เหลือเฉพาะโดเมนจริง

---

## 🚀 Deployment (Docker + MongoDB Atlas)

Deploy ทั้งระบบด้วย Docker: `frontend` (nginx เสิร์ฟ React build + reverse-proxy `/api`) คุยกับ `backend` (FastAPI) ภายใน network เดียวกัน ฐานข้อมูลใช้ **MongoDB Atlas** (คลาวด์) — ไม่ต้องรัน MongoDB เอง

```
[Browser] → frontend (nginx :8080) ── /api/* ──▶ backend (uvicorn :8000) ──▶ MongoDB Atlas
                   └── /  (React static build)
```

> เพราะ frontend เรียก `/api` แบบ same-origin ผ่าน nginx จึง **ไม่ต้องตั้งค่า CORS**
> และ `backend` ไม่เปิดพอร์ตออกสู่ภายนอก (เข้าได้ผ่าน nginx เท่านั้น)

**ต้องมี:** Docker + Docker Compose v2 (เช่น Docker Desktop) บนเครื่อง/เซิร์ฟเวอร์ปลายทาง

### 1) เตรียม MongoDB Atlas
1. สร้าง Cluster ฟรี (M0) + Database User (ดูหัวข้อ *เตรียม MongoDB* ด้านบน)
2. **Network Access** → อนุญาต IP ของเซิร์ฟเวอร์ที่จะรัน (หรือ `0.0.0.0/0` สำหรับทดสอบ)
3. **Connect → Drivers** คัดลอก connection string (`mongodb+srv://...`)

### 2) ตั้งค่า environment
```bash
cp .env.example .env
```
แก้ไฟล์ `.env`:
- `MONGODB_URL` = connection string จาก Atlas
- `SECRET_KEY` = สร้างด้วย `python3 -c "import secrets; print(secrets.token_hex(32))"`

### 3) Build & Run
```bash
docker compose up -d --build
```
เปิดเว็บ: **http://localhost:8080** (หรือ `http://<server-ip>:8080`)

### คำสั่งที่ใช้บ่อย
```bash
docker compose logs -f          # ดู log แบบเรียลไทม์
docker compose ps               # สถานะ container
docker compose up -d --build    # อัปเดตหลังแก้โค้ด
docker compose down             # หยุดและลบ container
```

### ขึ้น production จริง
- ควรมี **HTTPS** — วาง reverse proxy (Caddy / Traefik / Cloudflare Tunnel) ไว้หน้าพอร์ต `8080` หรือผูกโดเมน + ใบรับรอง TLS
- ตั้ง `WEB_PORT=80` ใน `.env` ถ้าต้องการเสิร์ฟที่พอร์ตมาตรฐาน
- เก็บไฟล์ `.env` ให้ปลอดภัย อย่า commit (ถูก ignore ไว้แล้ว)
