import * as THREE from 'three';

type Rectangle = {
  left: number,
  top: number,
  width: number,
  height: number
}

export default class Scene {

  private renderer?: THREE.WebGLRenderer;
  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private container?: THREE.Object3D;

  constructor(canvas: HTMLCanvasElement, focal: number, width: number, height: number, onAddedToStage: Function) {
    const aspect = width / height;
    const fov = 2.0 * Math.atan2(height / 2.0, focal) * 180.0 / Math.PI;
    this.initialize(canvas, focal, aspect)
      .then(() => onAddedToStage());
  }

  private initialize(canvas: HTMLCanvasElement, fov: number, aspect: number): Promise<void> {
    return new Promise(resolve => {
      // 1. renderer
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true
      });

      // 2. scene
      this.scene = new THREE.Scene();

      // 3. camera
      this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.0001, 1000);
      this.scene.add(this.camera);

      // 4. container
      this.container = new THREE.Object3D();
      this.container.frustumCulled = false;
      this.container.matrixAutoUpdate = false;
      this.scene.add(this.container);

      resolve();
    });
  }

  public setFov(fov: number) {
    if (this.camera) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }

  }

  public show() {
    if (this.container)
      this.container.visible = true;
  }

  public hide() {
    if (this.container)
      this.container.visible = false;
  }

  public add(object: THREE.Object3D) {
    this.container?.add(object);
  }

  public remove(object: THREE.Object3D) {
    this.container?.remove(object);
  }

  public resize(width: number, height: number) {
    this.renderer?.setSize(width, height);
    if (this.camera) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
  }

  public render(roto: Array<number>) {
    this.container?.matrix.set(
      roto[0], roto[1], roto[2], roto[3],
      roto[4], roto[5], roto[6], roto[7],
      roto[8], roto[9], roto[10], roto[11],
      roto[12], roto[13], roto[14], roto[15],
    );

    if (this.scene && this.camera)
      this.renderer?.render(this.scene, this.camera);
  }

}