/*
Verwaltet den Spielzustand
*/
export const state = {
  
  //Canvas
  tileSize: 1,

  //Level
  currentLevelIndex: 0,
  currentLevel: null,
  mirrors: [],
  moveCount: 0,
  gameStarted: false,

  //Drag
  draggingMirrorId: null,
  dragStartGrid: null,

  //Rotation
  rotationMirrorId: null,
  rotationStartAngle: null,
  rotationChanged: false,
  rotationPrevAngle: null,

  //Double Tap
  lastTapTime: 0,

  //Laser
  laserPath: [],
  laserAnimating: false,
  laserAnimationProgress: 0,
};
