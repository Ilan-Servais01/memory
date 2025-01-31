require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); // 🔥 Obligatoire pour traiter les requêtes JSON

app.post("/scores", async (req, res) => {
    const { playerName, time, numPairs } = req.body;

    if (!playerName || !time || !numPairs) {
        return res.status(400).json({ error: "Données manquantes" });
    }

    try {
        const sql = "INSERT INTO leaderboard (playerName, time, numPairs) VALUES (?, ?, ?)";
        await db.query(sql, [playerName, time, numPairs]);
        res.status(201).json({ message: "Score ajouté !" });
    } catch (error) {
        console.error("Erreur SQL :", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});


// Récupérer les scores
app.get('/scores', (req, res) => {
    db.query('SELECT * FROM leaderboard ORDER BY time ASC', (err, results) => {
        if (err) {
            console.error('Erreur :', err);
            return res.status(500).json({ error: 'Erreur serveur' });
        }
        res.json(results);
    });
});

// Ajouter un score
app.post('/scores', (req, res) => {
    const { playerName, time, numPairs } = req.body;
    if (!playerName || !time || !numPairs) {
        return res.status(400).json({ error: 'Données invalides' });
    }
    db.query('INSERT INTO leaderboard (playerName, time, numPairs) VALUES (?, ?, ?)', 
        [playerName, time, numPairs], 
        (err, result) => {
        if (err) {
            console.error('Erreur :', err);
            return res.status(500).json({ error: 'Erreur serveur' });
        }
        res.json({ success: true, id: result.insertId });
    });
});

// Lancer le serveur
app.listen(process.env.PORT || 5000, () => {
    console.log(`🚀 Serveur en ligne sur le port ${process.env.PORT || 5000}`);
});
