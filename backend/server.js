require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); // 🔥 Obligatoire pour traiter les requêtes JSON

// 🌟 Connexion à MySQL
const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    port: process.env.DATABASE_PORT,
    connectTimeout: 10000 // Timeout pour éviter que ça bloque
});

db.connect(err => {
    if (err) {
        console.error("❌ ERREUR de connexion MySQL :", err);
        return;
    }
    console.log("✅ Connecté à MySQL !");
});

// 🌟 Récupérer les scores
app.get('/scores', (req, res) => {
    db.query('SELECT * FROM leaderboard ORDER BY time ASC', (err, results) => {
        if (err) {
            console.error('❌ Erreur SQL :', err);
            return res.status(500).json({ error: 'Erreur serveur' });
        }
        console.log("📊 Scores récupérés :", results);
        res.json(results);
    });
});

// 🌟 Ajouter un score
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

// 🌟 Lancer le serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur en ligne sur le port ${PORT}`);
});
