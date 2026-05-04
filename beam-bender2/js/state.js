export const state = {
  tileSize: 1,

  currentLevelIndex: 0,
  currentLevel: null,
  mirrors: [],
  moveCount: 0,
  gameStarted: false,

  draggingMirrorId: null,
  dragStartGrid: null,

  rotationMirrorId: null,
  rotationStartAngle: null,
  rotationChanged: false,
  rotationPrevAngle: null,

  lastTapTime: 0,

  laserPath: [],
  laserAnimating: false,
  laserAnimationProgress: 0,
};
