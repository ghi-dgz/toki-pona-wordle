const anslist = ["anpa","ante","awen","esun","insa","jaki","jelo","kala","kama","kasi","kili","kule","kute","lape","laso","lawa","leko","lete","lili","lipu","loje","luka","lupa","mama","mani","meli","meso","mije","moku","moli","musi","mute","nasa","nena","nimi","noka","olin","open","pali","pana","pini","pipi","poka","poki","pona","sama","seli","selo","seme","sewi","sike","sina","soko","sona","suli","suno","supa","suwi","taso","tawa","telo","toki","tomo","unpa","walo","waso","wawa","weka","wile"].slice().sort();
const guesslist = [...anslist];
let answerIndex = 0;

const keyboardRows = [
    ['p','t','k','s','m'],
    ['a','e','i','o','u'],
    ['Enter','n','l','j','w','Backspace']
];

let answer = "";
let currentRow = 0;
let currentCol = 0;
let board = [];
let gameOver = false;

function getWord() {
    const word = anslist[answerIndex % anslist.length];
    answerIndex++;
    return word;
}

function checkWord(word) {
    return guesslist.includes(word);
}

function getFeedback(guess, answer) {
    let feedback = Array(guess.length).fill('absent');
    let answerChars = answer.split('');
    for (let i = 0; i < guess.length; i++) {
        if (guess[i] === answer[i]) {
            feedback[i] = 'correct';
            answerChars[i] = null;
        }
    }
    for (let i = 0; i < guess.length; i++) {
        if (feedback[i] === 'absent' && answerChars.includes(guess[i])) {
            feedback[i] = 'present';
            answerChars[answerChars.indexOf(guess[i])] = null;
        }
    }
    return feedback;
}

function drawBoard() {
    const boardDiv = document.getElementById('board');
    boardDiv.innerHTML = '';
    for (let r = 0; r < 6; r++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'wordle-row';
        for (let c = 0; c < 4; c++) {
            const tile = document.createElement('div');
            tile.className = 'wordle-tile';
            if (board[r] && board[r][c]) {
                tile.textContent = board[r][c].letter;
                if (board[r][c].state) {
                    tile.classList.add('tile-' + board[r][c].state);
                }
            }
            rowDiv.appendChild(tile);
        }
        boardDiv.appendChild(rowDiv);
    }
}

function drawKeyboard(keyStates = {}) {
    const kb = document.getElementById('keyboard');
    kb.innerHTML = '';
    keyboardRows.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'keyboard-row';
        row.forEach(key => {
            const btn = document.createElement('button');
            btn.className = 'key';
            btn.textContent = key === 'Backspace' ? '⌫' : key;
            if (keyStates[key]) btn.classList.add('key-' + keyStates[key]);
            btn.onclick = () => handleKey(key);
            rowDiv.appendChild(btn);
        });
        kb.appendChild(rowDiv);
    });
}

function showMessage(msg, color = "#d32f2f") {
    const msgDiv = document.getElementById('message');
    msgDiv.textContent = msg;
    msgDiv.style.color = color;
    setTimeout(() => { msgDiv.textContent = ""; }, 2000);
}

