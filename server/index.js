// server/index.js: select everything (Ctrl+A), delete, paste this whole file, save
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdfParse = require("pdf-parse");

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  if (req.file.mimetype !== "application/pdf") {
    return res.status(400).json({ error: "Only PDF files are allowed" });
  }

  try {
    const pages = [];
    await pdfParse(req.file.buffer, {
      pagerender: async (pageData) => {
        const content = await pageData.getTextContent();
        const text = content.items.map((item) => item.str).join(" ");
        pages.push(text);
        return text;
      },
    });

    res.json({
      name: req.file.originalname,
      pageCount: pages.length,
      firstPagePreview: (pages[0] || "").slice(0, 300),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not read this PDF" });
  }
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
