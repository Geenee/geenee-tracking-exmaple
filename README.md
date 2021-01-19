## Integration

#### react-scene

1. Import required dependencies

`import slam from '@geenee/sdk-slam'`

2. Wait for video stream to get initialized

3. Load WASM SLAM module, wait for module to be loaded, then initialize SLAM SDK.

```
slam.load().then(() => {
    ...
    // initialization code here
    ...
  });
```

4. Add EventListeners (see [geenee-slam-ready](#geenee-slam-ready), [geenee-slam-update](#geenee-slam-update)) , initialize SLAM SDK (see [init](#init) action)

```
slam.on('geenee-slam-ready', onSlamReady)
slam.on('geenee-slam-update', onSlamUpdate)

slam.init(video, videoCanvas, SCAMERA_FOV)
```

5. Wait for SLAM SDK to be initialized, in `onSlamReady` handler you can set up corresponding state

```
const onSlamReady = () => {
  // setState({isSlamReady: true})
  setIsSlamReady(true)
}
```

6. On the scene element or some overlay element you have to add click listener, get the tap position (x, y) and try to start experience of SLAM SDK. Check if SLAM is intilialized.

```
const onElementClick = (e) => {
  if (isSlamReady) {
    const { clientX, clientY } = e;
    startExperience(clientX, clientY)
  }
}
```

7. To start experience you need call [start](#start) action, pass tap position (x, y). SLAM compute position, if position is in an acceptable area (see [limitation](#limitation-initialization)), SLAM SDK will start AR expeience. Otherwise, the user needs to try again locate object in an acceptable area.

```
const startExperience = (x, y) => {
  slam.start(x, y).then(() => {
    setIsExpPaused(false)
    console.log('Experience started.')
  }, (error) => {
    setIsExpPaused(true)
    console.log('wrong position')
  })
}
```

8. Listen for update event, inside the listener place all renderer script(object position updates, etc) (see [geenee-slam-update](#geenee-slam-update))

```
const onSlamUpdate = (rototranslation) => {
  // renderer code here
}
```

## Actions

#### What are GeeneeSLAM actions

Actions are exported GeeneeSLAM SDK methods, allowing user to run logic inside of the SDK.

Actions allow for thing like loading WASM lib, initializing app, starting/stopping the AR experience.

## Events

#### What are GeeneeSLAM events

GeeneeSLAM events allow us to inform user when certain things happen inside of the context of GeeneeSLAM SDK.

#### Adding event listener

`GeeneeSLAM.on('geenee-slam-ready', this.onSlamReady)`

#### Removing event listener

`GeeneeSLAM.off('geenee-slam-ready', this.onSlamReady)`

## SDK

#### Intro

--------------------------------------------------------------------------------

#### API

- GeeneeSLAM
  - Actions
    - [load](#load)
    - [startImu](#startImu)
    - [init](#init)
    - [start](#start)
    - [stop](#stop)
  - Events
    - [geenee-slam-ready](#geenee-slam-ready)
    - [geenee-slam-ready](#geenee-slam-permission-request)
    - [geenee-slam-update](#geenee-slam-update)

--------------------------------------------------------------------------------

#### Actions

[GeeneeSLAM.load()](#load)

- Initializes new AR session

[GeeneeSLAM.startImu()](#startImu)

- Initializes motion sensor handling when permission of motion sensor is accepted (only for iOS 13+)

[GeeneeSLAM.init(video, videoCanvas, fov: number)](#init)

- Initializes new AR session.

- Parameters
  - video: **HTMLVideoElement** - reference to the video element
  - videoCanvas: **HTMLCanvasElement** - reference to the canvas element where we will be rendered video frame
  - fov: **number** - field of view of scene, recommended set up it to `60`

[GeeneeSLAM.start(u: number, v: number)](#start)

- Allows the user to start AR experience.

-Parameters
  - u: **number** - horizontal position on the screen, in pixels
  - v: **number** - vertical position on the screen, in pixels

[GeeneeSLAM.stop()](#stop)

- Allows the user to stop/pause AR experience.

--------------------------------------------------------------------------------

#### Events

[geenee-slam-ready](#geenee-slam-ready)

- This event is emitted when when WASM is loaded and initialied and GeeneeSLAM is ready to work.

[geenee-slam-permission-request](#geenee-slam-permission-request)

- This special event is emitted when only on iOS 13+ when it requires permission for motion sensor.

[geenee-slam-update)](#geenee-slam-update)

- This event is emitted in every frame when new rototransation matrix is computed.
- Parameters
  - rototranslation: **number[]** - rototranslation matrix 4x4

## Limitations

#### [Initialization](#limitation-initialization)

Virtual object could be located on the horizontal surface on the distance not more 3.5 m from the user

#### Processing

Due to single threading limitation we can't  to implement pose prediction functionality, this imposes additional restrictions
- Works correctly with small rotational rate - from 0 degrees per seconds to 90 degrees per seconds (depends to device)
- Works correctly with moderate movement of the device
