/* ============================================================
   upload.js - upload.html (작가 업로드 페이지) 전용 스크립트
   ============================================================ */

(function () {
  "use strict";

  var PALETTE = [
    "#3a4a7a", "#c98a2b", "#8a2b3a", "#2b3a3a",
    "#3a6a4a", "#4a2b6a", "#2b5a7a", "#7a3a2b"
  ];

  function escapeHTML(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function buildGenreCheckboxes() {
    var wrap = document.getElementById("s-genres");
    wrap.innerHTML = WebtoonStore.GENRES.map(function (g) {
      var id = "genre-" + g;
      return (
        '<label><input type="checkbox" name="s-genre" value="' + escapeHTML(g) + '" id="' + id + '"> ' +
        escapeHTML(g) +
        "</label>"
      );
    }).join("");
  }

  function buildSeriesSelect() {
    var select = document.getElementById("e-series");
    select.innerHTML = '<option value="">불러오는 중...</option>';
    return WebtoonStore.getAllSeriesAsync().then(function (all) {
      select.innerHTML = all
        .map(function (s) {
          return (
            '<option value="' + escapeHTML(s.id) + '">' +
            escapeHTML(s.title) + " (" + escapeHTML(s.author) + ")" +
            "</option>"
          );
        })
        .join("");
    });
  }

  function showResult(elId, message, ok, linkHref, linkText) {
    var el = document.getElementById(elId);
    var color = ok ? "var(--ok)" : "var(--done)";
    var link = linkHref
      ? ' <a href="' + linkHref + '">' + escapeHTML(linkText) + "</a>"
      : "";
    el.innerHTML =
      '<p class="hint" style="color:' + color + ';margin-top:8px;">' + escapeHTML(message) + link + "</p>";
  }

  function shareNote() {
    return WebtoonStore.isRemoteContentEnabled()
      ? "(모든 방문자에게 공유됨)"
      : "(이 브라우저에만 저장됨 - firebase-config.js 설정 시 모두에게 공유)";
  }

  function handleSeriesSubmit(ev) {
    ev.preventDefault();
    var form = ev.target;
    var submitBtn = form.querySelector('button[type="submit"]');
    var title = document.getElementById("s-title").value.trim();
    var author = document.getElementById("s-author").value.trim();
    var status = document.getElementById("s-status").value;
    var desc = document.getElementById("s-desc").value.trim();
    var genreBoxes = document.querySelectorAll('input[name="s-genre"]:checked');
    var genres = Array.prototype.map.call(genreBoxes, function (cb) {
      return cb.value;
    });

    if (!title || !author) {
      showResult("series-result", "작품명과 작가명을 입력해 주세요.", false);
      return;
    }
    if (genres.length === 0) {
      showResult("series-result", "장르를 1개 이상 선택해 주세요.", false);
      return;
    }

    var color = PALETTE[Math.floor(Math.random() * PALETTE.length)];

    submitBtn.disabled = true;
    WebtoonStore.addUserSeriesAsync({
      title: title,
      author: author,
      genres: genres,
      status: status,
      color: color,
      description: desc || "소개가 아직 등록되지 않았습니다."
    })
      .then(function (id) {
        document.getElementById("series-form").reset();
        return buildSeriesSelect().then(function () {
          showResult(
            "series-result",
            "'" + title + "' 작품이 등록되었습니다. " + shareNote(),
            true,
            "series.html?id=" + encodeURIComponent(id),
            "작품 페이지 보기 →"
          );
        });
      })
      .catch(function (err) {
        console.error("[upload] 작품 등록 실패:", err);
        showResult("series-result", "작품 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.", false);
      })
      .finally(function () {
        submitBtn.disabled = false;
      });
  }

  function handleEpisodeSubmit(ev) {
    ev.preventDefault();
    var form = ev.target;
    var submitBtn = form.querySelector('button[type="submit"]');
    var seriesId = document.getElementById("e-series").value;
    var title = document.getElementById("e-title").value.trim();
    var date = document.getElementById("e-date").value || todayStr();
    var panelsRaw = document.getElementById("e-panels").value.trim();
    var panelCount = parseInt(panelsRaw, 10);

    if (!seriesId) {
      showResult("episode-result", "작품을 먼저 등록해 주세요.", false);
      return;
    }
    if (!title) {
      showResult("episode-result", "회차 제목을 입력해 주세요.", false);
      return;
    }
    if (!panelCount || panelCount < 1) panelCount = 5;
    if (panelCount > 20) panelCount = 20;

    submitBtn.disabled = true;
    WebtoonStore.addEpisodeToSeriesAsync(seriesId, {
      title: title,
      date: date,
      panelCount: panelCount
    })
      .then(function (episodeId) {
        document.getElementById("episode-form").reset();
        document.getElementById("e-panels").value = 5;
        document.getElementById("e-date").value = todayStr();

        showResult(
          "episode-result",
          "'" + title + "' 회차가 등록되었습니다. " + shareNote(),
          true,
          "viewer.html?series=" + encodeURIComponent(seriesId) + "&ep=" + encodeURIComponent(episodeId),
          "회차 보기 →"
        );
      })
      .catch(function (err) {
        console.error("[upload] 회차 등록 실패:", err);
        showResult("episode-result", "회차 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.", false);
      })
      .finally(function () {
        submitBtn.disabled = false;
      });
  }

  function renderStorageNotice() {
    var el = document.getElementById("storage-notice");
    if (WebtoonStore.isRemoteContentEnabled()) {
      el.innerHTML =
        "이 사이트는 Firebase(Firestore)와 연동되어 있습니다. 여기서 등록한 작품/회차는 " +
        "<b>모든 방문자에게</b> 보입니다. (표지 이미지는 아직 지원하지 않아 대표 색상으로 대체됩니다)";
    } else {
      el.innerHTML =
        "아직 Firebase가 설정되지 않았습니다. 지금 등록하는 작품/회차는 " +
        "<b>이 브라우저에만</b> 저장되며 다른 사람에게는 보이지 않습니다. " +
        "js/firebase-config.js를 설정하면 모두에게 공유됩니다. (README 참고)";
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderStorageNotice();
    buildGenreCheckboxes();
    buildSeriesSelect();
    document.getElementById("e-date").value = todayStr();
    document.getElementById("series-form").addEventListener("submit", handleSeriesSubmit);
    document.getElementById("episode-form").addEventListener("submit", handleEpisodeSubmit);
  });
})();
