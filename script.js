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
  const container = document.createElement("div");
  container.className = "winner-select-container";
  
  const select = document.createElement("select");
  select.className = "winner-select form-input";
  
  // Option mặc định
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "-- Chọn người thắng --";
  defaultOption.selected = true;
  select.appendChild(defaultOption);
  
  // Thêm options
  players.forEach(player => {
    const option = document.createElement("option");
    option.value = player.name;
    option.textContent = player.name;
    select.appendChild(option);
  });
  
  // Thêm nút xóa
  if (document.querySelectorAll(".winner-select-container").length > 0) {
    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-winner-btn";
    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
    removeBtn.onclick = function() {
      container.remove();
    };
    container.appendChild(removeBtn);
  }
  
  container.appendChild(select);
  return container;
}

function addWinnerSelect() {
  const container = document.getElementById("winner-dropdowns");
  // Nếu chưa có select nào, tạo select đầu tiên không có nút xóa
  if (container.children.length === 0) {
    const firstSelect = createWinnerSelect();
    firstSelect.querySelector(".remove-winner-btn")?.remove();
    container.appendChild(firstSelect);
  } else {
    container.appendChild(createWinnerSelect());
  }
}

function renderHistory() {
  const tbody = document.querySelector("#history-table tbody");
  tbody.innerHTML = "";
  
  history.forEach((h, index) => {
    const row = document.createElement("tr");

    const roundCell = document.createElement("td");
    roundCell.textContent = h.round;
    
    const winnerCell = document.createElement("td");
    winnerCell.textContent = h.winners.join(", ");
    
    const totalCell = document.createElement("td");
    totalCell.textContent = h.total.toLocaleString() + " VNĐ";
    
    const shareCell = document.createElement("td");
    shareCell.textContent = h.share.toLocaleString() + " VNĐ";
    
    const actionCell = document.createElement("td");
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-history-btn";
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Xóa';
    deleteBtn.onclick = () => deleteHistoryItem(index);
    actionCell.appendChild(deleteBtn);
    
    row.appendChild(roundCell);
    row.appendChild(winnerCell);
    row.appendChild(totalCell);
    row.appendChild(shareCell);
    row.appendChild(actionCell);

    tbody.appendChild(row);
  });
}

function deleteHistoryItem(index) {
  if (confirm("Bạn có chắc muốn xóa ván chơi này? Thao tác này sẽ hoàn tiền cho người chơi và trừ tiền người thắng.")) {
    const game = history[index];

    // Kiểm tra dữ liệu tồn tại đầy đủ
    if (!game.total || !game.share || !Array.isArray(game.winners)) {
      alert("Dữ liệu ván chơi không đầy đủ, không thể hoàn tác.");
      return;
    }

    // ✅ Hoàn tiền lại cho người chơi đã tham gia (nếu lưu selectedPlayers)
    if (Array.isArray(game.selectedPlayers)) {
      const numSelected = game.selectedPlayers.length;
      const refundPerPlayer = Math.floor(game.total / numSelected);

      game.selectedPlayers.forEach(name => {
        const player = players.find(p => p.name === name);
        if (player) player.balance += refundPerPlayer;
      });
    } else {
      // Nếu không có selectedPlayers (backward compatibility), hoàn đều cho tất cả
      const refundPerPlayer = Math.floor(game.total / players.length);
      players.forEach(p => p.balance += refundPerPlayer);
    }

    // ✅ Trừ tiền người thắng
    game.winners.forEach(winnerName => {
      const winner = players.find(p => p.name === winnerName);
      if (winner) winner.balance -= game.share;
    });

    // Xóa khỏi lịch sử
    history.splice(index, 1);
    localStorage.setItem("history", JSON.stringify(history));

    // Giảm số ván đã chơi
    roundCount--;
    localStorage.setItem("roundCount", roundCount);

    // Cập nhật lại giao diện
    renderTable();
    renderHistory();
    saveAll();
  }
}

function toggleHistory() {
  const content = document.getElementById("history-content");
  const button = document.querySelector("#history-section button");
  
  if (content.style.display === "none") {
    content.style.display = "block";
    button.innerHTML = '<i class="fas fa-eye-slash"></i> Ẩn';
  } else {
    content.style.display = "none";
    button.innerHTML = '<i class="fas fa-eye"></i> Hiện';
  }
}

function setWinners() {
  const game = JSON.parse(localStorage.getItem("currentGame"));
  if (!game) return alert("Không có dữ liệu ván!");

  const selects = document.querySelectorAll(".winner-select");
  const winnerNames = Array.from(selects)
    .map(select => select.value)
    .filter(name => name); // Loại bỏ giá trị rỗng

  if (winnerNames.length === 0) return alert("Chưa chọn người thắng!");

  const uniqueNames = [...new Set(winnerNames)];
  const share = Math.floor(game.totalMoney / uniqueNames.length);
  
  uniqueNames.forEach(name => {
    const player = players.find(p => p.name === name);
    if (player) player.balance += share;
  });

  history.push({
    round: roundCount + 1,
    winners: uniqueNames,
    total: game.totalMoney,
    share: share,
    selectedPlayers: game.selectedPlayers
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
  //renderPlayers();
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

  const selectedPlayers = players.filter(p => p.selected).map(p => p.name);
  localStorage.setItem("currentGame", JSON.stringify({ ticketPrice, totalMoney, selectedPlayers }));
  
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
