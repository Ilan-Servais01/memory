require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); // 🔥 Obligatoire pour traiter les requêtes JSON

// 📌 Connexion à MySQL
const db = mysql.createConnection(process.env.DATABASE_URL);

db.connect(err => {
    if (err) {
        console.error("❌ ERREUR de connexion MySQL :", err);
        return;
    }
    console.log("✅ Connecté à MySQL !");
});

db.query("SHOW TABLES;", (err, results) => {
    if (err) {
        console.error("❌ ERREUR MySQL lors de la vérification des tables :", err);
    } else {
        console.log("📂 Tables présentes dans MySQL :", results);
    }
});

// 📌 Récupérer les scores
app.get('/scores', (req, res) => {
    console.log("🔍 Nouvelle requête GET /scores reçue !");
    db.query('SELECT * FROM leaderboard ORDER BY time ASC', (err, results) => {
        if (err) {
            console.error('❌ Erreur SQL :', err);
            return res.status(500).json({ error: 'Erreur serveur' });
        }
        console.log("✅ Scores récupérés avec succès :", results);
        res.json(results);
    });
});

// 📌 Ajouter un score
app.post('/scores', (req, res) => {
    const { playerName, time, numPairs } = req.body;
    if (!playerName || !time || !numPairs) {
        return res.status(400).json({ error: 'Données invalides' });
    }
    db.query(
        'INSERT INTO leaderboard (playerName, time, numPairs) VALUES (?, ?, ?)',
        [playerName, time, numPairs], 
        (err, result) => {
            if (err) {
                console.error('❌ Erreur SQL :', err);
                return res.status(500).json({ error: 'Erreur serveur' });
            }
            console.log(`✅ Score ajouté : ${playerName}, Temps: ${time}, Paires: ${numPairs}`);
            res.json({ success: true, id: result.insertId });
        }
    );
});

// 📌 Lancer le serveur avec le bon binding + timeout
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur en ligne sur le port ${PORT}`);
});

// 🔥 Fix du problème Render 502 Bad Gateway
server.keepAliveTimeout = 120000;  // 120 secondes
server.headersTimeout = 120000;    // 120 secondes
