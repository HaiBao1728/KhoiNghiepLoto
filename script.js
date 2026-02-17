let players = JSON.parse(localStorage.getItem('players')) || [];
let ticketPrice = JSON.parse(localStorage.getItem('ticketPrice')) || 0;
let roundCount = parseInt(localStorage.getItem('roundCount')) || 0;
let history = JSON.parse(localStorage.getItem("history")) || [];
let currentSession = JSON.parse(localStorage.getItem("currentSession")) || {
  id: "default",
  name: "First time"
};

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

  if (history.length === 0) return;

  const grouped = history.reduce((acc, h) => {
    if (!acc[h.sessionId]) {
      acc[h.sessionId] = {
        name: h.sessionName || "Phiên cũ",
        games: []
      };
    }
    acc[h.sessionId].games.push(h);
    return acc;
  }, {});

  Object.keys(grouped).forEach(sessionId => {
    const session = grouped[sessionId];

    const headerRow = document.createElement("tr");
    headerRow.className = "session-header-row";

    const headerCell = document.createElement("td");
    headerCell.colSpan = 5;
    headerCell.innerHTML = `<strong></strong> ${session.name}`;
    headerCell.style.fontWeight = "bold";

    headerRow.appendChild(headerCell);
    tbody.appendChild(headerRow);

    session.games.forEach((h, index) => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${h.round}</td>
        <td>${h.winners.join(", ")}</td>
        <td>${h.total.toLocaleString()} VNĐ</td>
        <td>${h.share.toLocaleString()} VNĐ</td>
        <td>
          <button class="delete-history-btn" onclick="deleteHistoryItem(${history.indexOf(h)})">
            <i class="fas fa-trash"></i> Xóa
          </button>
        </td>
      `;

      tbody.appendChild(row);
    });
  });
}


function deleteHistoryItem(index) {
  const game = history[index];

  if (game.sessionId !== currentSession.id) {
    alert("Không thể xóa ván thuộc kỳ chơi cũ!");
    return;
  }

  if (confirm("Muốn xóa ván chơi này? Thao tác này sẽ hoàn tiền cho người chơi và trừ tiền người thắng.")) {
    const game = history[index];

    if (!game.total || !game.share || !Array.isArray(game.winners)) {
      alert("Dữ liệu ván chơi không đầy đủ, không thể hoàn tác.");
      return;
    }

    const balancesBefore = {};
    players.forEach(p => {
      balancesBefore[p.name] = p.balance;
    });

    if (Array.isArray(game.playerCards)) {
      game.playerCards.forEach(pc => {
        const player = players.find(p => p.name === pc.name);
        if (player) {
          player.balance += pc.cards * game.ticketPrice;
        }
      });
    }

    game.winners.forEach(winnerName => {
      const winner = players.find(p => p.name === winnerName);
      if (winner) {
        winner.balance -= game.share;
      }
    });

    console.log('Trước khi xóa:', balancesBefore);
    console.log('Sau khi xóa:', players.map(p => ({ name: p.name, balance: p.balance })));

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

  const selectedPlayersList = players.filter(p => p.selected);
  if (selectedPlayersList.length === 0) {
    return alert("Vui lòng chọn ít nhất một người chơi!");
  }

  const totalMoney = players.reduce((sum, p) => {
    return p.selected ? sum + p.cards * ticketPrice : sum;
  }, 0);

  const gameData = { 
    ticketPrice, 
    totalMoney, 
    selectedPlayers: selectedPlayersList.map(p => p.name),
    playerCards: selectedPlayersList.map(p => ({ name: p.name, cards: p.cards }))
  };
  
  localStorage.setItem("currentGame", JSON.stringify(gameData));

  document.getElementById("current-total").textContent = totalMoney.toLocaleString();

  const dropdownContainer = document.getElementById("winner-dropdowns");
  dropdownContainer.innerHTML = "";
  dropdownContainer.appendChild(createWinnerSelect());

  document.getElementById("winner-section").style.display = "block";
}

function setWinners() {
  const game = JSON.parse(localStorage.getItem("currentGame"));
  if (!game) return alert("Không có dữ liệu ván!");

  const selects = document.querySelectorAll(".winner-select");
  const winnerNames = Array.from(selects)
    .map(select => select.value)
    .filter(Boolean);

  if (winnerNames.length === 0) {
    alert("Vui lòng chọn ít nhất một người thắng!");
    return;
  }

  const uniqueWinners = [...new Set(winnerNames)];
  const selectedPlayers = players.filter(p => p.selected);

  const totalMoney = selectedPlayers.reduce(
    (sum, p) => sum + p.cards * game.ticketPrice,
    0
  );

  const share = Math.floor(totalMoney / uniqueWinners.length);

  selectedPlayers.forEach(p => {
    p.balance -= p.cards * game.ticketPrice;
  });

  uniqueWinners.forEach(name => {
    const winner = players.find(p => p.name === name);
    if (winner) winner.balance += share;
  });

  history.push({
    sessionId: currentSession.id,
    sessionName: currentSession.name,
    round: roundCount + 1,

    winners: uniqueWinners,
    total: totalMoney,
    share: share,
    ticketPrice: game.ticketPrice,

    playerCards: selectedPlayers.map(p => ({
      name: p.name,
      cards: p.cards
    }))
  });

  localStorage.setItem("history", JSON.stringify(history));

  roundCount++;
  localStorage.setItem("roundCount", roundCount);

  localStorage.removeItem("currentGame");
  document.getElementById("winner-section").style.display = "none";
  document.getElementById("ticketPrice").value = "";

  renderHistory();
  saveAll();
}


function resetBalances() {
  if (players.length === 0) {
    alert("Không có shark để reset!");
    return;
  }

  const sessionName = prompt(
    "Nhập tên kỳ chơi mới:",
    `Kỳ ${new Date().toLocaleDateString()}`
  );

  if (!sessionName) return;

  players.forEach(p => p.balance = 0);

  currentSession = {
    id: Date.now().toString(),
    name: sessionName
  };

  roundCount = 0;

  localStorage.setItem("currentSession", JSON.stringify(currentSession));
  localStorage.setItem("roundCount", roundCount);

  saveAll();

  alert(`Đã bắt đầu kỳ mới: ${sessionName}`);
}

function deleteAllHistory() {
  if (history.length === 0) {
    alert("Không có lịch sử để xóa!");
    return;
  }

  showConfirmModal(
    "Xóa toàn bộ lịch sử?",
    `Muốn xóa tất cả ${history.length} ván chơi? 
    \n- Hoàn lại tiền đã đóng cho tất cả các shark
    \n- Trừ lại tiền thưởng của shark thắng
    \n- Đưa số dư về trạng thái trước tất cả các ván
    \n- Không thể hoàn tác!`,
    () => {
      for (let i = history.length - 1; i >= 0; i--) {
        const game = history[i];
        
        if (!game.total || !game.share || !Array.isArray(game.winners)) continue;

        if (Array.isArray(game.selectedPlayers)) {
          game.selectedPlayers.forEach(name => {
            const player = players.find(p => p.name === name);
            if (player) {
              const paidAmount = (game.playerCards?.find(pc => pc.name === name)?.cards || 0) * game.ticketPrice;
              player.balance += paidAmount;
            }
          });
        }

        game.winners.forEach(winnerName => {
          const winner = players.find(p => p.name === winnerName);
          if (winner) {
            winner.balance -= game.share;
          }
        });
      }

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

function clearAllStorage() {
  showConfirmModal(
    "XÓA TOÀN BỘ DỮ LIỆU?",
    `<br>• Xóa toàn bộ người chơi
    <br>• Xóa tất cả lịch sử (mọi kỳ)
    <br>• Reset toàn bộ ứng dụng
    <br><br><strong>KHÔNG THỂ HOÀN TÁC!</strong>`,
    () => {
      localStorage.clear();

      players = [];
      history = [];
      ticketPrice = 0;
      roundCount = 0;
      currentSession = {
        id: "default",
        name: "Phiên mặc định"
      };

      renderTable();
      renderHistory();

      //alert("Đã xóa toàn bộ dữ liệu! Ứng dụng sẽ tải lại.");

      location.reload();
    }
  );
}

function exportBySessionMatrixStyled() {
  if (!history.length) {
    alert("Không có dữ liệu để xuất!");
    return;
  }

  const wb = XLSX.utils.book_new();

  const sessions = history.reduce((acc, h) => {
    if (!acc[h.sessionId]) acc[h.sessionId] = [];
    acc[h.sessionId].push(h);
    return acc;
  }, {});

  Object.values(sessions).forEach(games => {
    games.sort((a, b) => a.round - b.round);

    const sessionName = games[0].sessionName || "Ky choi";
    const maxRound = Math.max(...games.map(g => g.round));

    const members = Array.from(
      new Set(
        games.flatMap(g => g.playerCards?.map(p => p.name) || [])
      )
    ).sort();

    const aoa = [];

    /* ================= HEADER (VÁN + GIÁ MỖI TỜ) ================= */
    const roundHeaders = [];
    for (let r = 1; r <= maxRound; r++) {
      const g = games.find(x => x.round === r);
      if (g && g.ticketPrice) {
        roundHeaders.push(`${r} (${g.ticketPrice})`);
      } else {
        roundHeaders.push(String(r));
      }
    }

    const mainHeader = [
      "Sharks/Ván (cá/tờ)",
      ...roundHeaders,
      "Đóng hụi (cá)",
      "Hốt hụi (cá)",
      "Tổng cá sau khởi nghiệp"
    ];
    aoa.push(mainHeader);

    /* ================= NGƯỜI CHƠI ================= */
    members.forEach(name => {
      const row = [name];
      let totalBet = 0;
      let totalWin = 0;

      for (let r = 1; r <= maxRound; r++) {
        const g = games.find(x => x.round === r);
        if (!g) {
          row.push("");
          continue;
        }

        const pc = g.playerCards?.find(p => p.name === name);
        if (!pc) {
          row.push("");
          continue;
        }

        const betMoney = pc.cards * g.ticketPrice;
        totalBet += betMoney;

        if (Array.isArray(g.winners) && g.winners.includes(name)) {
          row.push("K");
          totalWin += g.share;
        } else {
          row.push(pc.cards);
        }
      }

      row.push(-totalBet);
      row.push(totalWin);
      row.push(totalWin - totalBet);

      aoa.push(row);
    });

    /* ================= DÒNG TRỐNG NGĂN CÁCH ================= */
    const emptyRow = [""];
    for (let i = 1; i <= maxRound + 3; i++) emptyRow.push("");
    aoa.push(emptyRow);

    /* ================= TỔNG HỤI / VÁN ================= */
    const totalRow = ["Tổng hụi/ván"];
    for (let r = 1; r <= maxRound; r++) {
      const g = games.find(x => x.round === r);
      if (!g || !Array.isArray(g.playerCards)) {
        totalRow.push("");
        continue;
      }

      const totalMoney = g.playerCards.reduce(
        (sum, p) => sum + p.cards * g.ticketPrice,
        0
      );
      totalRow.push(totalMoney);
    }
    totalRow.push("", "", "");
    aoa.push(totalRow);

    /* ================= KINH CHIA ================= */
    const kinhChiRow = ["Kinh chia"];
    for (let r = 1; r <= maxRound; r++) {
      const g = games.find(x => x.round === r);
      if (!g || !Array.isArray(g.winners) || g.winners.length === 0) {
        kinhChiRow.push("");
        continue;
      }
      kinhChiRow.push(Math.floor(g.total / g.winners.length));
    }
    kinhChiRow.push("", "", "");
    aoa.push(kinhChiRow);

    /* ================= TẠO SHEET ================= */
    const ws = XLSX.utils.aoa_to_sheet(aoa);

    /* ================= ĐỘ RỘNG CỘT ================= */
    const cols = [];
    for (let i = 0; i <= maxRound + 3; i++) {
      if (i === 0) cols.push({ wch: 18 });
      else if (i <= maxRound) cols.push({ wch: 8 });
      else cols.push({ wch: 18 });
    }
    ws["!cols"] = cols;

    /* ================= STYLE ================= */
    const range = XLSX.utils.decode_range(ws["!ref"]);
    const totalRowIndex = members.length + 2;
    const kinhRowIndex = members.length + 3;

    for (let R = 0; R <= range.e.r; R++) {
      for (let C = 0; C <= range.e.c; C++) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellRef]) ws[cellRef] = { t: "s", v: "" };

        ws[cellRef].s = {
          alignment: {
            horizontal: C === 0 ? "left" : "center",
            vertical: "center"
          },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        };

        if (R === 0) {
          ws[cellRef].s.font = { bold: true, color: { rgb: "FFFFFF" } };
          ws[cellRef].s.fill = { fgColor: { rgb: "4472C4" } };
        }

        if (ws[cellRef].v === "K") {
          ws[cellRef].s.fill = { fgColor: { rgb: "FFE699" } };
          ws[cellRef].s.font = { bold: true };
        }

        if (R === totalRowIndex) {
          ws[cellRef].s.fill = { fgColor: { rgb: "DDEBF7" } };
          ws[cellRef].s.font = { bold: true };
        }

        if (R === kinhRowIndex) {
          ws[cellRef].s.fill = { fgColor: { rgb: "FCE4D6" } };
          ws[cellRef].s.font = { bold: true };
        }

        if (C >= maxRound + 1 && typeof ws[cellRef].v === "number") {
          ws[cellRef].z = "#,##0";
          if (C === maxRound + 3 && ws[cellRef].v < 0) {
            ws[cellRef].s.font = { color: { rgb: "FF0000" } };
          }
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, sessionName.slice(0, 31));
  });

  XLSX.writeFile(
    wb,
    `Hui_Export_${new Date().toISOString().slice(0, 10)}.xlsx`
  );
}





