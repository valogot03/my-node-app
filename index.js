// เรียกใช้ express
const express = require('express');
const app = express();

// สร้าง route หลัก
app.get('/', (req, res) => {
  res.send('Hello from Node.js!');
});

// ตั้งค่าพอร์ต
const port = process.env.PORT || 3000;

// เริ่มเซิร์ฟเวอร์
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
