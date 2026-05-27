# ControlStage (Realtime + Cloud)

Web PWA สำหรับควบคุมเวลารอบนมัสการ — ห้องควบคุมและจอ Stage sync กัน

- **Setup** — ตั้งโปรแกรม, เวลา `mm:ss`, ผู้ดำเนิน (เลือกจากรายการ), toggles สีเตือน/กระพริบ
- **Controller** (`/start/:eventId`) — ควบคุมเวลา, Next/Prev แล้วหยุดรอกด Start
- **Stage** (`/view/:eventId?kiosk=1`) — จอแสดงผล read-only, sync realtime

## Run

```bash
cd worship-timer
npm install
npm run dev
```

เปิด `http://localhost:5173/setup`

### Local Demo (ไม่ต้องมี Firebase)

กด **Start (Local Demo)** แล้วเปิด **Stage Display** ในแท็บ/จอที่สอง (sync ผ่าน BroadcastChannel)

### Cloud (Firebase)

1. สร้าง `.env.local` จาก `.env.example`
2. เปิด Firestore ใน Firebase Console
3. Deploy rules: `firestore.rules`
4. กด **Save to Cloud & Start** ในหน้า Setup

### Firebase Hosting (auto deploy จาก GitHub)

Push ไปที่ branch `master` จะ build และ deploy ไป Hosting อัตโนมัติ (workflow: `.github/workflows/firebase-hosting.yml`)

**ครั้งแรก — ตั้งค่าใน GitHub repo** (`witchayut-k/worship-timer` → Settings → Secrets and variables → Actions):

| Secret | ค่า |
|--------|-----|
| `FIREBASE_SERVICE_ACCOUNT` | JSON ของ service account (ดูด้านล่าง) |
| `VITE_FIREBASE_API_KEY` | ค่าเดียวกับ `.env.local` |
| `VITE_FIREBASE_AUTH_DOMAIN` | … |
| `VITE_FIREBASE_PROJECT_ID` | … |
| `VITE_FIREBASE_STORAGE_BUCKET` | … |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | … |
| `VITE_FIREBASE_APP_ID` | … |
| `VITE_PLAN_TIER` (แนะนำ) | `paid` สำหรับ production |

**สร้าง `FIREBASE_SERVICE_ACCOUNT`:**

1. [Firebase Console](https://console.firebase.google.com/) → โปรเจกต `sstimer-abdd7` → Project settings → Service accounts
2. Generate new private key → คัดลอกเนื้อหา JSON ทั้งไฟล์ไปใส่ secret `FIREBASE_SERVICE_ACCOUNT`
3. ใน [Google Cloud IAM](https://console.cloud.google.com/iam-admin/iam?project=sstimer-abdd7) ให้ account นั้นมี role **Firebase Hosting Admin** (หรือ Editor ชั่วคราวตอนตั้งค่า)

**ทดสอบ deploy บนเครื่อง:**

```bash
npm run build
npx firebase-tools@latest deploy --only hosting:controlstage
```

หลัง deploy สำเร็จ: **https://controlstage.web.app**

> ต้องมี Hosting site ชื่อ `controlstage` ในโปรเจกต `sstimer-abdd7` (Firebase Console → Hosting → Add another site) ถ้ายังไม่มี

## แยกจอ

| บทบาท | URL |
|--------|-----|
| Controller | `/start/{eventId}` |
| Stage | `/view/{eventId}?kiosk=1` |

ใช้ปุ่ม **Copy** / **เปิดจอเวที** ในหน้า Controller หรือการ์ดลิงก์ใน Setup
