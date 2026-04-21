/* global Phaser */
import { SalonScene } from './salon-scene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 640,
  backgroundColor: '#FFF0F5',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [SalonScene],
};

new Phaser.Game(config);
