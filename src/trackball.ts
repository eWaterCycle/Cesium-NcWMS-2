/**
 * Original authors from THREEJS repo
 * @author Eberhard Graether / http://egraether.com/
 * @author Mark Lundin  / http://mark-lundin.com
 * @author Simone Manini / http://daron1337.github.io
 * @author Luca Antiga  / http://lantiga.github.io
 */

/*
 * Original file is from the AMI library (but I think they got it from Three.js)
 * Modified for the Visual Storytelling project to be able to get and save state
 * and to allow for smooth tansitions
 */

import * as THREE from 'three';

export enum STATE {
  NONE = -1,
  ROTATE = 0,
  ZOOM = 1,
  PAN = 2,
  TOUCH_ROTATE = 3,
  TOUCH_ZOOM = 4,
  TOUCH_PAN = 5,
  CUSTOM = 99
}

export default class Trackball extends THREE.EventDispatcher {
  private state: STATE = STATE.NONE;
  private previousState: STATE = STATE.NONE;
  public camera: THREE.Camera;
  private domElement;
  private screen = { left: 0, top: 0, width: 0, height: 0 };

  public enabled: boolean = true;
  public rotateSpeed: number = 1.0;
  public zoomSpeed: number = 1.2;
  public panSpeed: number = 0.3;

  public noRotate: boolean = false;
  public noZoom: boolean = false;
  public noPan: boolean = false;
  public noCustom: boolean = false;

  private forceState = -1;

  private staticMoving = false;
  private dynamicDampingFactor = 0.2;

  private minDistance = 0;
  private maxDistance = Infinity;

  private keys = [65 /* A*/, 83 /* S*/, 68];

  // internals
  public target = new THREE.Vector3();
  private lastPosition = new THREE.Vector3();
  private EPS: number = 0.000001;

  private eye = new THREE.Vector3();

  private movePrev = new THREE.Vector2();
  private moveCurr = new THREE.Vector2();

  private lastAxis = new THREE.Vector3();
  private lastAngle = 0;

  private zoomStart = new THREE.Vector2();
  private zoomEnd = new THREE.Vector2();

  private touchZoomDistanceStart = 0;
  private touchZoomDistanceEnd = 0;

  private panStart = new THREE.Vector2();
  private panEnd = new THREE.Vector2();

  private customStart = new THREE.Vector2();
  private customEnd = new THREE.Vector2();

  public target0: THREE.Vector3;
  public position0: THREE.Vector3;
  public up0: THREE.Vector3;

  private changeTimeout = undefined;
  private changeTime = 0.0;
  private isDragging: boolean = false;

  // the valaues we are transition too when aminating to a certain state
  private toTarget : THREE.Vector3;
  private toPosition : THREE.Vector3;
  private toUp : THREE.Vector3;

  constructor(object: THREE.Camera, domElement) {
    super();

    this.camera = object;
    this.domElement = (domElement !== undefined) ? domElement : document;

    // for reset
    this.target0 = this.target.clone();
    this.position0 = this.camera.position.clone();
    this.up0 = this.camera.up.clone();


    this.domElement.addEventListener('contextmenu', function (event) {
      event.preventDefault();
    }, false);

    this.handleResize();

    // force an update at start
    this.update();
  }

  initEventListeners() {
    this.domElement.addEventListener('mousedown', this.mousedown, false);
    document.addEventListener('mousemove', this.mousemove, false);
    document.addEventListener('mouseup', this.mouseup, false);

    this.domElement.addEventListener('mousewheel', this.mousewheel, false);
    this.domElement.addEventListener('DOMMouseScroll', this.mousewheel, false); // firefox

    this.domElement.addEventListener('touchstart', this.touchstart, false);
    this.domElement.addEventListener('touchend', this.touchend, false);
    this.domElement.addEventListener('touchmove', this.touchmove, false);

    window.addEventListener('keydown', this.keydown, false);
    window.addEventListener('keyup', this.keyup, false);
  }

