# Finny - AI PDF Form Assistant 🦊

## 📋 API-Keys konfigurieren

### Wo trage ich meine API-Keys ein?

**Option 1: .env Datei (Empfohlen)**

1. Öffne die Datei `.env` im Projekthauptverzeichnis
2. Trage deine API-Keys ein:

```env
VITE_PDFCO_API_KEY=dein_pdfco_key_hier
VITE_COMET_API_KEY=dein_comet_api_key_hier
VITE_COMET_MODEL=gemini-2.5-pro
```

3. Speichern und Server neu starten:
```bash
npm run dev
```

**Option 2: Direkt im Code (fallback)**

Falls `.env` nicht funktioniert:

**Für PDF.co:**
- Datei: `src/services/pdfcoService.js`
- Zeile 6: `const API_KEY = 'DEIN_KEY_HIER';`

**Für CometAPI (Gemini):**
- Datei: `src/services/aiService.js`
- Zeile 6: `const API_KEY = 'DEIN_KEY_HIER';`
- Zeile 8: `const MODEL = 'gemini-2.5-pro';`

---

## 🚀 Projekt lokal starten

```bash
# Dependencies installieren
npm install

# Development Server starten
npm run dev
```

Die App läuft dann unter: **http://localhost:5173**

**Wichtig:** Du musst NICHTS manuell im CMD starten - `npm run dev` startet alles automatisch!

---

## 🐛 Debugging & Console Logs

Die App zeigt umfangreiche Console-Logs:
- 📤 PDF Upload Status
- 🔍 Feldextraktion mit vollständiger Response
- 🤖 KI-Chat Anfragen und Antworten
- ✅ Erfolgreiche Operationen
- ❌ Detaillierte Fehler

**Öffne die Browser-Konsole (F12) um diese zu sehen!**

---

## 💾 Fortschritt speichern - So funktioniert's

### Automatisches Speichern

Die App speichert deinen Fortschritt **automatisch** im Browser (localStorage):
- Bei jedem ausgefüllten Feld
- Nach jeder Chat-Nachricht
- Du musst NICHTS manuell speichern!

### Gespeicherte Sitzungen anzeigen

1. Melde dich an (Max / 12345)
2. Gehe zum Mitgliederbereich
3. Siehe alle gespeicherten Sitzungen mit:
   - PDF-Dateiname
   - Fortschritt (ausgefüllte Felder)
   - Speicherzeitpunkt

### Sitzung fortsetzen

1. Im Mitgliederbereich
2. Klicke auf "Fortsetzen" bei einer Sitzung
3. Du bist genau dort wo du aufgehört hast!

### Technische Details (localStorage)

Gespeichert wird:
- PDF-URL und Dateiname
- Alle Formularfelder
- Ausgefüllte Werte
- Chat-Verlauf
- Zeitstempel

**Speicherort:** Browser localStorage (lokal, nicht auf Server)

---

## 🌐 Online Deployment (z.B. auf Render)

### Schritt 1: Projekt vorbereiten

1. **Git Repository erstellen:**
```bash
git init
git add .
git commit -m "Initial commit"
```

2. **Push zu GitHub/GitLab:**
```bash
git remote add origin https://github.com/dein-username/finny.git
git push -u origin main
```

### Schritt 2: Auf Render deployen

1. Gehe zu [render.com](https://render.com) und registriere dich
2. Klicke auf "New +" → "Static Site"
3. Verbinde dein GitHub/GitLab Repository
4. Konfiguriere:
   - **Name:** finny-pdf-assistant
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`

### Schritt 3: Umgebungsvariablen setzen

Im Render Dashboard unter "Environment":

```
VITE_PDFCO_API_KEY = dein_pdfco_key
VITE_COMET_API_KEY = dein_comet_key
VITE_COMET_MODEL = gemini-2.5-pro
```

### Schritt 4: Deploy starten

- Klicke auf "Create Static Site"
- Render baut und deployt automatisch
- Nach 2-3 Minuten ist deine App online!
- URL: `https://finny-pdf-assistant.onrender.com`

### Wichtig für localStorage bei Deployment:

**Problem:** localStorage funktioniert nur im gleichen Browser auf dem gleichen Gerät.

**Lösung für echte Datenbank (optional):**

Wenn du Sitzungen über Geräte hinweg speichern willst:

1. **Backend hinzufügen** (z.B. Node.js / Express)
2. **Datenbank nutzen** (z.B. MongoDB Atlas kostenlos)
3. **API Endpoints erstellen:**
   - `POST /api/sessions` - Sitzung speichern
   - `GET /api/sessions/:userId` - Sitzungen laden
   - `DELETE /api/sessions/:id` - Sitzung löschen

**Beispiel MongoDB Atlas Setup:**
```bash
# Backend erstellen
mkdir api
cd api
npm init -y
npm install express mongoose cors dotenv

# In api/server.js:
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI);

// Session Model
const Session = mongoose.model('Session', {
  userId: String,
  sessionId: String,
  pdfUrl: String,
  pdfFileName: String,
  fields: Array,
  filledFields: Object,
  messages: Array,
  savedAt: Date
});

// Routes
app.post('/api/sessions', async (req, res) => {
  const session = new Session(req.body);
  await session.save();
  res.json(session);
});

app.get('/api/sessions/:userId', async (req, res) => {
  const sessions = await Session.find({ userId: req.params.userId });
  res.json(sessions);
});

app.listen(3000);
```

Dann deploye Backend separat auf Render (als "Web Service").

---

## 📝 Schnellstart-Checkliste

- [ ] Node.js installiert (v18+)
- [ ] `npm install` ausgeführt
- [ ] API-Keys in `.env` eingetragen
- [ ] `npm run dev` gestartet
- [ ] Browser-Konsole geöffnet (F12)
- [ ] Unter http://localhost:5173 testen

---

## ❓ Häufige Probleme

**"Chat lädt nicht"**
→ Prüfe Browser-Konsole auf Fehler
→ Überprüfe CometAPI Key in `.env`

**"Felder werden nicht extrahiert"**
→ Prüfe pdf.co API Key
→ Schaue in Console nach API-Response

**"Demo funktioniert nicht"**
→ Klicke "Demo starten" auf der Startseite
→ Demo benötigt KEINE API-Keys

**"Sidebar bleibt leer"**
→ Warte bis PDF-Upload + Extraktion fertig
→ Console zeigt "✅ Extracted X fields"

---

## 🎯 Zusammenfassung

- **Lokal:** Alles läuft automatisch nach `npm run dev`
- **APIs:** In `.env` konfigurieren, Server neu starten
- **Speichern:** Automatisch im Browser (localStorage)
- **Online:** Git → Render → Umgebungsvariablen → Deploy
- **Echte DB:** Optional MongoDB für Cross-Device Sync

Viel Erfolg! 🚀
