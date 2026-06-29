# CMSK Store

เว็บไซต์ขายของ + ระบบหลังบ้าน ออกแบบตามหลัก **UI/UX Pro Max** (Modern Minimalism)

## คุณสมบัติ

**หน้าร้าน** (`/`)
- Hero section แบบสไลด์ — เปลี่ยนหน้าได้ (ปุ่มซ้าย/ขวา, จุดบอกตำแหน่ง, เลื่อนอัตโนมัติ)
- กริดสินค้า + กรองตามหมวดหมู่
- หน้ารายละเอียดสินค้า (คลิกการ์ดเพื่อดูรายละเอียด)
- ตะกร้าสินค้า (เดโม) + toast แจ้งเตือน

**ระบบหลังบ้าน** (`/admin.html`)
- เพิ่ม / ลบ สินค้า พร้อมตัวอย่างรูป และตรวจสอบฟอร์ม
- เพิ่ม / ลบ สไลด์ Hero section
- สถิติแบบเรียลไทม์ + กล่องยืนยันก่อนลบ

ข้อมูลทั้งหมดอัปเดตทันทีบนหน้าร้านเมื่อแก้ในระบบหลังบ้าน

## การติดตั้งและรัน

```bash
npm install
npm start
```

จากนั้นเปิด:
- หน้าร้าน: http://localhost:3000/
- ระบบหลังบ้าน: http://localhost:3000/admin.html

> โหมดพัฒนา (auto-reload): `npm run dev`

## โครงสร้าง

```
server.js            Express + REST API (อ่าน/เขียนไฟล์ JSON)
data/products.json   ข้อมูลสินค้า
data/hero.json       ข้อมูลสไลด์ Hero
public/
  index.html         หน้าร้าน
  admin.html         ระบบหลังบ้าน
  css/styles.css     design tokens + สไตล์หน้าร้าน
  css/admin.css      สไตล์ระบบหลังบ้าน
  js/store.js        ลอจิกหน้าร้าน
  js/admin.js        ลอจิกระบบหลังบ้าน
```

## API

| Method | Endpoint | คำอธิบาย |
|--------|----------|----------|
| GET | `/api/products` | รายการสินค้าทั้งหมด |
| GET | `/api/products/:id` | สินค้ารายตัว |
| POST | `/api/products` | เพิ่มสินค้า (`name`, `price` จำเป็น) |
| PUT | `/api/products/:id` | แก้ไขสินค้า |
| DELETE | `/api/products/:id` | ลบสินค้า |
| GET | `/api/hero` | สไลด์ Hero ทั้งหมด |
| POST | `/api/hero` | เพิ่มสไลด์ (`title` จำเป็น) |
| DELETE | `/api/hero/:id` | ลบสไลด์ |

## Deploy บน Netlify

โปรเจกต์รองรับ Netlify โดยตรง (ไม่ต้องตั้งค่าอะไรเพิ่ม):

- `netlify.toml` ตั้ง publish directory เป็น `public/`
- API (`/api/*`) ทำงานเป็น **Netlify Functions** (`netlify/functions/`)
- ข้อมูลสินค้า/สไลด์เก็บถาวรด้วย **Netlify Blobs** (เพิ่ม/ลบแล้วคงอยู่ข้าม deploy)

ขั้นตอน: เชื่อม repo นี้กับ Netlify → Deploy ได้เลย (Build command เว้นว่าง, Publish = `public`)
ครั้งแรกที่เปิด ระบบจะ seed ข้อมูลตัวอย่างให้อัตโนมัติ

> รัน local ด้วย `npm start` ยังใช้ Express + ไฟล์ JSON เหมือนเดิม
> ทดสอบ Functions แบบ local: `npx netlify dev`

## หมายเหตุ

- Local เก็บข้อมูลในไฟล์ JSON / บน Netlify เก็บใน Blobs (ไม่ต้องตั้งค่าฐานข้อมูล)
- ระบบหลังบ้านยังไม่มีระบบล็อกอิน — ควรเพิ่มการยืนยันตัวตนก่อนใช้งานจริงบนอินเทอร์เน็ต
- รูปสินค้า/สไลด์ใช้การวางลิงก์ URL — ขยายเป็นอัปโหลดไฟล์ได้ภายหลัง
```
