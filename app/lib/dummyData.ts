// ダミーデータ（DB未接続時用）

export const dummyTeams = [
  { id: "team-spring", name: "春組", color: "#ffb6c1" },
  { id: "team-summer", name: "夏組", color: "#ffd700" },
  { id: "team-autumn", name: "秋組", color: "#ff8c00" },
  { id: "team-winter", name: "冬組", color: "#87ceeb" },
];

export const dummySlides = [
  { id: "slide-1", filename: "slide1.jpg", order: 1 },
  { id: "slide-2", filename: "slide2.jpg", order: 2 },
  { id: "slide-3", filename: "slide3.jpg", order: 3 },
];

export const dummyScores = [
  { id: "score-spring", team_id: "team-spring", score: 100, visible: true },
  { id: "score-summer", team_id: "team-summer", score: 120, visible: true },
  { id: "score-autumn", team_id: "team-autumn", score: 80, visible: true },
  { id: "score-winter", team_id: "team-winter", score: 90, visible: true },
];

export const dummySlideState = {
  current_slide: "slide-1",
  effect: null,
};

export const dummyScoreState = {
  visible: true,
};