  // methods

  handleResize() {
    if (this.domElement === document) {
      this.screen.left = 0;
      this.screen.top = 0;
      this.screen.width = window.innerWidth;
      this.screen.height = window.innerHeight;
    } else {
      const box = this.domElement.getBoundingClientRect();
      // adjustments come from similar code in the jquery offset() function
      const d = this.domElement.ownerDocument.documentElement;
      this.screen.left = box.left + window.pageXOffset - d.clientLeft;
      this.screen.top = box.top + window.pageYOffset - d.clientTop;
      this.screen.width = box.width;
      this.screen.height = box.height;
    }
  };

  handleEvent(event) {
    if (typeof this[event.type] === 'function') {
      this[event.type](event);
    }
  };

  getMouseOnScreen(pageX: number, pageY: number) {
    return new THREE.Vector2((pageX - this.screen.left) / this.screen.width,
      (pageY - this.screen.top) / this.screen.height);
  }

  getMouseOnCircle(pageX, pageY) {
    return new THREE.Vector2(
      ((pageX - this.screen.width * 0.5 - this.screen.left) / (this.screen.width * 0.5)),
      ((this.screen.height + 2 * (this.screen.top - pageY)) / this.screen.width) // screen.width intentional
    );
  }

  rotateCamera = (function () {
    const axis = new THREE.Vector3(),
      quaternion = new THREE.Quaternion(),
      eyeDirection = new THREE.Vector3(),
      objectUpDirection = new THREE.Vector3(),
      objectSidewaysDirection = new THREE.Vector3(),
      moveDirection = new THREE.Vector3();

    return function () {
      moveDirection.set(this.moveCurr.x - this.movePrev.x, this.moveCurr.y - this.movePrev.y, 0);
      let angle = moveDirection.length();

      if (angle) {
        this.eye.copy(this.camera.position).sub(this.target);

        eyeDirection.copy(this.eye).normalize();
        objectUpDirection.copy(this.camera.up).normalize();
        objectSidewaysDirection.crossVectors(objectUpDirection, eyeDirection).normalize();

        objectUpDirection.setLength(this.moveCurr.y - this.movePrev.y);
        objectSidewaysDirection.setLength(this.moveCurr.x - this.movePrev.x);

        moveDirection.copy(objectUpDirection.add(objectSidewaysDirection));

        axis.crossVectors(moveDirection, this.eye).normalize();

        angle *= this.rotateSpeed;
        quaternion.setFromAxisAngle(axis, angle);

        this.eye.applyQuaternion(quaternion);
        this.camera.up.applyQuaternion(quaternion);

        this.lastAxis.copy(axis);
        this.lastAngle = angle;
      } else if (!this.staticMoving && this.lastAngle) {
        this.lastAngle *= Math.sqrt(1.0 - this.dynamicDampingFactor);
        this.eye.copy(this.camera.position).sub(this.target);
        quaternion.setFromAxisAngle(this.lastAxis, this.lastAngle);
        this.eye.applyQuaternion(quaternion);
        this.camera.up.applyQuaternion(quaternion);
      }

      this.movePrev.copy(this.moveCurr);
    };
  }());

  zoomCamera = function () {
    let factor;

    if (this.state === STATE.TOUCH_ZOOM) {
      factor = this.touchZoomDistanceStart / this.touchZoomDistanceEnd;
      this.touchZoomDistanceStart = this.touchZoomDistanceEnd;
      this.eye.multiplyScalar(factor);
    } else {
      factor = 1.0 + (this.zoomEnd.y - this.zoomStart.y) * this.zoomSpeed;

      if (factor !== 1.0 && factor > 0.0) {
        this.eye.multiplyScalar(factor);

        if (this.staticMoving) {
          this.zoomStart.copy(this.zoomEnd);
        } else {
          this.zoomStart.y += (this.zoomEnd.y - this.zoomStart.y) * this.dynamicDampingFactor;
        }
      }
    }
  };

