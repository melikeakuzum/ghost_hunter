import React, { useState, useEffect, useCallback } from 'react';

function Game() {
  // Oyun sınırlarını ref olarak tutacağız
  const gameAreaRef = React.useRef(null);
  const [gameBounds, setGameBounds] = useState({
    width: 800,
    height: 600
  });

  const [ghosts, setGhosts] = useState([]);
  const [gameState, setGameState] = useState({
    score: 0,
    lives: 3,
    level: 1,
    timeLeft: 15,
    isPlaying: true,
    bombs: 0 // Bomba sayısı
  });
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [explodingGhosts, setExplodingGhosts] = useState([]); // Patlayan hayaletler
  const [isFrozen, setIsFrozen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState('👻'); // Varsayılan karakter
  const [unlockedCharacters, setUnlockedCharacters] = useState(['👻']); // Açılan karakterler

  // Karakter listesini bir kere tanımla
  const characters = [
    { emoji: '👻', name: 'Hayalet', price: 0 },
    { emoji: '✈️', name: 'Uçak', price: 1000 },
    { emoji: '🐦', name: 'Kuş', price: 1000 },
    { emoji: '🎈', name: 'Balon', price: 1000 },
    { emoji: '☁️', name: 'Bulut', price: 1000 },
    { emoji: '🪁', name: 'Uçurtma', price: 1000 },
    { emoji: '⭐', name: 'Yıldız', price: 1000 },
    { emoji: '☂️', name: 'Şemsiye', price: 1000 }
  ];

  // Bomba satın alma
  const buyBomb = () => {
    if (gameState.score >= 1000) {
      setGameState(prev => ({
        ...prev,
        score: prev.score - 1000,
        bombs: prev.bombs + 1
      }));
    }
  };

  // Can satın alma
  const buyLife = () => {
    if (gameState.score >= 1500 && gameState.lives < 3) {
      setGameState(prev => ({
        ...prev,
        score: prev.score - 1500,
        lives: prev.lives + 1
      }));
    }
  };

  // Buz efekti satın alma
  const buyFreeze = () => {
    if (gameState.score >= 600) {
      setGameState(prev => ({
        ...prev,
        score: prev.score - 600
      }));
      setIsFrozen(true);
      
      // 5 saniye sonra buz efekti bitsin
      setTimeout(() => {
        setIsFrozen(false);
      }, 5000);
    }
  };

  // Bombayı kullan
  const useBomb = () => {
    if (gameState.bombs > 0) {
      // Seviyenin 3'te biri kadar hayalet patlat
      const targetCount = Math.ceil(gameState.level / 3);
      const centerX = gameBounds.width / 2;
      const centerY = gameBounds.height / 2;
      
      const sortedGhosts = [...ghosts].sort((a, b) => {
        const distA = Math.sqrt(Math.pow(a.x - centerX, 2) + Math.pow(a.y - centerY, 2));
        const distB = Math.sqrt(Math.pow(b.x - centerX, 2) + Math.pow(b.y - centerY, 2));
        return distA - distB;
      });

      const targetGhosts = sortedGhosts.slice(0, targetCount).map(ghost => ghost.id);
      setExplodingGhosts(targetGhosts);

      setTimeout(() => {
        setGhosts(prev => prev.filter(ghost => !targetGhosts.includes(ghost.id)));
        setExplodingGhosts([]);
      }, 1000);

      setGameState(prev => ({
        ...prev,
        bombs: prev.bombs - 1
      }));
    }
  };

  // Hayaletleri oluştur
  const generateGhosts = useCallback(() => {
    const ghostCount = gameState.level + 2;
    const baseSpeed = Math.min(2 * (1 + (gameState.level - 1) * 0.1), 
                              Math.min(gameBounds.width, gameBounds.height) * 0.01);
    
    const newGhosts = [];
    for (let i = 0; i < ghostCount; i++) {
      newGhosts.push({
        id: i,
        x: Math.random() * (gameBounds.width - 50),
        y: Math.random() * (gameBounds.height - 50),
        speedX: (Math.random() - 0.5) * baseSpeed,
        speedY: (Math.random() - 0.5) * baseSpeed,
      });
    }
    setGhosts(newGhosts);
  }, [gameState.level, gameBounds]);

  // Seviye atlama kontrolü
  const checkLevelComplete = useCallback(() => {
    if (showLevelUp) return;
    
    const levelBonus = Math.floor(gameState.level) * 5; // 5 katı bonus
    const displayBonus = Math.floor(gameState.level) * 10; // Ekranda 10 katı göster
    setShowLevelUp(true);
    setGameState(prev => ({
      ...prev,
      level: prev.level + 0.5,
      timeLeft: 15,
      score: prev.score + levelBonus
    }));

    const levelUpDiv = document.createElement('div');
    levelUpDiv.className = 'level-up-animation';
    levelUpDiv.innerHTML = `Level Up!<br/><span class="bonus-points">+${displayBonus} Puan!</span>`;
    document.querySelector('.game-area').appendChild(levelUpDiv);

    setTimeout(() => {
      levelUpDiv.remove();
      setShowLevelUp(false);
    }, 2000);
  }, [showLevelUp, gameState.level]);

  // Can azaltma kontrolü
  const loseLife = useCallback(() => {
    setGameState(prev => {
      const newLives = prev.lives - 1;
      if (newLives <= 0) {
        return { ...prev, isPlaying: false };
      }
      return { ...prev, lives: newLives, timeLeft: 15 };
    });
    
    // Can azalma animasyonunu göster
    const loseLifeDiv = document.createElement('div');
    loseLifeDiv.className = 'lose-life-animation';
    loseLifeDiv.textContent = '1 CAN AZALDI!';
    document.querySelector('.game-area').appendChild(loseLifeDiv);
    
    setTimeout(() => {
      loseLifeDiv.remove();
      generateGhosts(); // Yeni hayaletleri oluştur
    }, 2000);
  }, [generateGhosts]);

  // Zamanlayıcı
  useEffect(() => {
    if (!gameState.isPlaying || showLevelUp) return;

    let timer = null;
    
    // Sadece oyun aktifken ve level up gösterilmiyorken süreyi azalt
    if (gameState.timeLeft > 0 && !showLevelUp) {
      timer = setInterval(() => {
        setGameState(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1
        }));
      }, 1000);
    } else if (gameState.timeLeft <= 0) {
      const targetGhosts = gameState.level + 2;
      const killedGhosts = targetGhosts - ghosts.length;
      
      if (killedGhosts < targetGhosts) {
        loseLife();
      } else {
        checkLevelComplete();
      }
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [gameState.isPlaying, gameState.timeLeft, showLevelUp, loseLife, checkLevelComplete]);

  // Hayalete tıklama - Sabit 10 puan için düzeltme
  const handleGhostClick = (ghostId) => {
    setGhosts(prevGhosts => {
      const newGhosts = prevGhosts.filter(ghost => ghost.id !== ghostId);
      const targetGhosts = gameState.level + 2;
      const killedGhosts = targetGhosts - newGhosts.length;
      
      if (killedGhosts >= targetGhosts) {
        setTimeout(() => {
          checkLevelComplete();
        }, 0);
      }
      
      return newGhosts;
    });
    
    // Her seviyede sabit 10 puan
    setGameState(prev => ({
      ...prev,
      score: prev.score + 10
    }));
  };

  // Oyunu yeniden başlat
  const restartGame = () => {
    setGameState({
      score: 0,
      lives: 3,
      level: 1,
      timeLeft: 15,
      isPlaying: true
    });
    setShowLevelUp(false);
    generateGhosts();
  };

  // Oyun bitişini kontrol et
  useEffect(() => {
    if (!gameState.isPlaying) {
      const gameOverDiv = document.createElement('div');
      gameOverDiv.className = 'game-over-animation';
      gameOverDiv.textContent = 'GAME OVER';
      document.querySelector('.game-area').appendChild(gameOverDiv);

      setTimeout(() => {
        gameOverDiv.remove();
        alert(`Oyun Bitti! Skorunuz: ${gameState.score} - Seviye: ${gameState.level}`);
        restartGame();
      }, 3000);
    }
  }, [gameState.isPlaying]);

  // Seviye değiştiğinde yeni hayaletler oluştur
  useEffect(() => {
    if (gameState.isPlaying) {
      const delay = showLevelUp ? 2000 : 0;
      setTimeout(() => {
        generateGhosts();
      }, delay);
    }
  }, [gameState.level, generateGhosts]);

  // Hayaletleri hareket ettir
  useEffect(() => {
    if (!gameState.isPlaying || showLevelUp) return;

    const moveGhosts = setInterval(() => {
      setGhosts(prevGhosts => 
        prevGhosts.map(ghost => {
          const speedMultiplier = isFrozen ? 0.5 : 1;
          let newX = ghost.x + (ghost.speedX * speedMultiplier);
          let newY = ghost.y + (ghost.speedY * speedMultiplier);
          
          // Sınırları kontrol et
          if (newX < 0) {
            newX = 0;
            ghost.speedX *= -1;
          } else if (newX > gameBounds.width - 50) {
            newX = gameBounds.width - 50;
            ghost.speedX *= -1;
          }

          if (newY < 0) {
            newY = 0;
            ghost.speedY *= -1;
          } else if (newY > gameBounds.height - 50) {
            newY = gameBounds.height - 50;
            ghost.speedY *= -1;
          }

          return {
            ...ghost,
            x: newX,
            y: newY
          };
        })
      );
    }, 16);

    return () => clearInterval(moveGhosts);
  }, [gameState.isPlaying, showLevelUp, isFrozen, gameBounds]);

  // targetGhosts değişkenini tanımlayalım
  const targetGhosts = gameState.level + 2;

  // Ekran boyutu değiştiğinde sınırları güncelle
  useEffect(() => {
    const updateGameBounds = () => {
      if (gameAreaRef.current) {
        const { clientWidth, clientHeight } = gameAreaRef.current;
        setGameBounds({
          width: clientWidth,
          height: clientHeight
        });
        
        // Mevcut hayaletlerin pozisyonlarını yeni sınırlara göre ayarla
        setGhosts(prevGhosts => prevGhosts.map(ghost => ({
          ...ghost,
          x: Math.min(ghost.x, clientWidth - 50),
          y: Math.min(ghost.y, clientHeight - 50)
        })));
      }
    };

    updateGameBounds();
    window.addEventListener('resize', updateGameBounds);
    return () => window.removeEventListener('resize', updateGameBounds);
  }, []);

  // Karakter satın alma
  const buyCharacter = (character) => {
    if (character.price === 0 || unlockedCharacters.includes(character.emoji)) {
      setSelectedCharacter(character.emoji);
    } else if (gameState.score >= character.price) {
      setGameState(prev => ({
        ...prev,
        score: prev.score - character.price
      }));
      setUnlockedCharacters(prev => [...prev, character.emoji]);
      setSelectedCharacter(character.emoji);
    }
  };

  // Kaydırma fonksiyonu
  const scrollCharacters = (direction) => {
    const slider = document.querySelector('.slider-container');
    const isMobile = window.innerWidth <= 900;
    const groupSize = 2; // Her zaman 2'şer karakter kaydır
    const scrollAmount = 150; // İki karakter genişliği + gap
    
    if (slider) {
      if (direction === 'left') {
        slider.style.transform = `translateX(${scrollAmount}px)`;
        
        setTimeout(() => {
          // Son 2 karakteri başa al
          for (let i = 0; i < groupSize; i++) {
            slider.appendChild(slider.firstElementChild);
          }
          slider.style.transform = 'translateX(0)';
        }, 300);
      } else {
        slider.style.transform = `translateX(-${scrollAmount}px)`;
        
        setTimeout(() => {
          // İlk 2 karakteri sona al
          for (let i = 0; i < groupSize; i++) {
            slider.prepend(slider.lastElementChild);
          }
          slider.style.transform = 'translateX(0)';
        }, 300);
      }
    }
  };

  return (
    <div className="game-wrapper">
      <div className="side-buttons">
        <div className="character-shop">
          <button className="scroll-button left" onClick={() => scrollCharacters('left')}>◀</button>
          <div className="character-slider">
            <div className="slider-container">
              {characters.map((char) => (
                <div 
                  key={char.emoji}
                  className={`character-option ${selectedCharacter === char.emoji ? 'selected' : ''} 
                             ${unlockedCharacters.includes(char.emoji) ? 'unlocked' : 'locked'}`}
                  onClick={() => buyCharacter(char)}
                >
                  <span className="character-emoji">{char.emoji}</span>
                  <span className="character-name">{char.name}</span>
                  {!unlockedCharacters.includes(char.emoji) && char.price > 0 && (
                    <span className="character-price">{char.price}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <button className="scroll-button right" onClick={() => scrollCharacters('right')}>▶</button>
        </div>
        <div className="bomb-shop" onClick={buyBomb}>
          <span className="bomb-emoji">💣</span>
          <span className="shop-price">1000 puan</span>
        </div>
        {gameState.lives < 3 && (
          <div className="life-shop" onClick={buyLife}>
            <span className="life-icon">❤️</span>
            <span className="shop-price">1500 puan</span>
          </div>
        )}
        <div className="freeze-shop" onClick={buyFreeze}>
          <span className="freeze-icon">❄️</span>
          <span className="shop-price">600 puan</span>
        </div>
      </div>
      <div className="game-container">
        <div className="game-header">
          <div className="lives">
            {[...Array(gameState.lives)].map((_, i) => (
              <span key={i} className="heart-icon">❤️</span>
            ))}
          </div>
          <div className="level">Seviye: {Math.floor(gameState.level)}</div>
          <div className="target">
            <span className="ghost-icon">👻</span> 
            {targetGhosts - ghosts.length}/{targetGhosts}
          </div>
          <div className="time">Süre: {gameState.timeLeft}</div>
          <div className="score">Skor: {gameState.score}</div>
          <div className="bombs" onClick={gameState.bombs > 0 ? useBomb : undefined}>
            <span className={`bomb-emoji ${gameState.bombs > 0 ? 'available' : ''}`}>
              💣
            </span>
            <span className="bomb-count">{gameState.bombs}</span>
          </div>
        </div>
        <div className="game-area" ref={gameAreaRef}>
          {showLevelUp && (
            <div className="level-up-animation">
              Level Up!
            </div>
          )}
          {!showLevelUp && ghosts.map(ghost => (
            <div
              key={ghost.id}
              className={`ghost ${explodingGhosts.includes(ghost.id) ? 'exploding' : ''} ${isFrozen ? 'frozen' : ''}`}
              style={{
                left: `${ghost.x}px`,
                top: `${ghost.y}px`
              }}
              onClick={() => handleGhostClick(ghost.id)}
            >
              <span className="character">{selectedCharacter}</span>
              {isFrozen && <span className="freeze-effect">❄️</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Game; 