function getStats() {
    return JSON.parse(localStorage.getItem('tpwordle_stats') || '{"games":0,"wins":0,"currentStreak":0,"maxStreak":0,"guessDist":[0,0,0,0,0,0],"totalGuesses":0}');
}
function saveStats(stats) {
    localStorage.setItem('tpwordle_stats', JSON.stringify(stats));
}
function updateStats(win, guesses) {
    let stats = getStats();
    stats.games++;
    if (win) {
        stats.wins++;
        stats.currentStreak++;
        if (stats.currentStreak > stats.maxStreak) stats.maxStreak = stats.currentStreak;
        stats.guessDist[guesses-1]++;
    } else {
        stats.currentStreak = 0;
    }
    if (win) stats.totalGuesses += guesses;
    saveStats(stats);
}
function showStats() {
    let stats = getStats();
    let winPct = stats.games ? Math.round((stats.wins / stats.games) * 100) : 0;
    let avgGuesses = stats.wins ? (stats.totalGuesses / stats.wins).toFixed(2) : "-";
    let maxDist = Math.max(...stats.guessDist, 1); // Avoid division by zero
    let distRows = stats.guessDist.map((n, i) => {
        let barWidth = (n && maxDist) ? (n / maxDist * 100) : 0;
        return `
            <tr>
                <td style="width:2em;">${i+1}</td>
                <td>
                    <div style="background:#e0e0e0; height:20px; border-radius:4px; position:relative;">
                        <div style="background:#6aaa64; width:${barWidth}%; height:100%; border-radius:4px;"></div>
                        <span style="position:absolute; left:8px; top:0; color:#fff; font-weight:bold; line-height:20px;">${n}</span>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    document.getElementById('stats-content').innerHTML = `
        <p><b>Games played:</b> ${stats.games}</p>
        <p><b>Wins:</b> ${stats.wins} (${winPct}%)</p>
        <p><b>Current streak:</b> ${stats.currentStreak}</p>
        <p><b>Max streak:</b> ${stats.maxStreak}</p>
        <p><b>Average guesses (wins):</b> ${avgGuesses}</p>
        <p><b>Guess distribution:</b></p>
        <table style="width:100%;text-align:left;">
            <tr><th>Guesses</th><th>Wins</th></tr>
            ${distRows}
        </table>
        <button id="reset-stats" style="margin-top:16px;">Reset Stats</button>
    `;
    document.getElementById('stats-modal').style.display = 'flex';
    document.getElementById('reset-stats').onclick = function() {
        localStorage.removeItem('tpwordle_stats');
        showStats();
    };
}



let lastWin = false;
let lastGuesses = 0;
let lastPossibleWords = null;

function updatePossibleWords() {
    const wordlistDiv = document.getElementById('wordlist');
    isPossibleWord._debugOnce = function(debugInfo) {
        console.log('--- Wordle Filter Debug ---');
        console.log('Guesses:', debugInfo.guesses);
        console.log('mustBe (green):', debugInfo.mustBe);
        console.log('cannotBe (gray/yellow per pos):', debugInfo.cannotBe);
        console.log('mustInclude (yellow/green):', debugInfo.mustInclude);
        console.log('minCounts:', debugInfo.minCounts);
        console.log('maxCounts:', debugInfo.maxCounts);
        console.log('trulyAbsent:', debugInfo.trulyAbsent);
    };
    let possible = anslist.filter(word => isPossibleWord(word));
    if (!lastPossibleWords || lastPossibleWords.join(',') !== possible.join(',')) {
        wordlistDiv.innerHTML = possible.map(w => `<span style="display:inline-block; min-width:48px;">${w}</span>`).join('');
        lastPossibleWords = possible;
    }
    console.log('Possible words:', possible);
}

function refreshPossibleWordsUntilStable(maxTries = 10, delay = 50) {
    let tries = 0;
    let prev = lastPossibleWords ? lastPossibleWords.join(',') : '';
    function check() {
        updatePossibleWords();
        let curr = lastPossibleWords ? lastPossibleWords.join(',') : '';
        if (curr !== prev || tries >= maxTries) {
            return;
        } else {
            tries++;
            setTimeout(check, delay);
        }
    }
    check();
}

function handleKey(key) {
    if (gameOver) {
        if (key === 'Enter') {
            document.getElementById('next-game').click();
        }
        return;
    }
    if (key === 'Backspace') {
        if (currentCol > 0) {
            board[currentRow][currentCol - 1].letter = '';
            currentCol--;
            drawBoard();
        }
    } else if (key === 'Enter') {
        refreshPossibleWordsUntilStable();
        if (currentCol === 4) {
            const guess = board[currentRow].map(x => x.letter).join('').toLowerCase();
            if (!checkWord(guess)) {
                showMessage("Invalid word.");
                return;
            }
            const feedback = getFeedback(guess, answer);
            for (let i = 0; i < 4; i++) {
                board[currentRow][i].state = feedback[i];
            }
            updateKeyboardStates();
            drawBoard();
            refreshPossibleWordsUntilStable();
            if (guess === answer) {
                showMessage("Congratulations!", "#388e3c");
                gameOver = true;
                lastWin = true;
                lastGuesses = currentRow + 1;
                updateStats(true, lastGuesses);
                return;
            }
            currentRow++;
            currentCol = 0;
            if (currentRow === 6) {
                showMessage(`The word was: ${answer}`, "#d32f2f");
                gameOver = true;
                lastWin = false;
                updateStats(false, 0);
            }
        }
    } else if (/^[a-z]$/.test(key)) {
        if (currentCol < 4) {
            board[currentRow][currentCol].letter = key;
            currentCol++;
            drawBoard();
        }
    }
}

let keyStates = {};
function updateKeyboardStates() {
    for (let r = 0; r <= currentRow; r++) {
        for (let c = 0; c < 4; c++) {
            const cell = board[r][c];
            if (!cell.state) continue;
            const k = cell.letter;
            if (cell.state === 'correct') {
                keyStates[k] = 'correct';
            } else if (cell.state === 'present' && keyStates[k] !== 'correct') {
                keyStates[k] = 'present';
            } else if (cell.state === 'absent' && !keyStates[k]) {
                keyStates[k] = 'absent';
            }
        }
    }
    drawKeyboard(keyStates);
}

function updatePossibleWords() {
    const wordlistDiv = document.getElementById('wordlist');
    const container = document.getElementById('wordlist-container');
    if (container && container.style.display !== 'none') {
        container.style.display = 'none';
        void container.offsetWidth;
        container.style.display = 'block';
    }
    isPossibleWord._debugOnce = function(debugInfo) {
        console.log('--- Wordle Filter Debug ---');
        console.log('Guesses:', debugInfo.guesses);
        console.log('mustBe (green):', debugInfo.mustBe);
        console.log('cannotBe (gray/yellow per pos):', debugInfo.cannotBe);
        console.log('mustInclude (yellow/green):', debugInfo.mustInclude);
        console.log('minCounts:', debugInfo.minCounts);
        console.log('maxCounts:', debugInfo.maxCounts);
        console.log('trulyAbsent:', debugInfo.trulyAbsent);
    };
    let possible = anslist.filter(word => isPossibleWord(word));
    console.log('Possible words:', possible);
    wordlistDiv.innerHTML = possible.map(w => `<span style="display:inline-block; min-width:48px;">${w}</span>`).join('');
}

function getFilteringDebugInfo() {
    let mustBe = Array(4).fill(null);
    let cannotBe = Array(4).fill(null).map(() => new Set());
    let mustInclude = new Set();
    let minCounts = {};
    let maxCounts = {};
    let trulyAbsent = new Set();
    for (let r = 0; r < currentRow; r++) {
        let guess = board[r].map(cell => cell.letter).join('');
        let feedback = board[r].map(cell => cell.state);
        let letterCounts = {};
        for (let i = 0; i < 4; i++) {
            let l = guess[i];
            if (!letterCounts[l]) letterCounts[l] = 0;
            if (feedback[i] === 'correct' || feedback[i] === 'present') {
                letterCounts[l]++;
            }
        }
        for (let i = 0; i < 4; i++) {
            let l = guess[i];
            if (feedback[i] === 'correct') {
                mustBe[i] = l;
                mustInclude.add(l);
                minCounts[l] = Math.max(minCounts[l] || 0, letterCounts[l]);
            } else if (feedback[i] === 'present') {
                cannotBe[i].add(l);
                mustInclude.add(l);
                minCounts[l] = Math.max(minCounts[l] || 0, letterCounts[l]);
            } else if (feedback[i] === 'absent') {
                let isGreenOrYellow = false;
                for (let j = 0; j < 4; j++) {
                    if (guess[j] === l && (feedback[j] === 'correct' || feedback[j] === 'present')) {
                        isGreenOrYellow = true;
                        break;
                    }
                }
                if (!isGreenOrYellow) {
                    trulyAbsent.add(l);
                    for (let k = 0; k < 4; k++) cannotBe[k].add(l);
                    maxCounts[l] = 0;
                } else {
                    cannotBe[i].add(l);
                }
            }
        }
    }
    let cannotBeArr = cannotBe.map(s => Array.from(s));
    return {
        mustBe: mustBe,
        cannotBe: cannotBeArr,
        mustInclude: Array.from(mustInclude),
        trulyAbsent: Array.from(trulyAbsent),
        minCounts: {...minCounts},
        maxCounts: {...maxCounts}
    };
}

function isPossibleWord(word) {
    let mustBe = Array(4).fill(null); 
    let cannotBe = Array(4).fill(null).map(() => new Set()); 
    let mustInclude = new Set(); 
    let minCounts = {};
    let maxCounts = {};
    let trulyAbsent = new Set();
    let debugGuesses = [];
    for (let r = 0; r < currentRow; r++) {
        let guess = board[r].map(cell => cell.letter).join('');
        let feedback = board[r].map(cell => cell.state);
        let letterCounts = {};
        for (let i = 0; i < 4; i++) {
            let l = guess[i];
            if (!letterCounts[l]) letterCounts[l] = 0;
            if (feedback[i] === 'correct' || feedback[i] === 'present') {
                letterCounts[l]++;
            }
        }
        for (let i = 0; i < 4; i++) {
            let l = guess[i];
            if (feedback[i] === 'correct') {
                mustBe[i] = l;
                mustInclude.add(l);
                minCounts[l] = Math.max(minCounts[l] || 0, letterCounts[l]);
            } else if (feedback[i] === 'present') {
                cannotBe[i].add(l);
                mustInclude.add(l);
                minCounts[l] = Math.max(minCounts[l] || 0, letterCounts[l]);
            } else if (feedback[i] === 'absent') {
                let isGreenOrYellow = false;
                for (let j = 0; j < 4; j++) {
                    if (guess[j] === l && (feedback[j] === 'correct' || feedback[j] === 'present')) {
                        isGreenOrYellow = true;
                        break;
                    }
                }
                if (!isGreenOrYellow) {
                    trulyAbsent.add(l);
                    for (let k = 0; k < 4; k++) cannotBe[k].add(l);
                    maxCounts[l] = 0;
                } else {
                    cannotBe[i].add(l);
                }
            }
        }
        debugGuesses.push({guess, feedback: [...feedback]});
    }
    for (let l of trulyAbsent) {
        if (word.includes(l)) return false;
    }
    let letterCountInWord = {};
    for (let i = 0; i < 4; i++) {
        let l = word[i];
        if (mustBe[i] && word[i] !== mustBe[i]) return false;
        if (cannotBe[i].has(l)) return false;
        letterCountInWord[l] = (letterCountInWord[l] || 0) + 1;
    }
    for (let l of mustInclude) {
        if (!word.includes(l)) return false;
    }
    for (let l in minCounts) {
        if ((letterCountInWord[l] || 0) < minCounts[l]) return false;
    }
    for (let l in maxCounts) {
        if ((letterCountInWord[l] || 0) > maxCounts[l]) return false;
    }
    if (typeof isPossibleWord._debugOnce === 'function') {
        isPossibleWord._debugOnce({
            guesses: debugGuesses,
            mustBe: [...mustBe],
            cannotBe: cannotBe.map(set => Array.from(set)),
            mustInclude: Array.from(mustInclude),
            minCounts: {...minCounts},
            maxCounts: {...maxCounts},
            trulyAbsent: Array.from(trulyAbsent)
        });
        isPossibleWord._debugOnce = null;
    }
    return true;
}

function init() {
    answer = getWord();
    board = [];
    for (let r = 0; r < 6; r++) {
        board.push([]);
        for (let c = 0; c < 4; c++) {
            board[r].push({ letter: '', state: null });
        }
    }
    currentRow = 0;
    currentCol = 0;
    gameOver = false;
    keyStates = {};
    drawBoard();
    drawKeyboard();

    document.getElementById('show-answer').onclick = function() {
        showMessage(`The answer is: ${answer}`, "#1976d2");
    };
    document.getElementById('next-game').onclick = function() {
        init();
    };
    document.getElementById('show-stats').onclick = function() {
        showStats();
    };
    document.getElementById('close-stats').onclick = function() {
        document.getElementById('stats-modal').style.display = 'none';
    };
    document.getElementById('toggle-wordlist').onclick = function() {
        const container = document.getElementById('wordlist-container');
        if (container.style.display === 'none') {
            container.style.display = 'block';
            refreshPossibleWordsUntilStable();
        } else {
            container.style.display = 'none';
        }
    };
}

window.onload = function() {
    document.addEventListener('keydown', (e) => {
        if (gameOver) {
            if (e.key === 'Enter') {
                handleKey('Enter');
            }
            return;
        }
        if (e.key === 'Backspace' || e.key === 'Enter' || /^[a-zA-Z]$/.test(e.key)) {
            handleKey(e.key.length === 1 ? e.key.toLowerCase() : e.key);
        }
    });
    init();
};