  panCamera = (function () {
    const mouseChange = new THREE.Vector2(),
      objectUp = new THREE.Vector3(),
      pan = new THREE.Vector3();

    return function () {
      mouseChange.copy(this.panEnd).sub(this.panStart);

      if (mouseChange.lengthSq()) {
        mouseChange.multiplyScalar(this.eye.length() * this.panSpeed);

        pan.copy(this.eye).cross(this.camera.up).setLength(mouseChange.x);
        pan.add(objectUp.copy(this.camera.up).setLength(mouseChange.y));

        this.camera.position.add(pan);
        this.target.add(pan);

        if (this.staticMoving) {
          this.panStart.copy(this.panEnd);
        } else {
          this.panStart.add(mouseChange.subVectors(this.panEnd, this.panStart).multiplyScalar(this.dynamicDampingFactor));
        }
      }
    };
  }());

  checkDistances() {
    if (!this.noZoom || !this.noPan) {
      if (this.eye.lengthSq() > this.maxDistance * this.maxDistance) {
        this.camera.position.addVectors(this.target, this.eye.setLength(this.maxDistance));
      }

      if (this.eye.lengthSq() < this.minDistance * this.minDistance) {
        this.camera.position.addVectors(this.target, this.eye.setLength(this.minDistance));
      }
    }
  };

  update() {
    this.eye.subVectors(this.camera.position, this.target);

    if (!this.noRotate) {
      this.rotateCamera();
    }

    if (!this.noZoom) {
      this.zoomCamera();
    }

    if (!this.noPan) {
      this.panCamera();
    }

    if (!this.noCustom) {
      this.custom(this.customStart, this.customEnd);
    }

    this.camera.position.addVectors(this.target, this.eye);

    this.checkDistances();

    this.camera.lookAt(this.target);

    if (this.lastPosition.distanceToSquared(this.camera.position) > this.EPS) {
      this.dispatchEvent({ type: 'change' });

      this.lastPosition.copy(this.camera.position);
    }
  };

  finishCurrentTransition() {
    if (this.changeTimeout !== undefined) {
      clearInterval(this.changeTimeout);
      this.changeTimeout = undefined;
      this.changeCamera(this.toPosition, this.toTarget, this.toUp, 0);
    }
  }

  changeCamera(newPosition:THREE.Vector3, newTarget:THREE.Vector3, newUp:THREE.Vector3, milliseconds: number, done?: () => void) {
    if (this.target.equals(newTarget) && this.camera.position.equals(newPosition) && this.camera.up.equals(newUp)) {
      return;
    }
    if (milliseconds <= 0) {
      this.state = STATE.NONE;
      this.previousState = STATE.NONE;

      this.target.copy(newTarget);
      this.camera.position.copy(newPosition);
      this.camera.up.copy(newUp);

      this.eye.subVectors(this.camera.position, this.target);

      this.camera.lookAt(this.target);

      //_this.dispatchEvent(changeEvent);

      this.lastPosition.copy(this.camera.position);
    } else {
      //cancel previous animation
      if (this.changeTimeout !== undefined) {
        clearInterval(this.changeTimeout);
        this.changeTimeout = undefined;
      }
      this.toTarget = newTarget;
      this.toPosition = newPosition;
      this.toUp = newUp;
      let changeTime = 0;
      const delta = 30/milliseconds;
      this.changeTimeout = setInterval((fromTarget, fromPosition, fromUp, toTarget, toPosition, toUp) => {
        this.enabled = false;
        const t = changeTime;
        const interPolateTime = t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // ease in/out function

        const nextPosition = fromPosition.clone();
        const distancePosition = toPosition.clone();
        distancePosition.sub(fromPosition);
        nextPosition.addScaledVector(distancePosition, interPolateTime);

        const nextTarget = fromTarget.clone();
        const distanceTarget = toTarget.clone();
        distanceTarget.sub(fromTarget);
        nextTarget.addScaledVector(distanceTarget, interPolateTime);

        const nextUp = fromUp.clone();
        const distanceUp = toUp.clone();
        distanceUp.sub(fromUp);
        nextUp.addScaledVector(distanceUp, interPolateTime);
        nextUp.normalize();

        this.changeCamera(nextPosition, nextTarget, nextUp, 0);
        changeTime += delta;
        if (changeTime > 1.0) {
          this.changeCamera(toPosition, toTarget, toUp, 0);
          //console.log('end anim');
          clearInterval(this.changeTimeout);
          this.changeTimeout = undefined;
          this.enabled = true;
          if(done) {
            done();
          }
        }
      }, 30, this.target.clone(), this.camera.position.clone(), this.camera.up.clone(), newTarget, newPosition, newUp);
    }
  };

