/* ============================================================
   data.js
   - 시드(예시) 웹툰 데이터 + 저장소 유틸(WebtoonStore)
   - js/firebase-config.js 를 설정하면 업로드/좋아요/댓글이 Firestore에
     저장되어 모든 방문자에게 공유됩니다(각 함수의 Async 버전 사용).
   - 설정하지 않으면 이 브라우저의 localStorage로 자동 폴백합니다
     (동기 버전 함수: getAllSeries, getEpisodesFor, getLikeCount 등).
   ============================================================ */

(function (global) {
  "use strict";

  var GENRES = ["판타지", "로맨스", "액션", "일상", "스릴러", "개그"];

  // ---- 시드 데이터 -------------------------------------------------
  // panelCount: 뷰어에서 세로로 이어붙일 자리표시 패널 개수
  var SEED_SERIES = [
    {
      id: "s1",
      title: "달빛 조각사",
      author: "김서연",
      genres: ["판타지", "액션"],
      status: "연재중",
      color: "#3a4a7a",
      description:
        "멸망한 왕국의 마지막 마법사가 달빛의 힘을 빌려 세상을 되찾는 이야기.",
      likes: 128,
      episodes: [
        { id: "e1", title: "1화. 각성", date: "2026-06-01", panelCount: 6, likes: 40 },
        { id: "e2", title: "2화. 폐허의 성", date: "2026-06-08", panelCount: 7, likes: 33 },
        { id: "e3", title: "3화. 첫 번째 계약", date: "2026-06-15", panelCount: 5, likes: 28 },
        { id: "e4", title: "4화. 그림자 추적자", date: "2026-06-22", panelCount: 8, likes: 27 }
      ]
    },
    {
      id: "s2",
      title: "오늘도 야근각",
      author: "박도윤",
      genres: ["일상", "개그"],
      status: "연재중",
      color: "#c98a2b",
      description: "3년 차 직장인의 웃프고 공감되는 사무실 생존기.",
      likes: 302,
      episodes: [
        { id: "e1", title: "1화. 월요일이 두 번", date: "2026-05-04", panelCount: 4, likes: 90 },
        { id: "e2", title: "2화. 회의는 늘어나고", date: "2026-05-11", panelCount: 5, likes: 84 },
        { id: "e3", title: "3화. 점심 메뉴 전쟁", date: "2026-05-18", panelCount: 4, likes: 75 },
        { id: "e4", title: "4화. 퇴근 10분 전", date: "2026-05-25", panelCount: 5, likes: 53 }
      ]
    },
    {
      id: "s3",
      title: "붉은 실",
      author: "이하은",
      genres: ["로맨스"],
      status: "완결",
      color: "#8a2b3a",
      description: "10년 만에 재회한 첫사랑, 엇갈린 인연을 다시 잇는 이야기.",
      likes: 511,
      episodes: [
        { id: "e1", title: "1화. 우연이라기엔", date: "2026-01-05", panelCount: 6, likes: 120 },
        { id: "e2", title: "2화. 옛 골목", date: "2026-01-12", panelCount: 6, likes: 110 },
        { id: "e3", title: "3화. 너의 자리", date: "2026-01-19", panelCount: 7, likes: 98 },
        { id: "e4", title: "완결화. 실의 끝에서", date: "2026-02-02", panelCount: 9, likes: 183 }
      ]
    },
    {
      id: "s4",
      title: "심야 배달부",
      author: "정민준",
      genres: ["스릴러", "액션"],
      status: "연재중",
      color: "#2b3a3a",
      description: "밤에만 나타나는 의뢰인들, 배달원 진호가 마주하는 도시의 비밀.",
      likes: 219,
      episodes: [
        { id: "e1", title: "1화. 마지막 주문", date: "2026-07-02", panelCount: 6, likes: 70 },
        { id: "e2", title: "2화. 12층 벨소리", date: "2026-07-09", panelCount: 7, likes: 65 },
        { id: "e3", title: "3화. 미행", date: "2026-07-16", panelCount: 6, likes: 55 }
      ]
    },
    {
      id: "s5",
      title: "고양이 학원장",
      author: "최유리",
      genres: ["일상", "판타지"],
      status: "연재중",
      color: "#3a6a4a",
      description: "말하는 고양이가 원장이 된 시골 초등학교의 좌충우돌 일지.",
      likes: 176,
      episodes: [
        { id: "e1", title: "1화. 새 원장님", date: "2026-04-03", panelCount: 5, likes: 60 },
        { id: "e2", title: "2화. 급식 사건", date: "2026-04-10", panelCount: 5, likes: 52 },
        { id: "e3", title: "3화. 운동회", date: "2026-04-17", panelCount: 6, likes: 44 }
      ]
    },
    {
      id: "s6",
      title: "저격수의 은퇴",
      author: "한지훈",
      genres: ["액션", "스릴러"],
      status: "완결",
      color: "#4a2b6a",
      description: "은퇴를 앞둔 최고의 저격수에게 걸려온 마지막 의뢰.",
      likes: 388,
      episodes: [
        { id: "e1", title: "1화. 마지막 표적", date: "2025-11-03", panelCount: 7, likes: 130 },
        { id: "e2", title: "2화. 배신의 신호", date: "2025-11-10", panelCount: 8, likes: 121 },
        { id: "e3", title: "완결화. 총성 이후", date: "2025-11-17", panelCount: 9, likes: 137 }
      ]
    }
  ];

  // ---- localStorage 키 ---------------------------------------------
  var LS_USER_SERIES = "webtoon.userSeries"; // 사용자가 업로드한 작품/회차
  var LS_LIKES = "webtoon.likes"; // 추가 좋아요 수 (시드 위에 누적)
  var LS_LIKED_FLAGS = "webtoon.likedFlags"; // 이미 좋아요 눌렀는지 여부
  var LS_COMMENTS = "webtoon.comments"; // 댓글 (Firebase 미설정 시 폴백 저장소)

  // ---- Firebase(Firestore) 연동 ---------------------------------------
  // js/firebase-config.js 에 실제 프로젝트 값을 채워 넣으면
  // 댓글이 모든 방문자에게 실시간으로 공유됩니다.
  // 설정하지 않으면 자동으로 이 브라우저의 localStorage로 동작합니다.
  var firebaseReady = false;
  var db = null;
  (function initFirebase() {
    try {
      var cfg = global.FIREBASE_CONFIG;
      var hasFirebaseSdk = !!(global.firebase && global.firebase.initializeApp);
      var hasRealConfig =
        cfg && cfg.apiKey && cfg.projectId && cfg.apiKey.indexOf("여기에") === -1;
      if (hasFirebaseSdk && hasRealConfig) {
        global.firebase.initializeApp(cfg);
        db = global.firebase.firestore();
        firebaseReady = true;
      }
    } catch (e) {
      firebaseReady = false;
      db = null;
    }
  })();

  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* 저장 실패는 조용히 무시 (예: 프라이빗 모드) */
    }
  }

  function makeLocalId(prefix) {
    return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  // ---- 공개 API ------------------------------------------------------
  var Store = {
    GENRES: GENRES,

    // 시드 + 사용자가 업로드한 작품을 합쳐서 반환
    getAllSeries: function () {
      var userSeries = readJSON(LS_USER_SERIES, []);
      return SEED_SERIES.concat(userSeries);
    },

    getSeriesById: function (id) {
      var all = this.getAllSeries();
      for (var i = 0; i < all.length; i++) {
        if (all[i].id === id) return all[i];
      }
      return null;
    },

    getEpisode: function (seriesId, episodeId) {
      var series = this.getSeriesById(seriesId);
      if (!series) return null;
      for (var i = 0; i < series.episodes.length; i++) {
        if (series.episodes[i].id === episodeId) {
          return { episode: series.episodes[i], series: series, index: i };
        }
      }
      return null;
    },

    addUserSeries: function (series) {
      var userSeries = readJSON(LS_USER_SERIES, []);
      userSeries.push(series);
      writeJSON(LS_USER_SERIES, userSeries);
    },

    addEpisodeToSeries: function (seriesId, episode) {
      var userSeries = readJSON(LS_USER_SERIES, []);
      var found = null;
      for (var i = 0; i < userSeries.length; i++) {
        if (userSeries[i].id === seriesId) found = userSeries[i];
      }
      if (found) {
        found.episodes.push(episode);
        writeJSON(LS_USER_SERIES, userSeries);
        return true;
      }
      // 시드 작품에는 회차를 영구 추가할 수 없으므로,
      // 이 브라우저 세션에서만 보이는 "로컬 회차 저장소"에 넣는다.
      var extra = readJSON("webtoon.seedEpisodeExtras", {});
      if (!extra[seriesId]) extra[seriesId] = [];
      extra[seriesId].push(episode);
      writeJSON("webtoon.seedEpisodeExtras", extra);
      return true;
    },

    // 시드 작품에 로컬로 추가된 회차까지 합쳐서 반환
    getEpisodesFor: function (seriesId) {
      var series = this.getSeriesById(seriesId);
      if (!series) return [];
      var isUserSeries = readJSON(LS_USER_SERIES, []).some(function (s) {
        return s.id === seriesId;
      });
      if (isUserSeries) return series.episodes;
      var extra = readJSON("webtoon.seedEpisodeExtras", {})[seriesId] || [];
      return series.episodes.concat(extra);
    },

    // ---- 작품/회차: Firebase(Firestore) 연동 ----------------------------
    // 설정돼 있으면 "series"/"episodes" 컬렉션에 저장되어 모든 방문자에게
    // 공유되고, 미설정이면 위의 localStorage 기반 함수로 자동 폴백합니다.
    isRemoteContentEnabled: function () {
      return firebaseReady;
    },

    // 시드 + (Firestore 또는 localStorage의) 사용자 업로드 작품을 합쳐서 반환
    getAllSeriesAsync: function () {
      var self = this;
      if (!firebaseReady) {
        return Promise.resolve(this.getAllSeries());
      }
      return db
        .collection("series")
        .orderBy("createdAt", "asc")
        .get()
        .then(function (snap) {
          var userSeries = [];
          snap.forEach(function (doc) {
            var d = doc.data();
            userSeries.push({
              id: doc.id,
              title: d.title,
              author: d.author,
              genres: d.genres || [],
              status: d.status,
              color: d.color,
              description: d.description,
              likes: d.likes || 0,
              episodes: [] // 회차는 getEpisodesForAsync로 별도 조회
            });
          });
          return SEED_SERIES.concat(userSeries);
        })
        .catch(function (err) {
          console.error("[WebtoonStore] Firestore 작품 목록 조회 실패:", err);
          return self.getAllSeries();
        });
    },

    getSeriesByIdAsync: function (id) {
      return this.getAllSeriesAsync().then(function (all) {
        for (var i = 0; i < all.length; i++) {
          if (all[i].id === id) return all[i];
        }
        return null;
      });
    },

    // 시드 작품에 로컬/Firestore로 추가된 회차까지 합쳐서 반환
    getEpisodesForAsync: function (seriesId) {
      var self = this;
      if (!firebaseReady) {
        return Promise.resolve(this.getEpisodesFor(seriesId));
      }
      return this.getSeriesByIdAsync(seriesId).then(function (series) {
        if (!series) return [];
        return db
          .collection("episodes")
          .where("seriesId", "==", seriesId)
          .orderBy("createdAt", "asc")
          .get()
          .then(function (snap) {
            var extra = [];
            snap.forEach(function (doc) {
              var d = doc.data();
              extra.push({
                id: doc.id,
                title: d.title,
                date: d.date,
                panelCount: d.panelCount,
                likes: d.likes || 0
              });
            });
            return series.episodes.concat(extra);
          })
          .catch(function (err) {
            console.error("[WebtoonStore] Firestore 회차 목록 조회 실패:", err);
            return series.episodes;
          });
      });
    },

    // { series, episode, index } 형태로 반환 (뷰어에서 사용)
    getEpisodeAsync: function (seriesId, episodeId) {
      return Promise.all([
        this.getSeriesByIdAsync(seriesId),
        this.getEpisodesForAsync(seriesId)
      ]).then(function (results) {
        var series = results[0];
        var episodes = results[1];
        if (!series) return null;
        for (var i = 0; i < episodes.length; i++) {
          if (episodes[i].id === episodeId) {
            return { series: series, episode: episodes[i], index: i };
          }
        }
        return null;
      });
    },

    // 신규 작품 등록. Promise<새 작품 id>를 반환.
    addUserSeriesAsync: function (series) {
      if (!firebaseReady) {
        var localId = series.id || makeLocalId("u");
        this.addUserSeries({
          id: localId,
          title: series.title,
          author: series.author,
          genres: series.genres,
          status: series.status,
          color: series.color,
          description: series.description,
          likes: 0,
          episodes: []
        });
        return Promise.resolve(localId);
      }
      return db
        .collection("series")
        .add({
          title: series.title,
          author: series.author,
          genres: series.genres,
          status: series.status,
          color: series.color,
          description: series.description,
          likes: 0,
          createdAt: global.firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(function (ref) {
          return ref.id;
        });
    },

    // 회차 추가(신규 업로드 작품이든 시드 작품이든 동일하게 동작). Promise<새 회차 id>를 반환.
    addEpisodeToSeriesAsync: function (seriesId, episode) {
      if (!firebaseReady) {
        var localId = episode.id || makeLocalId("e");
        this.addEpisodeToSeries(seriesId, {
          id: localId,
          title: episode.title,
          date: episode.date,
          panelCount: episode.panelCount,
          likes: 0
        });
        return Promise.resolve(localId);
      }
      return db
        .collection("episodes")
        .add({
          seriesId: seriesId,
          title: episode.title,
          date: episode.date,
          panelCount: episode.panelCount,
          likes: 0,
          createdAt: global.firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(function (ref) {
          return ref.id;
        });
    },

    likeKey: function (seriesId, episodeId) {
      return episodeId ? seriesId + ":" + episodeId : seriesId;
    },

    // ---- 좋아요: localStorage 폴백 (Firebase 미설정 시 사용, 동기) -------
    getLikeCount: function (seriesId, episodeId, baseCount) {
      var likes = readJSON(LS_LIKES, {});
      var key = this.likeKey(seriesId, episodeId);
      return baseCount + (likes[key] || 0);
    },

    hasLiked: function (seriesId, episodeId) {
      var flags = readJSON(LS_LIKED_FLAGS, {});
      return !!flags[this.likeKey(seriesId, episodeId)];
    },

    toggleLike: function (seriesId, episodeId) {
      var flags = readJSON(LS_LIKED_FLAGS, {});
      var likes = readJSON(LS_LIKES, {});
      var key = this.likeKey(seriesId, episodeId);
      var liked = !!flags[key];
      if (liked) {
        flags[key] = false;
        likes[key] = Math.max(0, (likes[key] || 0) - 1);
      } else {
        flags[key] = true;
        likes[key] = (likes[key] || 0) + 1;
      }
      writeJSON(LS_LIKED_FLAGS, flags);
      writeJSON(LS_LIKES, likes);
      return !liked;
    },

    // ---- 좋아요: Firebase(Firestore) 연동 (비동기) -----------------------
    // 실제 집계는 "likeCounts/{key}" 문서의 count 필드에 누적하고,
    // 화면에는 baseCount(작품/회차 기본 좋아요 수) + count를 더해서 보여준다.
    // 중복 좋아요 방지 플래그는 로그인 기능이 없으므로 이 브라우저 기준(localStorage)으로 유지한다.
    getLikeCountAsync: function (seriesId, episodeId, baseCount) {
      if (!firebaseReady) {
        return Promise.resolve(this.getLikeCount(seriesId, episodeId, baseCount));
      }
      var key = this.likeKey(seriesId, episodeId);
      return db
        .collection("likeCounts")
        .doc(key)
        .get()
        .then(function (doc) {
          var extra = doc.exists ? doc.data().count || 0 : 0;
          return baseCount + extra;
        })
        .catch(function () {
          return baseCount;
        });
    },

    toggleLikeAsync: function (seriesId, episodeId) {
      var self = this;
      if (!firebaseReady) {
        return Promise.resolve(this.toggleLike(seriesId, episodeId));
      }
      var flags = readJSON(LS_LIKED_FLAGS, {});
      var key = this.likeKey(seriesId, episodeId);
      var liked = !!flags[key];
      var delta = liked ? -1 : 1;
      var ref = db.collection("likeCounts").doc(key);
      return db
        .runTransaction(function (tx) {
          return tx.get(ref).then(function (doc) {
            var current = doc.exists ? doc.data().count || 0 : 0;
            var next = Math.max(0, current + delta);
            tx.set(ref, { count: next }, { merge: true });
          });
        })
        .then(function () {
          flags[key] = !liked;
          writeJSON(LS_LIKED_FLAGS, flags);
          return !liked;
        })
        .catch(function (err) {
          console.error("[WebtoonStore] 좋아요 갱신 실패:", err);
          return liked; // 실패 시 상태 변화 없음을 알림
        });
    },

    // ---- 댓글: localStorage 폴백 (Firebase 미설정 시 사용) -------------
    getComments: function (seriesId, episodeId) {
      var all = readJSON(LS_COMMENTS, {});
      return all[this.likeKey(seriesId, episodeId)] || [];
    },

    addComment: function (seriesId, episodeId, comment) {
      var all = readJSON(LS_COMMENTS, {});
      var key = this.likeKey(seriesId, episodeId);
      if (!all[key]) all[key] = [];
      all[key].push(comment);
      writeJSON(LS_COMMENTS, all);
    },

    // ---- 댓글: Firebase(Firestore) 연동 ---------------------------------
    // firebase-config.js 설정 여부에 따라 실시간 공유(Firestore) 또는
    // 이 브라우저 전용(localStorage)으로 자동 전환됩니다.
    isRemoteCommentsEnabled: function () {
      return firebaseReady;
    },

    // 댓글 목록을 실시간으로 구독한다. onChange(list)가 데이터가 바뀔 때마다 호출된다.
    // 반환값은 구독 해제 함수(unsubscribe).
    subscribeComments: function (seriesId, episodeId, onChange) {
      var self = this;
      if (firebaseReady) {
        var query = db
          .collection("comments")
          .where("seriesId", "==", seriesId)
          .where("episodeId", "==", episodeId)
          .orderBy("createdAt", "asc");
        return query.onSnapshot(
          function (snapshot) {
            var list = [];
            snapshot.forEach(function (doc) {
              var d = doc.data();
              list.push({ author: d.author, text: d.text, date: d.date });
            });
            onChange(list);
          },
          function (err) {
            // 규칙/네트워크 오류 시 로컬 저장소로 폴백
            console.error("[WebtoonStore] Firestore 댓글 구독 실패:", err);
            onChange(self.getComments(seriesId, episodeId));
          }
        );
      }
      // Firebase 미설정: 즉시 localStorage 값을 한 번 전달
      onChange(self.getComments(seriesId, episodeId));
      return function unsubscribe() {};
    },

    // 댓글을 추가한다. Firebase가 설정돼 있으면 Firestore에, 아니면 localStorage에 저장.
    // Promise를 반환(둘 다 async 흐름으로 다룰 수 있도록).
    addCommentRemote: function (seriesId, episodeId, comment) {
      if (firebaseReady) {
        return db.collection("comments").add({
          seriesId: seriesId,
          episodeId: episodeId,
          author: comment.author,
          text: comment.text,
          date: comment.date,
          createdAt: global.firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      this.addComment(seriesId, episodeId, comment);
      return Promise.resolve();
    }
  };

  global.WebtoonStore = Store;
})(window);
