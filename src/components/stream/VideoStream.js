import WebRTCHelper from './WebRTCHelper';
import React, { useEffect } from "react";
import PropTypes from 'prop-types';

const VideoStream = ({ style, onSuccess }) => {
  const rtcContainerRef = React.useRef(null);
  const rtcHelper = new WebRTCHelper()
  const isIOS = rtcHelper.isIOS();

  const [error, setError] = React.useState(null);

  const videoWidth = rtcHelper.isPortrait() ? window.innerHeight : window.innerWidthy;
  const videoHeight = rtcHelper.isPortrait() ? window.innerWidth : window.innerHeight;

  const constraints = {
    video: {
      width: isIOS ? void 0 : { min: videoWidth, max: videoWidth, ideal: videoWidth },
      height: isIOS ? void 0 : { min: videoHeight, max: videoHeight, ideal: videoHeight },
      fps: isIOS ? 60 : void 0,
      facingMode: 'environment',
      focusMode: 'none',
    },
    audio: false
  }

  const onRtcHelperSucess = (video) => {
    video.id = 'rtcVideo'
    rtcContainerRef.current.appendChild(video)
    onSuccess(video)
  }

  useEffect(() => {
    rtcHelper.getVideoStream(null, constraints)
      .then(onRtcHelperSucess)
      .catch(onRtcHelperFail)
  }, [])

  const onRtcHelperFail = (e) => {
    setError(e.stack || `Could not initialize video stream.`)
  }

  if (error) {
    return (
      <span>${error.message}</span>
    )
  } else {
    return (
      <div style={style} ref={rtcContainerRef} />
    )
  }
};

VideoStream.propType = {
  onSuccess: PropTypes.any.isRequired
};

export default VideoStream