  reset() {
    this.changeCamera(this.target0, this.position0, this.up0, 0);
    this.dispatchEvent({ type: 'change' });
  };

  setState(targetState) {
    this.forceState = targetState;
    this.previousState = targetState;
    this.state = targetState;
  };

  custom(customStart, customEnd) {
    //TODO Nothing yet
  };

  // listeners

  keydown(event) {
    if (this.enabled === false) {
      return;
    }

    window.removeEventListener('keydown', this.keydown);

    this.previousState = this.state;

    if (this.state !== STATE.NONE) {
      return;
    } else if (event.keyCode === this.keys[STATE.ROTATE] && !this.noRotate) {
      this.state = STATE.ROTATE;
    } else if (event.keyCode === this.keys[STATE.ZOOM] && !this.noZoom) {
      this.state = STATE.ZOOM;
    } else if (event.keyCode === this.keys[STATE.PAN] && !this.noPan) {
      this.state = STATE.PAN;
    }
  }

  keyup(event) {
    if (this.enabled === false) { return; }

    this.state = this.previousState;

    window.addEventListener('keydown', this.keydown, false);
  }

  private mousedown = (event) => {
    if (this.enabled === false) { return; }

    this.isDragging = true;

    event.preventDefault();
    event.stopPropagation();

    if (this.state === STATE.NONE) {
      this.state = event.button;
    }

    if (this.state === STATE.ROTATE && !this.noRotate) {
      this.moveCurr.copy(this.getMouseOnCircle(event.pageX, event.pageY));
      this.movePrev.copy(this.moveCurr);
    } else if (this.state === STATE.ZOOM && !this.noZoom) {
      this.zoomStart.copy(this.getMouseOnScreen(event.pageX, event.pageY));
      this.zoomEnd.copy(this.zoomStart);
    } else if (this.state === STATE.PAN && !this.noPan) {
      this.panStart.copy(this.getMouseOnScreen(event.pageX, event.pageY));
      this.panEnd.copy(this.panStart);
    } else if (this.state === STATE.CUSTOM && !this.noCustom) {
      this.customStart.copy(this.getMouseOnScreen(event.pageX, event.pageY));
      this.customEnd.copy(this.panStart);
    }

    this.dispatchEvent({ type: 'start' });
  }

  private mousemove = (event) => {
    if (this.enabled === false || !this.isDragging) { return; }

    event.preventDefault();
    event.stopPropagation();

    if (this.state === STATE.ROTATE && !this.noRotate) {
      this.movePrev.copy(this.moveCurr);
      this.moveCurr.copy(this.getMouseOnCircle(event.pageX, event.pageY));
    } else if (this.state === STATE.ZOOM && !this.noZoom) {
      this.zoomEnd.copy(this.getMouseOnScreen(event.pageX, event.pageY));
    } else if (this.state === STATE.PAN && !this.noPan) {
      this.panEnd.copy(this.getMouseOnScreen(event.pageX, event.pageY));
    } else if (this.state === STATE.CUSTOM && !this.noCustom) {
      this.customEnd.copy(this.getMouseOnScreen(event.pageX, event.pageY));
    }
  }

