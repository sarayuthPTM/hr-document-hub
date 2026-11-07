# 📁 ระบบรวบรวมเอกสารงานบุคคล (KBS HR Document Hub)
### โรงเรียนกาญจนาภิเษกวิทยาลัย กระบี่ | กลุ่มบริหารงานบุคคล

ระบบรวบรวมและสืบค้นเอกสาร แบบฟอร์ม คำสั่ง และแนวปฏิบัติงานบุคคล ดีไซน์สวยงาม ทันสมัย สไตล์ Glassmorphism รองรับการใช้งานทั้งบนคอมพิวเตอร์ แท็บเล็ต และสมาร์ตโฟน พร้อมระบบหลังบ้านผู้ดูแลระบบ (Admin Portal) ในการเพิ่ม แก้ไข ลบ ปักหมุดเอกสาร และเชื่อมต่อฐานข้อมูล **Google Sheets** และ **Google Drive Folder**

---

## 🌟 จุดเด่นและความสามารถของระบบ

1. **สืบค้นและดาวน์โหลดเอกสารสะดวกรวดเร็ว (User Portal)**:
   - 🔍 ค้นหาเอกสารแบบ Real-time ตามชื่อเอกสาร, เลขที่/รหัสแบบฟอร์ม, หมวดหมู่ และแท็กคำค้นหา
   - 📑 กรองเอกสารตามหมวดหมู่ (แบบฟอร์มใบลา, PA, เงินเดือน/วิทยฐานะ, คำสั่ง, สวัสดิการ, สัญญาจ้าง, คู่มือ)
   - 📅 กรองตามปี พ.ศ. / ปีการศึกษา และกลุ่มเป้าหมาย (ข้าราชการครู, บุคลากร, ลูกจ้าง)
   - 👁️ **Document Preview Modal**: ดูตัวอย่างเอกสารผ่านหน้าเว็บได้ทันที รองรับทั้ง PDF และไฟล์ Google Drive
   - 📱 **QR Code Generator**: สร้าง QR Code ให้ครูและบุคลากรสแกนผ่านมือถือหรือ LINE เพื่อดาวน์โหลดไฟล์ได้ทันที
   - 📊 **สถิติการใช้งาน**: นับยอดเปิดดู (Views) และยอดดาวน์โหลด (Downloads) อัตโนมัติ
   - 🌓 **โหมดมืด/สว่าง (Dark / Light Mode)** ปรับตามความสบายตา

2. **ระบบจัดการหลังบ้านแอดมิน (Admin Portal)**:
   - 🔒 ล็อกอินด้วยรหัสผ่านแอดมิน (PIN) (รหัสตั้งต้น: `admin1234` ปรับเปลี่ยนได้ในการตั้งค่า)
   - 📤 **อัปโหลดไฟล์ตรงเข้า Google Drive**: ลากไฟล์มาวาง (Drag & Drop) ระบบจะอัปโหลดไปยัง Google Drive โฟลเดอร์ `1mKdJUgQ9iEnVsJw-DeWV_NRnkAQsBsAt` และบันทึกลง Google Sheet อัตโนมัติ
   - 🔗 **เพิ่มเอกสารจากลิงก์ภายนอก**: ใส่ลิงก์ Google Drive หรือ URL ไฟล์ได้โดยตรง
   - ✏️ **แก้ไขและลบเอกสาร**: ปรับปรุงชื่อ หมวดหมู่ เลขที่เอกสาร หรือลบรายการได้ทันที
   - ⭐ **ระบบปักหมุด (Pin to Top)**: นำเอกสารสำคัญหรือแบบฟอร์มยอดนิยมขึ้นแสดงเป็นอันดับแรก
   - 📥 **ส่งออกข้อมูลสำรอง (Export Excel)**: ส่งออกรายการเอกสารทั้งหมดเป็นไฟล์ `.xlsx` ได้ด้วยคลิกเดียว
   - ⚡ **สร้างโครงสร้างตารางอัตโนมัติ (Initialize Sheet)**: มีปุ่มสร้าง Header และจัดรูปแบบตารางลงใน Google Sheet ว่างให้อัตโนมัติในคลิกเดียว

---

## 🔗 แหล่งข้อมูลที่เชื่อมต่อ

