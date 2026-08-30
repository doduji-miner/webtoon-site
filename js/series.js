/* ============================================================
   series.js - series.html (작품 상세/회차 목록) 전용 스크립트
   ============================================================ */

(function () {
  "use strict";

  function qs(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function escapeHTML(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function notFoundHTML() {
    return (
      '<div class="empty-note">작품을 찾을 수 없습니다.<br><br>' +
      '<a class="btn" href="index.html">목록으로 돌아가기</a></div>'
    );
  }

  function loadingHTML() {
    return '<div class="empty-note">불러오는 중...</div>';
  }

  function render() {
    var id = qs("id");
    var content = document.getElementById("content-area");

    if (!id) {
      content.innerHTML = notFoundHTML();
      return;
    }

    content.innerHTML = loadingHTML();

    Promise.all([WebtoonStore.getSeriesByIdAsync(id), WebtoonStore.getEpisodesForAsync(id)])
      .then(function (results) {
        var series = results[0];
        var episodes = results[1];

        if (!series) {
          content.innerHTML = notFoundHTML();
          return;
        }

        document.getElementById("title-bar-text").textContent =
          "WebToon Viewer 2000 - " + series.title;
        document.title = series.title + " - WebToon Viewer 2000";

        return WebtoonStore.getLikeCountAsync(series.id, null, series.likes).then(function (
          likeCount
        ) {
          return Promise.all(
            episodes.map(function (ep) {
              return WebtoonStore.getLikeCountAsync(series.id, ep.id, ep.likes || 0).then(function (
                epLikes
              ) {
                var copy = {};
                for (var k in ep) {
                  if (Object.prototype.hasOwnProperty.call(ep, k)) copy[k] = ep[k];
                }
                copy.likeCount = epLikes;
                return copy;
              });
            })
          ).then(function (episodesWithLikes) {
            renderSeries(series, likeCount, episodesWithLikes);
          });
        });
      })
      .catch(function (err) {
        console.error("[series] 작품 정보를 불러오지 못했습니다:", err);
        content.innerHTML =
          '<div class="empty-note">작품 정보를 불러오지 못했습니다. 새로고침해 주세요.</div>';
      });
  }

  function renderSeries(series, likeCount, episodes) {
    var content = document.getElementById("content-area");
    var statusClass = series.status === "완결" ? "status-done" : "status-ongoing";

    var genreTags = series.genres
      .map(function (g) {
        return '<span class="tag">' + escapeHTML(g) + "</span>";
      })
      .join("");

    var headHTML =
      '<div class="series-head">' +
        '<div class="series-thumb" style="background:' + series.color + '">' +
          escapeHTML(series.title.charAt(0)) +
        "</div>" +
        '<div class="series-info">' +
          "<h1>" + escapeHTML(series.title) + "</h1>" +
          '<div class="card-author">글·그림 ' + escapeHTML(series.author) + "</div>" +
          '<div class="card-meta" style="margin-top:6px;">' +
            '<span class="tag ' + statusClass + '">' + escapeHTML(series.status) + "</span>" +
            genreTags +
          "</div>" +
          '<p class="desc">' + escapeHTML(series.description) + "</p>" +
          '<div class="card-likes">&#9829; 관심 ' + likeCount + "</div>" +
        "</div>" +
      "</div>";

    var rowsHTML = episodes
      .map(function (ep) {
        return (
          '<a class="ep-row" href="viewer.html?series=' +
            encodeURIComponent(series.id) +
            "&ep=" +
            encodeURIComponent(ep.id) +
            '">' +
            '<span class="ep-title">' + escapeHTML(ep.title) + "</span>" +
            '<span class="ep-date">' + escapeHTML(ep.date || "") + "</span>" +
            '<span class="ep-likes">&#9829; ' + ep.likeCount + "</span>" +
          "</a>"
        );
      })
      .join("");

    var listHTML =
      '<div class="section-title">회차 목록 (총 ' + episodes.length + '화)</div>' +
      '<div class="listview">' +
        '<div class="listview-header"><span>제목</span><span>등록일</span><span>좋아요</span></div>' +
        (episodes.length
          ? rowsHTML
          : '<div class="empty-note">등록된 회차가 없습니다.</div>') +
      "</div>";

    content.innerHTML = headHTML + listHTML;
    document.getElementById("status-left").textContent = "회차 " + episodes.length + "개";
  }

  document.addEventListener("DOMContentLoaded", render);
})();