  private mouseup = (event) => {
    if (this.enabled === false || !this.isDragging) { return; }

    this.isDragging = false;

    event.preventDefault();
    event.stopPropagation();
    const previousState = this.state;
    if (this.forceState === -1) {
      this.state = STATE.NONE;
    }

    this.dispatchEvent({ type: 'end', state: previousState, newTarget: this.target, newPosition: this.camera.position, newUp: this.camera.up });
  }

  private mousewheel = (event) => {
    if (this.enabled === false) { return; }

    event.preventDefault();
    event.stopPropagation();

    let delta = 0;

    if (event.wheelDelta) {
      // WebKit / Opera / Explorer 9

      delta = event.wheelDelta / 40;
    } else if (event.detail) {
      // Firefox

      delta = -event.detail / 3;
    }

    if (this.state !== STATE.CUSTOM) {
      this.zoomStart.y += delta * 0.01;
    } else if (this.state === STATE.CUSTOM) {
      this.customStart.y += delta * 0.01;
    }

    this.dispatchEvent({ type: 'zoomstart' });
    this.dispatchEvent({ type: 'zoomend', state: STATE.ZOOM, newTarget: this.target, newPosition: this.target, newUp: this.target });
  }

  touchstart(event) {
    if (this.enabled === false) { return; }

    if (this.forceState === -1) {
      switch (event.touches.length) {
        case 1:
          this.state = STATE.TOUCH_ROTATE;
          this.moveCurr.copy(this.getMouseOnCircle(event.touches[0].pageX, event.touches[0].pageY));
          this.movePrev.copy(this.moveCurr);
          break;

        case 2:
          this.state = STATE.TOUCH_ZOOM;
          const dx = event.touches[0].pageX - event.touches[1].pageX;
          const dy = event.touches[0].pageY - event.touches[1].pageY;
          this.touchZoomDistanceEnd = this.touchZoomDistanceStart = Math.sqrt(dx * dx + dy * dy);

          const x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
          const y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
          this.panStart.copy(this.getMouseOnScreen(x, y));
          this.panEnd.copy(this.panStart);
          break;

        default:
          this.state = STATE.NONE;
      }
    } else {
      // { NONE: -1, ROTATE: 0, ZOOM: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM_PAN: 4, CUSTOM: 99 };
      switch (this.state) {
        case 0:
          // 1 or 2 fingers, smae behavior
          this.state = STATE.TOUCH_ROTATE;
          this.moveCurr.copy(this.getMouseOnCircle(event.touches[0].pageX, event.touches[0].pageY));
          this.movePrev.copy(this.moveCurr);
          break;

        case 1:
        case 4:
          if (event.touches.length >= 2) {
            this.state = STATE.TOUCH_ZOOM;
            const dx = event.touches[0].pageX - event.touches[1].pageX;
            const dy = event.touches[0].pageY - event.touches[1].pageY;
            this.touchZoomDistanceEnd = this.touchZoomDistanceStart = Math.sqrt(dx * dx + dy * dy);
          } else {
            this.state = STATE.ZOOM;
            this.zoomStart.copy(this.getMouseOnScreen(event.touches[0].pageX, event.touches[0].pageY));
            this.zoomEnd.copy(this.zoomStart);
          }
          break;

        case 2:
        case 5:
          if (event.touches.length >= 2) {
            this.state = STATE.TOUCH_PAN;
            const x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
            const y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
            this.panStart.copy(this.getMouseOnScreen(x, y));
            this.panEnd.copy(this.panStart);
          } else {
            this.state = STATE.PAN;
            this.panStart.copy(this.getMouseOnScreen(event.touches[0].pageX, event.touches[0].pageY));
            this.panEnd.copy(this.panStart);
          }
          break;

        case 99:
          this.state = STATE.CUSTOM;
          const x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
          const y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
          this.customStart.copy(this.getMouseOnScreen(x, y));
          this.customEnd.copy(this.customStart);
          break;

        default:
          this.state = STATE.NONE;
      }
    }

    this.dispatchEvent({ type: 'start' });
  }

