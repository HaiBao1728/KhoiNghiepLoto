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
  select.required = true;
  
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "-- Chọn người thắng --";
  defaultOption.selected = true;
  defaultOption.disabled = true;
  select.appendChild(defaultOption);
  
  const game = JSON.parse(localStorage.getItem("currentGame"));
  const selectedPlayers = game?.selectedPlayers || players.filter(p => p.selected).map(p => p.name);
  
  players.forEach(player => {
    if (selectedPlayers.includes(player.name)) {
      const option = document.createElement("option");
      option.value = player.name;
      option.textContent = player.name;
      select.appendChild(option);
    }
  });
  
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
  const game = JSON.parse(localStorage.getItem("currentGame"));
  const selectedPlayers = game?.selectedPlayers || players.filter(p => p.selected).map(p => p.name);
  
  const currentSelects = document.querySelectorAll(".winner-select").length;
  
  if (currentSelects >= selectedPlayers.length) {
    alert(`Không thể thêm quá số lượng người tham gia (${selectedPlayers.length} người)!`);
    return;
  }
  
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

    if (!game.total || !game.share || !Array.isArray(game.winners)) {
      alert("Dữ liệu ván chơi không đầy đủ, không thể hoàn tác.");
      return;
    }

    if (Array.isArray(game.selectedPlayers)) {
      const numSelected = game.selectedPlayers.length;
      const refundPerPlayer = Math.floor(game.total / numSelected);

      game.selectedPlayers.forEach(name => {
        const player = players.find(p => p.name === name);
        if (player) player.balance += refundPerPlayer;
      });
    } else {
      const refundPerPlayer = Math.floor(game.total / players.length);
      players.forEach(p => p.balance += refundPerPlayer);
    }

    game.winners.forEach(winnerName => {
      const winner = players.find(p => p.name === winnerName);
      if (winner) winner.balance -= game.share;
    });

    history.splice(index, 1);
    localStorage.setItem("history", JSON.stringify(history));

    roundCount--;
    localStorage.setItem("roundCount", roundCount);

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

function loadFromStorage() {
  const storedPlayers = JSON.parse(localStorage.getItem("players"));
  const storedHistory = JSON.parse(localStorage.getItem("history"));
  if (storedPlayers) players = storedPlayers;
  if (storedHistory) history = storedHistory;
  renderHistory();
}

function startGame() {
  const priceInput = document.getElementById("ticketPrice");
  const inputPrice = parseInt(priceInput.value);

  if (!isNaN(inputPrice) && inputPrice > 0) ticketPrice = inputPrice;

  if (ticketPrice <= 0) return alert("Nhập giá trị mỗi tờ hợp lệ!");

  // Kiểm tra có người chơi được chọn không
  const selectedPlayersList = players.filter(p => p.selected);
  if (selectedPlayersList.length === 0) {
    return alert("Vui lòng chọn ít nhất một người chơi!");
  }

  // Tính tổng tiền từ những người tham gia (KHÔNG trừ tiền ngay)
  const totalMoney = players.reduce((sum, p) => {
    return p.selected ? sum + p.cards * ticketPrice : sum;
  }, 0);

  // Lưu thông tin ván chơi
  const gameData = { 
    ticketPrice, 
    totalMoney, 
    selectedPlayers: selectedPlayersList.map(p => p.name),
    playerCards: selectedPlayersList.map(p => ({ name: p.name, cards: p.cards }))
  };
  
  localStorage.setItem("currentGame", JSON.stringify(gameData));

  // Hiển thị tổng tiền
  document.getElementById("current-total").textContent = totalMoney.toLocaleString();

  // Tạo dropdown chọn người thắng
  const dropdownContainer = document.getElementById("winner-dropdowns");
  dropdownContainer.innerHTML = "";
  dropdownContainer.appendChild(createWinnerSelect());

  // Hiển thị section chọn người thắng
  document.getElementById("winner-section").style.display = "block";
}

