import React, { useState, useEffect, useRef } from 'react';
import Confetti from 'react-confetti';
import Button from './components/Button';
import Card from './components/Card';
import titleImage from './images/title.webp';
import backImage from './images/backImage.webp';
import cardImages from './data';
import './App.css';

function generateCardPairs(numPairs) {
  const cards = [];
  const imagesCopy = [...cardImages];
  for (let i = 0; i < numPairs; i++) {
    const imageIndex = Math.floor(Math.random() * imagesCopy.length);
    const image = imagesCopy.splice(imageIndex, 1)[0];
    cards.push({ id: i * 2, image, isFlipped: true });
    cards.push({ id: i * 2 + 1, image, isFlipped: true });
  }
  return cards;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function App() {
  const [numPairs, setNumPairs] = useState(5);
  const [cards, setCards] = useState(generateCardPairs(numPairs));
  const [flippedCards, setFlippedCards] = useState([]);
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [pairsFound, setPairsFound] = useState(0);
  const [isGameWon, setIsGameWon] = useState(false);
  const [scores, setScores] = useState([]);
  const [playerName, setPlayerName] = useState('');
  const cardContainerRef = useRef(null); // Référence à l'élément card-container
  const [sortByName, setSortByName] = useState(null);
  const [sortByTime, setSortByTime] = useState(null);
  const [sortByPairs, setSortByPairs] = useState(null);

  useEffect(() => {
    let timer;
    if (isRunning && pairsFound !== numPairs) {
      timer = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [isRunning, pairsFound, numPairs]);

  const handleCardClick = (id, image) => {
    const flippedCard = { id, image };
    setFlippedCards(prevFlippedCards => [...prevFlippedCards, flippedCard]);
    setCards(prevCards => prevCards.map(card => {
      if (card.id === id) {
        return { ...card, isFlipped: true };
      }
      return card;
    }));
  };

  const handleStartClick = () => {
    setIsRunning(true);
    setPairsFound(0);
    setCards(shuffle(generateCardPairs(numPairs).map(card => ({ ...card, isFlipped: false }))));
    cardContainerRef.current.scrollIntoView({ behavior: 'smooth' });
  };

  const handleRestartClick = () => {
    const newCards = generateCardPairs(numPairs);
    setCards(newCards);
    setIsRunning(false);
    setTime(0);
    setIsGameWon(false);
    setPlayerName('');
  };

  const handlePlayerNameChange = (event) => {
    setPlayerName(event.target.value);
  };

  const handleSaveScore = async () => {
    if (!playerName) return alert("Veuillez entrer un nom !");
    
    const newScore = { playerName, time, numPairs };

    try {
        const response = await fetch(`${API_URL}/scores`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newScore),
        });

        if (response.ok) {
            fetchScores(); // Recharge les scores après l'ajout
            handleRestartClick(); // Redémarre la partie
        } else {
            console.error("Erreur lors de l'enregistrement du score");
        }
    } catch (error) {
        console.error("Erreur serveur :", error);
    }
};


  // Fonction pour ajouter une paire
  const handleAddPair = () => {
    if (numPairs < 18) { // Limiter le nombre maximal de paires
      setNumPairs(prevNumPairs => prevNumPairs + 1);
      setCards(generateCardPairs(numPairs + 1)); // Générer un nouveau jeu de cartes avec une paire supplémentaire
    }
  };

  const handleRemovePair = () => {
    if (numPairs > 5) { 
      setNumPairs(prevNumPairs => prevNumPairs - 1);
      setCards(generateCardPairs(numPairs - 1)); 
    }
  };

  const handleMaxPairs = () => {
    setNumPairs(18);
    setCards(generateCardPairs(18));
  };

  const handleMinPairs = () => {
    setNumPairs(5);
    setCards(generateCardPairs(5));
  };

  useEffect(() => {
    if (flippedCards.length === 2) {
      const [firstCard, secondCard] = flippedCards;
      if (firstCard.image === secondCard.image) {
        setCards(prevCards => prevCards.map(card => {
          if (card.id === firstCard.id || card.id === secondCard.id) {
            return { ...card, isFlipped: true };
          }
          return card;
        }));
        setPairsFound(prevPairsFound => prevPairsFound + 1);
      } else {
        setTimeout(() => {
          setCards(prevCards => prevCards.map(card => {
            if (card.id === firstCard.id || card.id === secondCard.id) {
              return { ...card, isFlipped: false };
            }
            return card;
          }));
        }, 1000);
      }
      setFlippedCards([]);
    }
  }, [flippedCards, cards]);

  useEffect(() => {
    if (pairsFound === numPairs) {
      setIsRunning(false);
      setIsGameWon(true);
    }
  }, [pairsFound, numPairs]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const handleSortScoresByTime = () => {
    fetchScores("time", sortByTime === "asc" ? "desc" : "asc");
    setSortByTime(sortByTime === "asc" ? "desc" : "asc");
  };

  const handleSortScoresByName = () => {
      fetchScores("playerName", sortByName === "asc" ? "desc" : "asc");
      setSortByName(sortByName === "asc" ? "desc" : "asc");
  };

  const handleSortScoresByPairs = () => {
      fetchScores("numPairs", sortByPairs === "asc" ? "desc" : "asc");
      setSortByPairs(sortByPairs === "asc" ? "desc" : "asc");
  };


  // Mise à jour API Render
  const API_URL = "https://memory-9c6b.onrender.com"; // URL de l'API backend sur Render

  // Charger les scores depuis l'API MySQL
  const fetchScores = async () => {
      try {
          const response = await fetch(`${API_URL}/scores`);
          const data = await response.json();
          setScores(data);
      } catch (error) {
          console.error("Erreur lors de la récupération des scores :", error);
      }
  };

  useEffect(() => {
      fetchScores(); // Charge les scores quand le composant est monté
  }, []);


  const [showTutorial, setShowTutorial] = useState(false);

  const toggleTutorial = () => {
    setShowTutorial(prev => !prev);
};

  return (
    <div className="center-content">
      <div className="App">
        <img src={titleImage} alt="Titre" className="title-image" />
        <Button label="Comment Jouer ?" onClick={toggleTutorial} />
        
        {showTutorial && (
          <div className="tutorial-overlay">
            <div className="tutorial-content">
              <h2>Comment Jouer ?</h2>
              <p>Le but du jeu est de retrouver toutes les paires en un minimum de temps</p>

              <div className="tutorial-steps">
                <div className="step">
                <img src="/tutorial-images/backimage.webp" alt="Retourner une carte" />
                <p>Cliquez sur une carte pour la retourner !</p>
                </div>
                <div className="step">
                <img src="/tutorial-images/flip.webp" alt="Trouver une paire" />
                <p>Trouvez une deuxième carte identique pour former une paire</p>
                </div>
                <div className="step">
                <img src="/tutorial-images/x2.webp" alt="Gagner la partie" />
                <p>Trouvez toutes les paires pour gagner !</p>
                </div>
              </div>

              <Button label="Fermer" onClick={toggleTutorial} />
            </div>
          </div>
        )}

        {!isRunning && !isGameWon && (
          <Button className="start-button" label="Start" onClick={handleStartClick} />
        )}
        {(!isRunning || !isGameWon) && <Button className="restart-button" label="Shuffle" onClick={handleRestartClick} />}
        {isGameWon && (
          <div>
            <div className="victory-message">You Won ! Wubalubadubdub !</div>
            <input type="text" value={playerName} onChange={handlePlayerNameChange} placeholder="Enter your name" />
            <Button className="save-score-button" label="Save Score" onClick={handleSaveScore} />
          </div>
        )}
        <div className="pair-indicator">
          Number of Pairs: {numPairs}
        </div>
        <div className="difficulty-buttons">
          <Button className="min-pairs-button" label="Min Pairs" onClick={handleMinPairs} />
          <Button className="remove-pair-button" label="-1 Pair" onClick={handleRemovePair} />
          <Button className="add-pair-button" label="+1 Pair" onClick={handleAddPair} />
          <Button className="max-pairs-button" label="Max Pairs" onClick={handleMaxPairs} />
        </div>
        <div className="time">Time: {formatTime(time)}</div>
        {isGameWon && <Confetti
          timeout={3000}
        />}
        <div ref={cardContainerRef} className="card-container">
          {cards.map(card => (
            <Card
              key={card.id}
              image={card.isFlipped ? card.image : backImage}
              onClick={() => card.isFlipped ? null : handleCardClick(card.id, card.image)}
            />
          ))}
        </div>
        <div className="leaderboard">
          <h2>Leaderboard</h2>
          <div className="sort-buttons-container">
          </div>
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSortScoresByName()} className={sortByName === 'asc' ? 'sorted-asc' : sortByName === 'desc' ? 'sorted-desc' : ''}>Name</th>
                <th onClick={() => handleSortScoresByTime()} className={sortByTime === 'asc' ? 'sorted-asc' : sortByTime === 'desc' ? 'sorted-desc' : ''}>Time</th>
                <th onClick={() => handleSortScoresByPairs()} className={sortByPairs === 'asc' ? 'sorted-asc' : sortByPairs === 'desc' ? 'sorted-desc' : ''}>№ Pairs</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((score, index) => (
                <tr key={index}>
                  <td>{score.playerName}</td>
                  <td>{formatTime(score.time)}</td>
                  <td>{score.numPairs > 0 ? score.numPairs : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>

  );
}

export default App;
