import express from "express";
import multer from "multer";
import cors from "cors";
import { google } from "googleapis";
import fs from "fs";

const app = express();
app.use(cors());

const upload = multer({ dest: "uploads/" });

// GOOGLE DRIVE AUTH
const auth = new google.auth.GoogleAuth({
  credentials: {
    type: "service_account",
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
  },
  scopes: ["https://www.googleapis.com/auth/drive.file"],
});

const drive = google.drive({ version: "v3", auth });

// UPLOAD PARA O DRIVE
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;

    const response = await drive.files.create({
      requestBody: {
        name: req.file.originalname,
        parents: [process.env.GOOGLE_FOLDER_ID], // <- ID da pasta no Drive
      },
      media: {
        mimeType: "application/pdf",
        body: fs.createReadStream(filePath),
      },
      fields: "id, name, webViewLink",
    });

    // remove arquivo temporário
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      file: response.data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error });
  }
});

app.listen(3000, () => {
  console.log("Servidor ativo! Porta 3000");
});
