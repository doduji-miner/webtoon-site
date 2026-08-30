/* ============================================================
   main.js - index.html (작품 목록) 전용 스크립트
   ============================================================ */

(function () {
  "use strict";

  var state = {
    genre: "전체",
    query: ""
  };

  // 최초 1회만 서버(Firestore 또는 localStorage)에서 불러와 캐시해두고,
  // 검색/장르 필터는 이 캐시로 계산한다(입력할 때마다 다시 조회하지 않음).
  var cache = null;

  function buildGenreChips() {
    var wrap = document.getElementById("genre-chips");
    var genres = ["전체"].concat(WebtoonStore.GENRES);
    wrap.innerHTML = "";
    genres.forEach(function (g) {
      var a = document.createElement("a");
      a.href = "#";
      a.className = "genre-chip" + (g === state.genre ? " active" : "");
      a.textContent = g;
      a.addEventListener("click", function (ev) {
        ev.preventDefault();
        state.genre = g;
        render();
      });
      wrap.appendChild(a);
    });
  }

  function escapeHTML(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function filterSeries() {
    var q = state.query.trim().toLowerCase();
    return (cache || []).filter(function (s) {
      var genreOk = state.genre === "전체" || s.genres.indexOf(state.genre) !== -1;
      if (!genreOk) return false;
      if (!q) return true;
      return (
        s.title.toLowerCase().indexOf(q) !== -1 ||
        s.author.toLowerCase().indexOf(q) !== -1
      );
    });
  }

  function cardHTML(series) {
    var statusClass = series.status === "완결" ? "status-done" : "status-ongoing";
    var genresText = series.genres.join(", ");
    return (
      '<a class="card" href="series.html?id=' + encodeURIComponent(series.id) + '">' +
        '<div class="card-thumb" style="background:' + series.color + '">' +
          escapeHTML(series.title.charAt(0)) +
        "</div>" +
        '<div class="card-title">' + escapeHTML(series.title) + "</div>" +
        '<div class="card-author">' + escapeHTML(series.author) + "</div>" +
        '<div class="card-meta">' +
          '<span class="tag ' + statusClass + '">' + escapeHTML(series.status) + "</span>" +
          '<span class="tag">' + escapeHTML(genresText) + "</span>" +
        "</div>" +
        '<div class="card-likes">&#9829; ' + series.likeCount + "</div>" +
      "</a>"
    );
  }

  function render() {
    buildGenreChips();
    var list = filterSeries();
    var grid = document.getElementById("card-grid");
    var countEl = document.getElementById("result-count");
    var statusTotal = document.getElementById("status-total");

    if (list.length === 0) {
      grid.innerHTML = '<div class="empty-note">조건에 맞는 작품이 없습니다.</div>';
    } else {
      grid.innerHTML = list.map(cardHTML).join("");
    }

    countEl.textContent =
      (state.genre === "전체" ? "전체 장르" : state.genre) +
      (state.query ? " · '" + state.query + "' 검색 결과" : "") +
      " - " + list.length + "개";

    statusTotal.textContent = "작품 " + (cache ? cache.length : 0) + "개";
  }

  function loadAndRender() {
    var grid = document.getElementById("card-grid");
    grid.innerHTML = '<div class="empty-note">불러오는 중...</div>';

    return WebtoonStore.getAllSeriesAsync()
      .then(function (list) {
        return Promise.all(
          list.map(function (s) {
            return WebtoonStore.getLikeCountAsync(s.id, null, s.likes).then(function (count) {
              var copy = {};
              for (var k in s) {
                if (Object.prototype.hasOwnProperty.call(s, k)) copy[k] = s[k];
              }
              copy.likeCount = count;
              return copy;
            });
          })
        );
      })
      .then(function (withLikes) {
        cache = withLikes;
        render();
      })
      .catch(function (err) {
        console.error("[main] 작품 목록 불러오기 실패:", err);
        grid.innerHTML = '<div class="empty-note">목록을 불러오지 못했습니다. 새로고침해 주세요.</div>';
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var searchInput = document.getElementById("search-input");
    searchInput.addEventListener("input", function () {
      state.query = searchInput.value;
      render();
    });
    var storageEl = document.getElementById("status-storage");
    if (storageEl) {
      storageEl.textContent = WebtoonStore.isRemoteContentEnabled()
        ? "WebToon Viewer 2000 - Firebase 연동됨 (모두에게 공유)"
        : "WebToon Viewer 2000 - 브라우저 로컬 저장소 사용";
    }
    loadAndRender();
  });
})();
