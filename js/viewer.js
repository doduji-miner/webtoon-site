/* ============================================================
   viewer.js - viewer.html (세로 스크롤 뷰어 / 좋아요 / 댓글)
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

  function shade(hex, percent) {
    // hex(#rrggbb) 색상을 percent(-100~100)만큼 어둡게/밝게
    var num = parseInt(hex.replace("#", ""), 16);
    var r = (num >> 16) & 0xff;
    var g = (num >> 8) & 0xff;
    var b = num & 0xff;
    var t = percent < 0 ? 0 : 255;
    var p = Math.abs(percent) / 100;
    r = Math.round((t - r) * p + r);
    g = Math.round((t - g) * p + g);
    b = Math.round((t - b) * p + b);
    return "rgb(" + r + "," + g + "," + b + ")";
  }

  var unsubscribeComments = null;

  function notFoundHTML() {
    return (
      '<div class="empty-note">회차를 찾을 수 없습니다.<br><br>' +
      '<a class="btn" href="index.html">목록으로 돌아가기</a></div>'
    );
  }

  function panelStackHTML(series, episode) {
    if (episode.imageUrl) {
      return (
        '<div class="panel-stack">' +
          '<img class="panel-image" src="' + episode.imageUrl + '" alt="' + escapeHTML(episode.title) + '" loading="lazy">' +
        "</div>"
      );
    }
    var count = episode.panelCount || 5;
    var panels = [];
    for (var i = 0; i < count; i++) {
      var pct = (i % 2 === 0 ? -1 : 1) * (8 + (i % 3) * 6);
      panels.push(
        '<div class="panel" style="background:' + shade(series.color, pct) + '">' +
          "PANEL " + (i + 1) + " / " + count +
        "</div>"
      );
    }
    return '<div class="panel-stack">' + panels.join("") + "</div>";
  }

  function findNeighborIn(episodes, episodeId, dir) {
    var idx = -1;
    for (var i = 0; i < episodes.length; i++) {
      if (episodes[i].id === episodeId) idx = i;
    }
    if (idx === -1) return null;
    var target = idx + dir;
    if (target < 0 || target >= episodes.length) return null;
    return episodes[target];
  }

  function renderCommentList(list) {
    var box = document.getElementById("comment-list");
    if (!box) return; // 페이지 전환 등으로 이미 사라진 경우 방어
    if (!list.length) {
      box.innerHTML = '<div class="empty-note">첫 댓글을 남겨보세요.</div>';
      return;
    }
    box.innerHTML = list
      .map(function (c) {
        return (
          '<div class="comment-item">' +
            '<div class="comment-meta">' +
              '<span class="comment-author">' + escapeHTML(c.author) + "</span>" +
              "<span>" + escapeHTML(c.date) + "</span>" +
            "</div>" +
            "<div>" + escapeHTML(c.text) + "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  function render() {
    var seriesId = qs("series");
    var episodeId = qs("ep");
    var content = document.getElementById("content-area");

    if (!seriesId || !episodeId) {
      content.innerHTML = notFoundHTML();
      return;
    }

    content.innerHTML = '<div class="empty-note">불러오는 중...</div>';

    Promise.all([
      WebtoonStore.getEpisodeAsync(seriesId, episodeId),
      WebtoonStore.getEpisodesForAsync(seriesId)
    ])
      .then(function (results) {
        var found = results[0];
        var episodes = results[1];

        if (!found) {
          content.innerHTML = notFoundHTML();
          return;
        }

        var series = found.series;
        var episode = found.episode;
        var prevEp = findNeighborIn(episodes, episode.id, -1);
        var nextEp = findNeighborIn(episodes, episode.id, 1);

        return WebtoonStore.getLikeCountAsync(series.id, episode.id, episode.likes || 0).then(
          function (likeCount) {
            renderEpisode(series, episode, prevEp, nextEp, likeCount);
          }
        );
      })
      .catch(function (err) {
        console.error("[viewer] 회차를 불러오지 못했습니다:", err);
        content.innerHTML =
          '<div class="empty-note">회차를 불러오지 못했습니다. 새로고침해 주세요.</div>';
      });
  }

  function renderEpisode(series, episode, prevEp, nextEp, likeCount) {
    var content = document.getElementById("content-area");

    document.getElementById("title-bar-text").textContent =
      "WebToon Viewer 2000 - " + series.title + " " + episode.title;
    document.title = episode.title + " - " + series.title;
    document
      .getElementById("menu-series-link")
      .setAttribute("href", "series.html?id=" + encodeURIComponent(series.id));

    function epLink(ep) {
      return ep
        ? "viewer.html?series=" + encodeURIComponent(series.id) + "&ep=" + encodeURIComponent(ep.id)
        : null;
    }

    var liked = WebtoonStore.hasLiked(series.id, episode.id);

    var topNavHTML =
      '<div class="ep-nav">' +
        (prevEp
          ? '<a class="btn small" href="' + epLink(prevEp) + '">&laquo; 이전화</a>'
          : '<button class="btn small" disabled>&laquo; 이전화</button>') +
        '<a class="btn small" href="series.html?id=' + encodeURIComponent(series.id) + '">목록</a>' +
        (nextEp
          ? '<a class="btn small" href="' + epLink(nextEp) + '">다음화 &raquo;</a>'
          : '<button class="btn small" disabled>다음화 &raquo;</button>') +
      "</div>";

    var headerHTML =
      '<div class="viewer-toolbar">' +
        '<div class="viewer-title">' + escapeHTML(series.title) + " - " + escapeHTML(episode.title) + "</div>" +
        '<div class="hint">' + escapeHTML(episode.date || "") + "</div>" +
      "</div>";

    var endHTML =
      '<div class="viewer-end">이 회차의 마지막 컷입니다.</div>' +
      '<div class="viewer-actions">' +
        '<button id="like-btn" class="btn like-btn' + (liked ? " liked" : "") + '">' +
          "&#9829; <span id=\"like-count\">" + likeCount + "</span>" +
        "</button>" +
      "</div>";

    var remoteOn = WebtoonStore.isRemoteCommentsEnabled();
    var commentsStatusHTML = remoteOn
      ? '<p class="hint">&#9679; 모든 방문자에게 실시간으로 공유되는 댓글입니다.</p>'
      : '<p class="hint">&#9675; 아직 이 브라우저에만 저장됩니다. js/firebase-config.js를 설정하면 모두에게 공유돼요. (README 참고)</p>';

    var commentsHTML =
      '<div class="section-title">댓글</div>' +
      '<div class="comments-box">' +
        commentsStatusHTML +
        '<form id="comment-form" class="comment-form" autocomplete="off">' +
          '<input type="text" class="author-input" id="comment-author" placeholder="닉네임" maxlength="16" required>' +
          '<input type="text" class="text-input" id="comment-text" placeholder="댓글을 입력하세요" maxlength="200" required>' +
          '<button type="submit" class="btn small">등록</button>' +
        "</form>" +
        '<div class="listview"><div id="comment-list" class="comment-list"></div></div>' +
      "</div>";

    content.innerHTML =
      headerHTML +
      topNavHTML +
      panelStackHTML(series, episode) +
      endHTML +
      topNavHTML +
      commentsHTML;

    document.getElementById("status-left").textContent = episode.imageUrl
      ? "이미지 원고"
      : "패널 " + (episode.panelCount || 5) + "개";

    if (unsubscribeComments) {
      unsubscribeComments();
      unsubscribeComments = null;
    }
    unsubscribeComments = WebtoonStore.subscribeComments(series.id, episode.id, renderCommentList);

    document.getElementById("like-btn").addEventListener("click", function () {
      var btn = document.getElementById("like-btn");
      btn.disabled = true;
      WebtoonStore.toggleLikeAsync(series.id, episode.id)
        .then(function (nowLiked) {
          btn.classList.toggle("liked", nowLiked);
          return WebtoonStore.getLikeCountAsync(series.id, episode.id, episode.likes || 0);
        })
        .then(function (count) {
          document.getElementById("like-count").textContent = count;
        })
        .catch(function (err) {
          console.error("[viewer] 좋아요 처리 실패:", err);
        })
        .finally(function () {
          btn.disabled = false;
        });
    });

    document.getElementById("comment-form").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var form = ev.target;
      var submitBtn = form.querySelector('button[type="submit"]');
      var authorInput = document.getElementById("comment-author");
      var textInput = document.getElementById("comment-text");
      var author = authorInput.value.trim();
      var text = textInput.value.trim();
      if (!author || !text) return;
      var today = new Date().toISOString().slice(0, 10);

      submitBtn.disabled = true;
      WebtoonStore.addCommentRemote(series.id, episode.id, { author: author, text: text, date: today })
        .then(function () {
          textInput.value = "";
          // Firebase 미설정(localStorage 폴백)일 때는 실시간 구독이 없으므로 직접 갱신
          if (!WebtoonStore.isRemoteCommentsEnabled()) {
            renderCommentList(WebtoonStore.getComments(series.id, episode.id));
          }
        })
        .catch(function (err) {
          console.error("[viewer] 댓글 등록 실패:", err);
          alert("댓글 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        })
        .finally(function () {
          submitBtn.disabled = false;
        });
    });
  }

  document.addEventListener("DOMContentLoaded", render);
})();
