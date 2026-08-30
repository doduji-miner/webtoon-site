/* ============================================================
   upload.js - upload.html (작가 업로드 페이지) 전용 스크립트
   ============================================================ */

(function () {
  "use strict";

  var PALETTE = [
    "#3a4a7a", "#c98a2b", "#8a2b3a", "#2b3a3a",
    "#3a6a4a", "#4a2b6a", "#2b5a7a", "#7a3a2b"
  ];

  var MAX_IMAGE_BYTES = 10 * 1024 * 1024; // Cloudinary 무료 플랜 이미지 업로드 한도(10MB)와 동일

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
    var imageInput = document.getElementById("e-image");
    var imageFile = imageInput.files && imageInput.files[0];

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

    if (imageFile && !WebtoonStore.isImageUploadEnabled()) {
      showResult(
        "episode-result",
        "이미지 업로드는 Cloudinary 설정이 필요합니다. js/cloudinary-config.js를 채워주세요 (README 참고). 지금은 이미지 없이 등록해 주세요.",
        false
      );
      return;
    }
    if (imageFile && imageFile.size > MAX_IMAGE_BYTES) {
      showResult("episode-result", "이미지 용량이 너무 큽니다 (최대 10MB).", false);
      return;
    }

    submitBtn.disabled = true;

    var uploadStep = imageFile
      ? (function () {
          showResult("episode-result", "이미지 업로드 중...", true);
          return WebtoonStore.uploadEpisodeImage(imageFile);
        })()
      : Promise.resolve(null);

    uploadStep
      .then(function (imageUrl) {
        return WebtoonStore.addEpisodeToSeriesAsync(seriesId, {
          title: title,
          date: date,
          panelCount: panelCount,
          imageUrl: imageUrl
        });
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
        showResult(
          "episode-result",
          "회차 등록에 실패했습니다: " + (err && err.message ? err.message : "알 수 없는 오류"),
          false
        );
      })
      .finally(function () {
        submitBtn.disabled = false;
      });
  }

  function renderStorageNotice() {
    var el = document.getElementById("storage-notice");
    var lines = [];
    if (WebtoonStore.isRemoteContentEnabled()) {
      lines.push(
        "이 사이트는 Firebase(Firestore)와 연동되어 있습니다. 여기서 등록한 작품/회차는 <b>모든 방문자에게</b> 보입니다."
      );
    } else {
      lines.push(
        "아직 Firebase가 설정되지 않았습니다. 지금 등록하는 작품/회차는 <b>이 브라우저에만</b> 저장되며 다른 사람에게는 보이지 않습니다. js/firebase-config.js를 설정하면 모두에게 공유됩니다. (README 참고)"
      );
    }
    if (WebtoonStore.isImageUploadEnabled()) {
      lines.push("웹툰 이미지 업로드(Cloudinary)도 연동되어 있어 실제 원고 이미지를 올릴 수 있습니다.");
    } else {
      lines.push(
        "이미지 업로드는 아직 설정되지 않아 비활성화되어 있습니다. js/cloudinary-config.js를 설정하면 실제 이미지를 올릴 수 있습니다. (README 참고)"
      );
    }
    el.innerHTML = lines.join(" ");
  }

  function applyImageUploadAvailability() {
    var imageInput = document.getElementById("e-image");
    var hint = document.getElementById("e-image-hint");
    if (!WebtoonStore.isImageUploadEnabled()) {
      imageInput.disabled = true;
      hint.textContent = "이미지 업로드가 아직 설정되지 않았습니다. (README의 Cloudinary 연동 참고)";
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderStorageNotice();
    applyImageUploadAvailability();
    buildGenreCheckboxes();
    buildSeriesSelect();
    document.getElementById("e-date").value = todayStr();
    document.getElementById("series-form").addEventListener("submit", handleSeriesSubmit);
    document.getElementById("episode-form").addEventListener("submit", handleEpisodeSubmit);
  });
})();