function setWinners() {
  const game = JSON.parse(localStorage.getItem("currentGame"));
  if (!game) return alert("Không có dữ liệu ván!");

  const selects = document.querySelectorAll(".winner-select");
  const winnerNames = Array.from(selects)
    .map(select => select.value)
    .filter(name => name);

  if (winnerNames.length === 0) {
    alert("Vui lòng chọn ít nhất một người chiến thắng!");
    return;
  }

  const selectedPlayers = game.selectedPlayers || players.filter(p => p.selected).map(p => p.name);
  const invalidWinners = winnerNames.filter(name => !selectedPlayers.includes(name));
  
  if (invalidWinners.length > 0) {
    alert(`Người chơi "${invalidWinners.join(', ')}" không tham gia ván này!`);
    return;
  }

  const uniqueNames = [...new Set(winnerNames)];
  const share = Math.floor(game.totalMoney / uniqueNames.length);
  
  // *** CHỈ TRỪ TIỀN NGƯỜI CHƠI KHI ĐÃ CHỌN NGƯỜI THẮNG ***
  players.forEach(p => {
    if (p.selected) {
      p.balance -= p.cards * game.ticketPrice;
    }
  });

  // Cộng tiền cho người thắng
  uniqueNames.forEach(name => {
    const player = players.find(p => p.name === name);
    if (player) player.balance += share;
  });

  // Lưu vào lịch sử
  history.push({
    round: roundCount + 1,
    winners: uniqueNames,
    total: game.totalMoney,
    share: share,
    selectedPlayers: selectedPlayers,
    ticketPrice: game.ticketPrice
  });
  
  localStorage.setItem("history", JSON.stringify(history));
  renderHistory();

  roundCount++;
  localStorage.removeItem("currentGame");
  document.getElementById("winner-section").style.display = "none";
  
  document.getElementById("ticketPrice").value = "";
  
  saveAll();
  
  alert(`Đã xác nhận ${uniqueNames.length} người thắng, nhận ${share.toLocaleString()} VNĐ!`);
}

function resetBalances() {
  if (players.length === 0) {
    alert("Không có shark để reset!");
    return;
  }

  showConfirmModal(
    "Reset số dư",
    `Muốn đặt lại số dư của tất cả các shark về 0? 
    \n- Lịch sử ván chơi sẽ được giữ nguyên
    \n- Chỉ số dư hiện tại được reset
    \n- Không thể hoàn tác!`,
    () => {
      players.forEach(p => p.balance = 0);
      saveAll();
      alert("Đã reset số dư thành công!");
    }
  );
}

function deleteAllHistory() {
  if (history.length === 0) {
    alert("Không có lịch sử để xóa!");
    return;
  }

  showConfirmModal(
    "Xóa toàn bộ lịch sử?",
    `Muốn xóa tất cả ${history.length} ván chơi? Hành động này sẽ: 
    \n- Hoàn tiền cho tất cả shark
    \n- Trừ tiền của tất cả shark thắng
    \n- Không thể hoàn tác!`,
    () => {
      history.forEach(game => {
        if (!game.total || !game.share || !Array.isArray(game.winners)) return;

        if (Array.isArray(game.selectedPlayers)) {
          const numSelected = game.selectedPlayers.length;
          const refundPerPlayer = Math.floor(game.total / numSelected);

          game.selectedPlayers.forEach(name => {
            const player = players.find(p => p.name === name);
            if (player) player.balance += refundPerPlayer;
          });
        } else {
          const refundPerPlayer = Math.floor(game.total / players.length);
          players.forEach(p => p.balance += refundPerPlayer);
        }

        game.winners.forEach(winnerName => {
          const winner = players.find(p => p.name === winnerName);
          if (winner) winner.balance -= game.share;
        });
      });

      history = [];
      roundCount = 0;
      
      localStorage.setItem("history", JSON.stringify(history));
      localStorage.setItem("roundCount", roundCount);
      
      renderTable();
      renderHistory();
      saveAll();
      
      alert("Đã xóa toàn bộ lịch sử và hoàn tiền thành công!");
    }
  );
}

function showConfirmModal(title, message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  
  const modal = document.createElement('div');
  modal.className = 'modal-content';
  
  modal.innerHTML = `
    <h3><i class="fas fa-exclamation-triangle" style="color: var(--danger-color);"></i> ${title}</h3>
    <p>${message.replace(/\n/g, '<br>')}</p>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
        <i class="fas fa-times"></i> Hủy
      </button>
      <button class="btn btn-danger" id="confirm-delete">
        <i class="fas fa-trash-alt"></i> Xác nhận
      </button>
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  document.getElementById('confirm-delete').addEventListener('click', () => {
    onConfirm();
    overlay.remove();
  });
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

renderTable();

document.addEventListener("DOMContentLoaded", function () {
  loadFromStorage();
});