  touchmove(event) {
    if (this.enabled === false) { return; }

    event.preventDefault();
    event.stopPropagation();

    if (this.forceState === -1) {
      switch (event.touches.length) {
        case 1:
          this.movePrev.copy(this.moveCurr);
          this.moveCurr.copy(this.getMouseOnCircle(event.touches[0].pageX, event.touches[0].pageY));
          break;

        case 2:
          const dx = event.touches[0].pageX - event.touches[1].pageX;
          const dy = event.touches[0].pageY - event.touches[1].pageY;
          this.touchZoomDistanceEnd = Math.sqrt(dx * dx + dy * dy);

          const x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
          const y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
          this.panEnd.copy(this.getMouseOnScreen(x, y));
          break;

        default:
          this.state = STATE.NONE;
      }
    } else {
      let x, y;

      // { NONE: -1, ROTATE: 0, ZOOM: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM_PAN: 4, CUSTOM: 99 };
      switch (this.state) {
        case 0:
          this.movePrev.copy(this.moveCurr);
          this.moveCurr.copy(this.getMouseOnCircle(event.touches[0].pageX, event.touches[0].pageY));
          break;

        case 1:
          this.zoomEnd.copy(this.getMouseOnScreen(event.touches[0].pageX, event.touches[0].pageY));
          break;

        case 2:
          this.panEnd.copy(this.getMouseOnScreen(event.touches[0].pageX, event.touches[0].pageY));
          break;

        case 4:
          // 2 fingers!
          // TOUCH ZOOM
          const dx = event.touches[0].pageX - event.touches[1].pageX;
          const dy = event.touches[0].pageY - event.touches[1].pageY;
          this.touchZoomDistanceEnd = Math.sqrt(dx * dx + dy * dy);
          break;

        case 5:
          // 2 fingers
          // TOUCH_PAN
          x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
          y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
          this.panEnd.copy(this.getMouseOnScreen(x, y));
          break;

        case 99:
          x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
          y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
          this.customEnd.copy(this.getMouseOnScreen(x, y));
          break;

        default:
          this.state = STATE.NONE;
      }
    }
  }

  touchend(event) {
    if (this.enabled === false) { return; }

    if (this.forceState === -1) {
      switch (event.touches.length) {
        case 1:
          this.movePrev.copy(this.moveCurr);
          this.moveCurr.copy(this.getMouseOnCircle(event.touches[0].pageX, event.touches[0].pageY));
          break;

        case 2:
          this.touchZoomDistanceStart = this.touchZoomDistanceEnd = 0;

          const x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
          const y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
          this.panEnd.copy(this.getMouseOnScreen(x, y));
          this.panStart.copy(this.panEnd);
          break;
      }

      this.state = STATE.NONE;
    } else {
      switch (this.state) {
        case 0:
          this.movePrev.copy(this.moveCurr);
          this.moveCurr.copy(this.getMouseOnCircle(event.touches[0].pageX, event.touches[0].pageY));
          break;

        case 1:
        case 2:
          break;

        case 4:
          // TOUCH ZOOM
          this.touchZoomDistanceStart = this.touchZoomDistanceEnd = 0;
          this.state = STATE.ZOOM;
          break;

        case 5:
          // TOUCH ZOOM
          if (event.touches.length >= 2) {
            const x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
            const y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
            this.panEnd.copy(this.getMouseOnScreen(x, y));
            this.panStart.copy(this.panEnd);
          }
          this.state = STATE.PAN;
          break;

        case 99:
          const x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
          const y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
          this.customEnd.copy(this.getMouseOnScreen(x, y));
          this.customStart.copy(this.customEnd);
          break;

        default:
          this.state = STATE.NONE;
      }
    }
    this.dispatchEvent({ type: 'end', state: this.state, newTarget: this.target, newPosition: this.target, newUp: this.target });
  }
}
