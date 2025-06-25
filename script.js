let players = JSON.parse(localStorage.getItem('players')) || [];
let ticketPrice = JSON.parse(localStorage.getItem('ticketPrice')) || 0;
let roundCount = parseInt(localStorage.getItem('roundCount')) || 0;
let history = JSON.parse(localStorage.getItem("history")) || [];

function saveAll() {
  localStorage.setItem('players', JSON.stringify(players));
  localStorage.setItem('ticketPrice', ticketPrice);
  localStorage.setItem('roundCount', roundCount);
  renderTable();
}

function addPlayer() {
  const name = document.getElementById("name").value.trim();
  const cards = parseInt(document.getElementById("cards").value);

  if (!name || isNaN(cards) || cards <= 0) return alert("Nhập hợp lệ!");

  if (players.some(p => p.name === name)) return alert("Người chơi đã tồn tại!");

  players.push({ name, cards, balance: 0, selected: true });
  saveAll();

  document.getElementById("name").value = "";
  document.getElementById("cards").value = "";
}

function renderTable() {
  const tbody = document.getElementById("player-table");
  tbody.innerHTML = "";

  players.forEach((p, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td><input type="checkbox" ${p.selected ? "checked" : ""} onchange="togglePlayer(${index})"></td>
      <td>${p.name}</td>
      <td><input type="number" value="${p.cards}" min="1" onchange="updateCards(${index}, this.value)"></td>
      <td>${p.balance.toLocaleString()}</td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById("roundCount").textContent = roundCount;
}

function togglePlayer(index) {
  players[index].selected = !players[index].selected;
  saveAll();
}

function toggleSelectAll() {
  const allSelected = players.every(p => p.selected);
  players.forEach(p => p.selected = !allSelected);
  saveAll();
}

function updateCards(index, newVal) {
  const val = parseInt(newVal);
  if (!isNaN(val) && val > 0) {
    players[index].cards = val;
    saveAll();
  }
}

function createWinnerSelect() {
    const select = document.createElement("select");
    select.className = "winner-select";
    players.forEach(p => {
        const option = document.createElement("option");
        option.value = p.name;
        option.textContent = p.name;
        select.appendChild(option);
    });
    return select;
}

function addWinnerSelect() {
  const container = document.getElementById("winner-dropdowns");
  container.appendChild(createWinnerSelect());
}

function renderHistory() {
  const tbody = document.querySelector("#history-table tbody");
  tbody.innerHTML = "";
  history.forEach(h => {
    const row = document.createElement("tr");

    const roundCell = document.createElement("td");
    roundCell.textContent = h.round;
    const winnerCell = document.createElement("td");
    winnerCell.textContent = h.winners.join(", ");
    const totalCell = document.createElement("td");
    totalCell.textContent = h.total;
    const shareCell = document.createElement("td");
    shareCell.textContent = h.share;

    row.appendChild(roundCell);
    row.appendChild(winnerCell);
    row.appendChild(totalCell);
    row.appendChild(shareCell);

    tbody.appendChild(row);
  });
}

function toggleHistory() {
  const section = document.getElementById("history-section");
  section.style.display = section.style.display === "none" ? "block" : "none";
}

function setWinners() {
  const game = JSON.parse(localStorage.getItem("currentGame"));
  if (!game) return alert("Không có dữ liệu ván!");

  const selects = document.querySelectorAll(".winner-select");
  const winnerNames = Array.from(selects).map(select => select.value);

  // Loại bỏ trùng tên
  const uniqueNames = [...new Set(winnerNames)];
  if (uniqueNames.length === 0) return alert("Chưa chọn người thắng!");

  const share = Math.floor(game.totalMoney / uniqueNames.length);
  uniqueNames.forEach(name => {
    const player = players.find(p => p.name === name);
    if (player) player.balance += share;
  });

  history.push({
    round: roundCount + 1,
    winners: uniqueNames,
    total: game.totalMoney,
    share: share
  });
  localStorage.setItem("history", JSON.stringify(history));
  renderHistory();

  roundCount++;
  localStorage.removeItem("currentGame");
  document.getElementById("winner-section").style.display = "none";
  saveAll();
}

function loadFromStorage() {
  const storedPlayers = JSON.parse(localStorage.getItem("players"));
  const storedHistory = JSON.parse(localStorage.getItem("history"));
  if (storedPlayers) players = storedPlayers;
  if (storedHistory) history = storedHistory;
  renderPlayers();
  renderHistory();
}

function startGame() {
  const priceInput = document.getElementById("ticketPrice");
  const inputPrice = parseInt(priceInput.value);
  if (!isNaN(inputPrice) && inputPrice > 0) ticketPrice = inputPrice;

  if (ticketPrice <= 0) return alert("Nhập giá trị mỗi tờ hợp lệ!");

  // Trừ tiền cho những người được chọn
  players.forEach(p => {
    if (p.selected) p.balance -= p.cards * ticketPrice;
  });

  // Tính tổng tiền từ những người tham gia
  const totalMoney = players.reduce((sum, p) => {
    return p.selected ? sum + p.cards * ticketPrice : sum;
  }, 0);

  localStorage.setItem("currentGame", JSON.stringify({ ticketPrice, totalMoney }));

  document.getElementById("current-total").textContent = totalMoney.toLocaleString();


  const dropdownContainer = document.getElementById("winner-dropdowns");
  dropdownContainer.innerHTML = "";
  dropdownContainer.appendChild(createWinnerSelect());

  document.getElementById("winner-section").style.display = "block";
  saveAll();
}

function setWinner() {
  const winnerName = document.getElementById("winner").value;
  const game = JSON.parse(localStorage.getItem("currentGame"));

  if (!winnerName || !game) return;

  const winner = players.find(p => p.name === winnerName);
  if (winner) {
    winner.balance += game.totalMoney;
    roundCount++;
    localStorage.removeItem("currentGame");
    document.getElementById("winner-section").style.display = "none";
    saveAll();
  }
}

renderTable();

document.addEventListener("DOMContentLoaded", function () {
  loadFromStorage();
});
