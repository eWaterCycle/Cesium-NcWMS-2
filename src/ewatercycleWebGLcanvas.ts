import * as THREE from 'three';

import Trackball from './trackball';

import { IOrientation } from './types';

import BrainvisView from './ewatercycleView';
// import BrainvisInterface from './gl_interface/brainvis_interface';

import * as amidata from '../data/amidata.json';
import * as peterdata from '../static/peterdata.json';

import { debounce } from './utils';

export default class EwatercycleWebGLCanvas extends THREE.EventDispatcher {
    private width: number;
    private height: number;
    private mainElement: Element;
    private scene = new THREE.Scene();
    private objects = new THREE.Object3D(); // all the loaded objects go in here
    private camera: THREE.PerspectiveCamera;
    private renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true });
    private controls: Trackball;

    private directionalLight: THREE.DirectionalLight;
    private lightRotation: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

    // stored gui state to recoveren when swithing back from 2D view
    private cachedCameraOrigin: THREE.Vector3;
    private cachedCameraTarget: THREE.Vector3;
    private cachedCameraUp: THREE.Vector3;
    private cachedSliceHandleVisibility: boolean;
    private cachedObjectsShown: boolean;

    // callback to call when loading is completed
    private loadCompeletedCallback: () => void;

    private canvasElement: HTMLCanvasElement;
    private brainvisView: BrainvisView;

    constructor(mainElement, brainvisView: BrainvisView, loadCompeletedCallback?: () => void) {
        super();
        this.loadCompeletedCallback = loadCompeletedCallback;

        this.brainvisView = brainvisView;
        const dimensions = brainvisView.getDimensions();
        this.width = dimensions[0];
        this.height = dimensions[1];
        this.mainElement = mainElement;

        this.scene.background = new THREE.Color('black');
        this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 10000);

        this.renderer.setSize(this.width, this.height);

        this.canvasElement = this.renderer.domElement;

        this.mainElement.appendChild(this.canvasElement);

        // Setup controls
        this.controls = new Trackball(this.camera, this.renderer.domElement);

        this.scene.add(this.objects);

        this.initScene();

        this.addEventListeners();
        this.animate();
    }

    initScene() {
        // Setup lights
        this.scene.add(new THREE.AmbientLight(0x222222));

        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        this.directionalLight.position.set(1, 1, 1).normalize();
        this.scene.add(this.directionalLight);
    }

    addEventListeners() {
        this.controls.addEventListener('zoomstart', (event) => {
            const position = this.controls.camera.position.toArray();
            const target = this.controls.target.toArray();
            const up = this.controls.camera.up.toArray();
            const orientation = { position, target, up };

            this.dispatchEvent({
                type: 'zoomStart',
                orientation
            });
        });

        this.controls.addEventListener('zoomend',
          debounce((event) => {
            const position = this.controls.camera.position.toArray();
            const target = this.controls.target.toArray();
            const up = this.controls.camera.up.toArray();
            const orientation = { position, target, up };

            this.dispatchEvent({
                type: 'zoomEnd',
                orientation
            });
        }, 500));

        this.controls.addEventListener('start', (event) => {
            const position = this.controls.camera.position.toArray();
            const target = this.controls.target.toArray();
            const up = this.controls.camera.up.toArray();
            const orientation = { position, target, up };

            this.dispatchEvent({
                type: 'cameraStart',
                orientation
            });
        });

        this.controls.addEventListener('end', (event) => {
            const position = this.controls.camera.position.toArray();
            const target = this.controls.target.toArray();
            const up = this.controls.camera.up.toArray();
            const orientation = { position, target, up };

            this.dispatchEvent({
                type: 'cameraEnd',
                orientation
            });
        });
    }

    setSize(width: number, height: number) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
        this.controls.handleResize();
    }

    setInteractive(interactive: boolean) {
        this.controls.enabled = interactive;
    }

    setControlZoom(newOrientation: IOrientation, within: number) {
        this.controls.changeCamera(new THREE.Vector3(newOrientation.position[0], newOrientation.position[1], newOrientation.position[2]),
            new THREE.Vector3(newOrientation.target[0], newOrientation.target[1], newOrientation.target[2]),
            new THREE.Vector3(newOrientation.up[0], newOrientation.up[1], newOrientation.up[2]),
            within > 0 ? within : 1000);
    }

    setControlOrientation(newOrientation: IOrientation, within: number) {
        this.controls.changeCamera(new THREE.Vector3(newOrientation.position[0], newOrientation.position[1], newOrientation.position[2]),
            new THREE.Vector3(newOrientation.target[0], newOrientation.target[1], newOrientation.target[2]),
            new THREE.Vector3(newOrientation.up[0], newOrientation.up[1], newOrientation.up[2]),
            within > 0 ? within : 1000);
    }

    animate = () => {
        requestAnimationFrame(this.animate);

        this.controls.update();

        this.render();
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    };

    public getCanvasElement() {
        return this.canvasElement;
    }
}