- **Google Sheets (ฐานข้อมูล)**:  
  [https://docs.google.com/spreadsheets/d/1i_1vctvE4Si6ylObH24ipOyTz2uSY6kXMKGNpd2N5WY](https://docs.google.com/spreadsheets/d/1i_1vctvE4Si6ylObH24ipOyTz2uSY6kXMKGNpd2N5WY)  
  *(Sheet ID: `1i_1vctvE4Si6ylObH24ipOyTz2uSY6kXMKGNpd2N5WY`)*
- **Google Drive Folder (คลังไฟล์เอกสาร)**:  
  [https://drive.google.com/drive/folders/1mKdJUgQ9iEnVsJw-DeWV_NRnkAQsBsAt](https://drive.google.com/drive/folders/1mKdJUgQ9iEnVsJw-DeWV_NRnkAQsBsAt)  
  *(Folder ID: `1mKdJUgQ9iEnVsJw-DeWV_NRnkAQsBsAt`)*

---

## 🚀 วิธีการ Push ขึ้น GitHub และ Deploy บน Vercel

### ขั้นตอนที่ 1: Push โค้ดขึ้น GitHub
1. สร้าง New Repository บน [GitHub.com](https://github.com) (เช่น ตั้งชื่อว่า `hr-document-hub`)
2. เปิด Terminal ในโฟลเดอร์นี้ แล้วรันคำสั่ง:
   ```bash
   git remote add origin https://github.com/<YOUR-GITHUB-USERNAME>/hr-document-hub.git
   git push -u origin main
   ```

### ขั้นตอนที่ 2: Deploy บน Vercel
1. เข้าสู่ระบบที่ [Vercel.com](https://vercel.com)
2. กดปุ่ม **"Add New..."** > **"Project"**
3. เลือก Repository `hr-document-hub` ที่เพิ่ง Push ขึ้นไป
4. Vercel จะตั้งค่า Framework Preset เป็น **Vite** ให้อัตโนมัติ:
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. กดปุ่ม **Deploy** ระบบจะเริ่ม Build และได้ URL เว็บไซต์พร้อมใช้งานทันที (เช่น `https://hr-document-hub.vercel.app`)

---

## ⚙️ วิธีติดตั้ง Google Apps Script Backend (เชื่อมต่อ Google Sheet & Drive)

เพื่อให้ระบบเว็บสามารถอ่าน-เขียนข้อมูลลง Google Sheets และอัปโหลดไฟล์เข้า Google Drive ได้สดๆ:

1. เปิด [Google Sheets ของคุณ](https://docs.google.com/spreadsheets/d/1i_1vctvE4Si6ylObH24ipOyTz2uSY6kXMKGNpd2N5WY)
2. ไปที่เมนู **ส่วนขยาย (Extensions)** > **Apps Script**
3. ลบโค้ดเดิมออกทั้งหมด แล้วคัดลอกโค้ดจากไฟล์ `google-apps-script/Code.gs` ไปวาง
4. กดปุ่ม **ทำให้ใช้งานได้ (Deploy)** ที่มุมขวาบน > เลือก **รายการทำให้ใช้งานได้ใหม่ (New deployment)**
5. เลือกประเภทการทำให้ใช้งานได้: **เว็บแอป (Web app)**
6. กำหนดค่า:
   - **คำอธิบาย (Description)**: `HR Document Hub API v1`
   - **ดำเนินการในฐานะ (Execute as)**: `ฉัน (อีเมลของคุณ)`
   - **ผู้มีสิทธิ์เข้าถึง (Who has access)**: `ทุกคน (Anyone)` *(สำคัญ เพื่อให้ระบบเว็บสามารถส่งข้อมูลเข้าได้)*
7. กด **ทำให้ใช้งานได้ (Deploy)** และกดยืนยันการอนุญาตสิทธิ์ (Authorize access)
8. คัดลอก **URL เว็บแอป (Web App URL)** ที่ลงท้ายด้วย `/exec`
9. เข้าสู่หน้าเว็บของคุณ > เข้าสู่ระบบแอดมิน > กดปุ่ม **ฟันเฟือง (ตั้งค่าระบบ)** > วาง URL ลงในช่อง **Google Apps Script Web App URL** แล้วกด **บันทึกการตั้งค่า**
10. กดปุ่ม **"สร้างตารางใน Sheet อัตโนมัติ"** ครั้งเดียว เพื่อให้ระบบสร้างคอลัมน์และข้อมูลเริ่มต้นลง Google Sheet ทันที!

---

## 💻 การทดสอบและรันในเครื่อง (Local Development)

```bash
# ติดตั้งไลบรารี
npm install

# รันโหมด Development (ทดสอบในเครื่อง)
npm run dev

# ทดสอบ Build โค้ด Production
npm run build
```

---
*พัฒนาโดย กลุ่มบริหารงานบุคคล โรงเรียนกาญจนาภิเษกวิทยาลัย กระบี่*
