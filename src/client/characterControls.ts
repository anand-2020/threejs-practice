import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
const W = "w";
const A = "a";
const S = "s";
const D = "d";
const DIRECTIONS = [W, A, S, D];

export class CharacterControls {
  model: THREE.Group;
  mixer: THREE.AnimationMixer;
  animationsMap: Map<string, THREE.AnimationAction> = new Map(); // Walk, Run, Idle
  orbitControl: OrbitControls;
  camera: THREE.Camera;

  // state
  toggleRun: boolean = true;
  currentAction: string;
  isMyAvatar: boolean;

  // temporary data
  walkDirection = new THREE.Vector3();
  rotateAngle = new THREE.Vector3(0, 1, 0);
  rotateQuarternion: THREE.Quaternion = new THREE.Quaternion();
  cameraTarget = new THREE.Vector3();

  // constants
  fadeDuration: number = 0.5;
  runVelocity = 5;
  walkVelocity = 2;

  constructor(
    model: THREE.Group,
    mixer: THREE.AnimationMixer,
    animationsMap: Map<string, THREE.AnimationAction>,
    orbitControl: OrbitControls,
    camera: THREE.Camera,
    currentAction: string,
    isMyAvatar: boolean
  ) {
    this.model = model;
    this.mixer = mixer;
    this.animationsMap = animationsMap;
    this.currentAction = currentAction;
    this.animationsMap.forEach((value, key) => {
      if (key == currentAction) {
        value.play();
      }
    });
    this.orbitControl = orbitControl;
    this.camera = camera;
    this.updateCameraTarget(0, 0);
    this.isMyAvatar = isMyAvatar;
  }

  public switchRunToggle() {
    this.toggleRun = !this.toggleRun;
  }

  public update(delta: number, keysPressed: any) {
    const directionPressed = DIRECTIONS.some((key) => keysPressed[key] == true);

    var play = "";
    if (directionPressed && this.toggleRun) {
      play = "mixamo.com";
    } else if (directionPressed) {
      play = "mixamo.com";
    } else {
      play = "Idle";
    }

    if (this.currentAction != play) {
      const toPlay = this.animationsMap.get(play);
      const current = this.animationsMap.get(this.currentAction);

      current?.fadeOut(this.fadeDuration);
      toPlay?.reset().fadeIn(this.fadeDuration).play();

      this.currentAction = play;
    }

    this.mixer.update(delta);

    if (
      this.currentAction == "mixamo.com" ||
      this.currentAction == "mixamo.com"
    ) {
      // calculate towards camera direction
      var angleYCameraDirection = Math.atan2(
        this.camera.position.x - this.model.position.x,
        this.camera.position.z - this.model.position.z
      );
      // diagonal movement angle offset
      var directionOffset = this.directionOffset(keysPressed);

      // rotate model
      this.rotateQuarternion.setFromAxisAngle(
        this.rotateAngle,
        angleYCameraDirection + directionOffset
      );
      this.model.quaternion.rotateTowards(this.rotateQuarternion, 0.2);

      // calculate direction
      this.camera.getWorldDirection(this.walkDirection);
      this.walkDirection.y = 0;
      this.walkDirection.normalize();
      this.walkDirection.applyAxisAngle(this.rotateAngle, directionOffset);

      // run/walk velocity
      const velocity =
        this.currentAction == "mixamo.com"
          ? this.runVelocity
          : this.walkVelocity;

      // move model & camera
      const moveX = -this.walkDirection.x * velocity * delta;
      const moveZ = -this.walkDirection.z * velocity * delta;
      this.model.position.x += moveX;
      this.model.position.z += moveZ;
      if (this.isMyAvatar === true) this.updateCameraTarget(moveX, moveZ);
    }
  }

  private updateCameraTarget(moveX: number, moveZ: number) {
    // move camera
    this.camera.position.x += moveX;
    this.camera.position.z += moveZ;

    // update camera target
    this.cameraTarget.x = this.model.position.x;
    this.cameraTarget.y = this.model.position.y + 1;
    this.cameraTarget.z = this.model.position.z;
    this.orbitControl.target = this.cameraTarget;
  }

  private directionOffset(keysPressed: any) {
    var directionOffset = 0; // w

    if (keysPressed[W]) {
      directionOffset = Math.PI;
    } else if (keysPressed[S]) {
      directionOffset = 0;
    } else if (keysPressed[A]) {
      directionOffset = -Math.PI / 2; // a
    } else if (keysPressed[D]) {
      directionOffset = Math.PI / 2; // d
    }

    return directionOffset;
  }
}
