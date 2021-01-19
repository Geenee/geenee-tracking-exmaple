/* global FPSMeter */

import 'fpsmeter';
import * as THREE from 'three';
import React, { useEffect, useRef, useState } from 'react';

import VideoStream from './stream';

import '@geenee/sdk-slam';
import Scene from '../lib/scene';

import target from '../assets/target.jpg';
import loadImage from '../lib/utils/loadImage';
import safariEdgePolyfill from '../lib/utils/safariEdgePolyfill';

const { stamp, loadWasm } = Geenee;

const App = () => {

  const [size, setSize] = useState({ width: 0, height: 0 });
  const [showInitialization, setShowInitialization] = useState(true);

  const appRef = useRef<HTMLDivElement>(null);
  const videoCanvasRef = useRef<HTMLCanvasElement>(null);
  const threeCanvasRef = useRef<HTMLCanvasElement>(null);

  const fpsMeterRef = useRef<FPSMeter | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const stampReadyRef = useRef(false);
  const sceneAddedRef = useRef(false);
  const frameIDRef = useRef(0);
  const videoScaleRef = useRef(1.0);
  const videoSizeRef = useRef({ videoWidth: 0, videoHeight: 0 });
  const resizeCanvasRef = useRef(document.createElement('canvas'));
  const sizeRef = useRef({ width: 0, height: 0 });
  const focalRef = useRef(320);
  const targetSizeRef = useRef({ width: 0, height: 0 });

  //--------------------------------------------
  //-- Start DOM Events

  const onFrame = () => {
    const { width, height } = sizeRef.current;
    frameIDRef.current = requestAnimationFrame(onFrame);
    if (stampReadyRef.current) {
      stamp.recognize(width, height);
    }
  }

  const onResize = () => {
    const { innerWidth, innerHeight } = window;
    setSize({ width: innerWidth, height: innerHeight });
    sizeRef.current = { width: innerWidth, height: innerHeight };

    if (sceneRef.current) {
      sceneRef.current.resize(innerWidth, innerHeight);
    }
  }

  const onVideoStream = (video: HTMLVideoElement) => {
    const { videoWidth, videoHeight } = video;
    videoSizeRef.current = { videoWidth, videoHeight };

    loadWasm().then(() => {
      stamp.on('geenee-tracker-update', onStampUpdate);
      stamp.initialize(video);

      safariEdgePolyfill();

      addTargetAndTrain();
    });

    if (threeCanvasRef.current) {
      sceneRef.current = new Scene(
        threeCanvasRef.current,
        focalRef.current,
        videoWidth,
        videoHeight,
        onSceneAddedToStage
      );
    }

    resize();
  }

  const onSceneAddedToStage = () => {
    sceneAddedRef.current = true;
    if (stampReadyRef.current)
      addOverlay();
  }

  //-- End DOM Events
  //--------------------------------------------


  //--------------------------------------------
  //-- Start Slam Events

  const onStampUpdate = (imageData: ImageData, targetID: number, rototranslation: [], focal: number) => {
    fpsMeterRef.current?.tick();

    if (stampReadyRef.current && targetID !== -1) {
      if (focal !== focalRef.current) {
        focalRef.current = focal;
        const fov = 2.0 * Math.atan2(sizeRef.current.height / 2.0, focal) * 180.0 / Math.PI;
        sceneRef.current?.setFov(fov);
      }

      sceneRef.current?.render(rototranslation);
      sceneRef.current?.show();
      console.log('detected target: ' + targetID);
    }
    renderVideoFrame(imageData);
  }

  //-- End Slam Events
  //--------------------------------------------


  //--------------------------------------------
  //-- Start Methods

  const resize = () => {
    const { innerWidth, innerHeight } = window;
    setSize({ width: innerWidth, height: innerHeight });
    sizeRef.current = { width: innerWidth, height: innerHeight };

    if (sceneRef.current) {
      sceneRef.current.resize(innerWidth, innerHeight);
    }
  }

  const addTargetAndTrain = async () => {
    const targetImageData = await loadImage(target, target, 1920);

    stamp.addTarget(targetImageData);
    stamp.train();
    targetSizeRef.current = { width: targetImageData.width, height: targetImageData.height };

    stampReadyRef.current = true;
    setShowInitialization(false);

    if (sceneAddedRef.current)
      addOverlay();
  }

  const renderVideoFrame = (imageData: ImageData) => {
    const { width, height } = sizeRef.current;

    const videoCanvas = videoCanvasRef.current;
    if (!videoCanvas)
      return;

    videoCanvas.width = width;
    videoCanvas.height = height;
    const context = videoCanvas.getContext('2d');
    if (!context)
      return;

    context.putImageData(imageData, 0, 0);
  }

  const addOverlay = () => {
    const { width, height } = targetSizeRef.current;
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    material.transparent = true;
    material.opacity = 0.5;
    const plane = new THREE.Mesh(
      new THREE.BoxGeometry(2 * width / width, 2 * height / width, 0.001,),
      material);
    //new THREE.MeshNormalMaterial());
    plane.frustumCulled = false;
    sceneRef.current?.add(plane);
  }

  //-- End Methods
  //--------------------------------------------


  //--------------------------------------------
  //-- Start Initialization

  useEffect(() => {
    fpsMeterRef.current = new FPSMeter(appRef.current as HTMLElement, {
      position: 'absolute',
      left: 'auto',
      right: '5px'
    });

    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);

    onFrame();

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      cancelAnimationFrame(frameIDRef.current);
    }
  }, [])

  //-- End Initialization
  //--------------------------------------------

  return (
    <div className='App' ref={appRef}>
      <VideoStream
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: size.width,
          height: size.height,
          opacity: 0
        }}
        onSuccess={onVideoStream} />

      <canvas
        className='canvas'
        style={{
          width: size.width,
          height: size.height
        }}
        width={size.width}
        height={size.height}
        ref={videoCanvasRef} />

      <canvas
        className='canvas'
        style={{
          width: size.width,
          height: size.height
        }}
        width={size.width}
        height={size.height}
        ref={threeCanvasRef} />

      <div
        className='canvas'
        style={{
          display: showInitialization ? 'block' : 'none'
        }}>
        Initialization...
      </div>

    </div>
  );
}

export default App;
