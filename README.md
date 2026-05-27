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

## แยกจอ

| บทบาท | URL |
|--------|-----|
| Controller | `/start/{eventId}` |
| Stage | `/view/{eventId}?kiosk=1` |

ใช้ปุ่ม **Copy** / **เปิดจอเวที** ในหน้า Controller หรือการ์ดลิงก์ใน Setup
