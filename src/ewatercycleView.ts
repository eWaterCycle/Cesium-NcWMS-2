
import * as prov from 'phovea_core/src/provenance';
import * as views from 'phovea_core/src/layout_view';

import { Rect } from 'phovea_core/src/geom';

// import EwatercycleWebGLcanvas from './ewatercycleWebGLcanvas';
import * as BrainvisCommands from './cmds';
import { IOrientation } from './types';

import { IViewExtension } from './iViewExtension';

import EWaterCycleApp from './scripts/app.module';

const thumbnailWidth = 100;
const thumbnailHeight = 100;

export default class EwatercycleView extends views.AView implements IViewExtension {
    private dim: [number, number] = [100, 100];
    private bounds = new Rect(0, 0, 0, 0);
    // private webGLcanvas: EwatercycleWebGLcanvas;
    private orientationStart: IOrientation;
    private ref: prov.IObjectRef<EwatercycleView>;
    private eWaterCycleApp: EWaterCycleApp;

    constructor(private elem: Element, private graph: prov.ProvenanceGraph, loadCompeletedCallback? : () => void) {
        super();
        this.ref = this.graph.findOrAddObject(this, 'eWaterCycle', 'visual');

        // Create and add the webGL canvas to the dom
        // this.webGLcanvas = new EwatercycleWebGLcanvas(elem, this, loadCompeletedCallback);
        this.eWaterCycleApp = new EWaterCycleApp();

        // this.webGLcanvas.addEventListener('zoomStart', this.zoomStart);
        // this.webGLcanvas.addEventListener('zoomEnd', this.zoomEnd);
        // this.webGLcanvas.addEventListener('cameraStart', this.cameraStart);
        // this.webGLcanvas.addEventListener('cameraEnd', this.cameraEnd);


        // this.webGLcanvas.addEventListener('sliceZoomChanged',this.sliceZoomChanged);
        // this.webGLcanvas.addEventListener('sliceOrientationChanged',this.sliceOrientationChanged);
        // this.webGLcanvas.addEventListener('sliceVisibilityChanged',this.sliceVisibilityChanged);
        // this.webGLcanvas.addEventListener('sliceHandleVisibilityChanged',this.sliceHandleVisibilityChanged);
        // this.webGLcanvas.addEventListener('sliceModeChanged',this.sliceModeChanged);
        // this.webGLcanvas.addEventListener('objectsVisibilityChanged',this.objectsVisibilityChanged);
        // this.webGLcanvas.addEventListener('objectSelection',this.selectionChanged);
    }

    getDimensions() {
        return this.dim;
    }

    getBounds() {
        return this.bounds;
    }

    setBounds(x, y, w, h) {
        this.bounds = new Rect(x, y, w, h);
        this.dim = [w, h];
        // this.webGLcanvas.setSize(w, h);
    }

    setInteractive(interactive: boolean) {
        // this.webGLcanvas.setInteractive(interactive);
    }

    //Control zoom
    zoomStart = (event) => {
        this.orientationStart = event.orientation;
    }

    zoomEnd = (event) => {
        const orientationEnd = event.orientation;

        this.setControlZoom(this.orientationStart, orientationEnd);
    }

    setControlZoom(oldOrientation: IOrientation, newOrientation: IOrientation) {
        const orientations = { old: oldOrientation, new: newOrientation };
        return this.graph.push(BrainvisCommands.setControlZoom(this.ref, orientations));
    }

    setControlZoomImpl(orientation: IOrientation, within:number) {
        // return this.webGLcanvas.setControlZoom(orientation, within);
    }

    //Control Orientation
    cameraStart = (event) => {
        this.orientationStart = event.orientation;
    }

    cameraEnd = (event) => {
        const orientationEnd = event.orientation;

        this.setControlOrientation(this.orientationStart, orientationEnd);
    }

    setControlOrientation(oldOrientation: IOrientation, newOrientation: IOrientation) {
        const orientations = { old: oldOrientation, new: newOrientation };
        return this.graph.push(BrainvisCommands.setControlOrientation(this.ref, orientations));
    }

    setControlOrientationImpl(orientation: IOrientation, within:number) {
        // return this.webGLcanvas.setControlOrientation(orientation, within);
    }

    public makeScreenshot(): string {
    //   const originalCanvas = this.webGLcanvas.getCanvasElement();
    //   originalCanvas.setAttribute('crossOrigin', 'anonymous');
    //   const originalContext = originalCanvas.getContext('2d');
    //   const newCanvas = document.createElement('canvas');
    //   const newContext = newCanvas.getContext('2d');
    //   newCanvas.width = thumbnailWidth;
    //   newCanvas.height = thumbnailHeight;
    //   newContext.drawImage(originalCanvas, 0, 0, thumbnailWidth, thumbnailHeight);
    //   const strMime = 'image/jpeg';
    //   return newCanvas.toDataURL(strMime);
        return '';
    }
}

export function create(parent: Element, provGraph: prov.ProvenanceGraph, loadCompeletedCallback? : () => void) {
    return new EwatercycleView(parent, provGraph, loadCompeletedCallback);
}
