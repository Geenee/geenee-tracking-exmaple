/**
 * @type {Number[]}
 */
export const STANDARD_RESOLUTIONS = [480, 576, 640, 648, 720, 768, 800, 960, 1080, 1152, 1280, 1366, 1920];

/**
 * @method enableHTMLAttribute
 * @param {HTMLElement} element
 * @param {String} key
 */
export const enableHTMLAttribute = (element, key) => {
  element.setAttribute(key, true);
  element[key] = true;
};

/**
 * A helper for initializing a WebRTC video stream, adapted from
 * @see https://github.com/jeeliz/jeelizAR/blob/master/helpers/JeelizMediaStreamAPIHelper.js
 * @class WebRTCHelper
 */
export default class WebRTCHelper {
  /**
   * @method getVideoStream
   * @param {HTMLVideoElement} video
   * @param {Object} mandatoryConstraints
   * @return {Promise}
   */
  getVideoStream(video = null, mandatoryConstraints = null) {
    return new Promise((resolve, reject) => {
      // Check general browser compatibility with WebRTC.
      if (!this.isCompatible()) {
        return reject(new Error('This browser is not compatible with WebRTC.'));
      }

      video = video || document.createElement('video');

      if (mandatoryConstraints && mandatoryConstraints.video) {
        const videoConstraints = mandatoryConstraints.video;

        if (this.isIOS()) {
          /**
           * Switch width/height video constraints if in mobile portrait mode - if we are
           * in portrait mode, the video will be also in portrait mode.
           * This does not apply to Android devices.
           * @see https://github.com/jeeliz/jeelizFaceFilter/issues/65
           */
          mandatoryConstraints = this.switchWithHeightIfPortrait(mandatoryConstraints);

          // iOS specific bug where the framerate drops in low-light situations.
          // @see https://bugs.webkit.org/show_bug.cgi?id=196214#c7
          mandatoryConstraints.frameRate = 60;
        }

        // @see https://stackoverflow.com/questions/45692526/ios-11-getusermedia-not-working
        /* if (typeof videoConstraints.width === 'object' && videoConstraints.width.ideal) {
          video.style.width = `${videoConstraints.width.ideal}px`;
        }

        if (typeof videoConstraints.height === 'object' && videoConstraints.height.ideal) {
          video.style.height = `${videoConstraints.height.ideal}px`;
        } */
      }

      enableHTMLAttribute(video, 'autoplay');
      enableHTMLAttribute(video, 'playsinline');

      if (mandatoryConstraints && mandatoryConstraints.audio) {
        video.volume = 0;
      } else {
        enableHTMLAttribute(video, 'muted');
      }

      this.getRawStream(video, mandatoryConstraints)
        .then(resolve)
        .catch((err) => {
          if (process.env.NODE_ENV === 'development') {
            /* eslint-disable-next-line no-console */
            console.log(`WebRTCHelper.getRawStream() failure with constraints: ${JSON.stringify(mandatoryConstraints, null, '  ')}`);
            /* eslint-disable-next-line no-console */
            console.log(err.stack);
          }

          const fallbackConstraints = this.createFallbackConstraints(mandatoryConstraints);

          if (process.env.NODE_ENV === 'development' && fallbackConstraints.length > 0) {
            /* eslint-disable-next-line no-console */
            console.log(`WebRTCHelper.getVideoStream(): ${fallbackConstraints.length} available fallback constraints:`);
            /* eslint-disable-next-line no-console */
            console.log(JSON.stringify(fallbackConstraints, null, '  '));
          }

          /**
           * @method tryConstraints
           * @param {Error|DOMException} e
           * @private
           */
          const tryConstraints = (e) => {
            if (process.env.NODE_ENV === 'development' && e !== null) {
              /* eslint-disable-next-line no-console */
              console.log(`WebRTCHelper.getVideoStream(): ${e.name || e.message}`);
            }

            if (e instanceof DOMException && e.name === 'NotAllowedError') {
              return reject(e);
            }

            if (fallbackConstraints.length === 0) {
              return reject(new Error('Invalid fallback constraints.'));
            }

            const testedConstraints = fallbackConstraints.shift();

            this.getRawStream(video, testedConstraints)
              .then(resolve)
              .catch(tryConstraints);
          };

          tryConstraints(err);
        });
    });
  }

  /**
   * @method getRawStream
   * @param {HTMLVideoElement} video
   * @param {Object} constraints
   */
  getRawStream(video, constraints) {
    if (process.env.NODE_ENV === 'development') {
      /* eslint-disable-next-line no-console */
      console.log(`WebRTCHelper.getRawStream() with constraints: ${JSON.stringify(constraints, null, '  ')}`);
    }

    return new Promise((resolve, reject) => {
      navigator.mediaDevices.getUserMedia(constraints)
        .then((localMediaStream) => {
          if (process.env.NODE_ENV === 'development') {
            /* eslint-disable-next-line no-console */
            console.log('WebRTCHelper.getRawStream(): Video stream initialized.');
          }

          /**
           * @method onTimeUpdate
           * @private
           */
          const onTimeUpdate = () => {
            if (video.readyState !== 4) {
              return;
            }
            if (process.env.NODE_ENV === 'development') {
              /* eslint-disable-next-line no-console */
              console.log('WebRTCHelper.getRawStream(): Video stream starts playing.');
            }
            video.removeEventListener('timeupdate', onTimeUpdate);
            resolve(video);
          };

          /**
           * @method onMetaDataLoaded
           * @private
           */
          const onMetaDataLoaded = () => {
            if (process.env.NODE_ENV === 'development') {
              /* eslint-disable-next-line no-console */
              console.log('WebRTCHelper.getRawStream(): Video stream metadata loaded.');
              /* eslint-disable-next-line no-console */
              console.log(`WebRTCHelper.getRawStream(): Resolution: ${video.videoWidth}x${video.videoHeight}.`);
            }
            video.addEventListener('timeupdate', onTimeUpdate);
            video.play();
          };

          video.addEventListener('loadeddata', onMetaDataLoaded, false);

          if (typeof video.srcObject !== 'undefined') {
            video.srcObject = localMediaStream;
          } else {
            video.src = URL.createObjectUrl(localMediaStream);
            video.videoStream = localMediaStream;
          }

          enableHTMLAttribute(video, 'muted');
        })
        .catch(reject);
    });
  }

  /**
   * Swaps `width` and `height` of the given `video` constraints.
   * @method switchWithHeight
   * @param {Object} constraints
   * @return {Objext}
   */
  switchWithHeight(constraints) {
    const widthConstraint = constraints.video.width;
    const heightConstraint = constraints.video.height;

    return {
      ...constraints,
      video: {
        ...constraints.video,
        width: heightConstraint,
        height: widthConstraint,
      },
    };
  }

  /**
   * Swaps `width` and `height` of the given `video` constraints if in portrait mode.
   * @method switchWithHeightIfPortrait
   * @param {Object} constraints
   * @return {Objext}
   */
  switchWithHeightIfPortrait(constraints) {
    if (!this.isPortrait()) {
      return constraints;
    }
    if (!constraints || !constraints.video) {
      return constraints;
    }

    const mandatoryVideoWidth = constraints.video.width;
    const mandatoryVideoHeight = constraints.video.height;

    if (!mandatoryVideoWidth || !mandatoryVideoHeight) {
      return constraints;
    }

    if (typeof mandatoryVideoWidth.ideal === 'number' && typeof mandatoryVideoHeight.ideal === 'number' && mandatoryVideoWidth.ideal > mandatoryVideoHeight.ideal) {
      return {
        ...constraints,
        video: {
          ...constraints.video,
          width: mandatoryVideoHeight,
          height: mandatoryVideoWidth,
        },
      };
    }

    if (typeof mandatoryVideoWidth === 'number' && typeof mandatoryVideoHeight === 'number' && mandatoryVideoWidth > mandatoryVideoHeight) {
      return {
        ...constraints,
        video: {
          ...constraints.video,
          width: mandatoryVideoHeight,
          height: mandatoryVideoWidth,
        },
      };
    }

    return constraints;
  }

  /**
   * @method cloneConstraints
   * @param {Object} constraints
   * @return {Object}
   */
  cloneConstraints(constraints) {
    if (!constraints) {
      return constraints;
    }

    let videoConstraints = false;

    if (constraints.video) {
      /**
       * @method cloneSizeConstraint
       * @param  {Object} sizeConstraint
       * @return {Object}
       */
      const cloneSizeConstraint = (sizeConstraint) => {
        if (typeof sizeConstraint === 'number') {
          return sizeConstraint;
        }
        const constraint = {};
        if (typeof sizeConstraint.min !== 'undefined') {
          constraint.min = sizeConstraint.min;
        }
        if (typeof sizeConstraint.max !== 'undefined') {
          constraint.max = sizeConstraint.max;
        }
        if (typeof sizeConstraint.ideal !== 'undefined') {
          constraint.ideal = sizeConstraint.ideal;
        }
        return constraint;
      };

      videoConstraints = {};

      if (constraints.video.width) {
        videoConstraints.width = cloneSizeConstraint(constraints.video.width);
      }

      if (constraints.video.height) {
        videoConstraints.height = cloneSizeConstraint(constraints.video.height);
      }

      if (constraints.video.facingMode) {
        videoConstraints.facingMode = constraints.video.facingMode;
      }
    }

    const clonedConstraints = {
      audio: constraints.audio,
      video: videoConstraints,
    };

    if (constraints.deviceId) {
      clonedConstraints.deviceId = constraints.deviceId;
    }

    return clonedConstraints;
  }

  /**
   * @method createFallbackConstraints
   * @param {Object} constraints
   */
  createFallbackConstraints(constraints) {
    const fallbackConstraints = [];

    if (typeof constraints !== 'object' || !constraints.video) {
      return fallbackConstraints;
    }

    /**
     * @method addConstraintsTryOn
     * @param  {Function} constraintConstructor
     * @private
     */
    const addConstraintsTryOn = (constraintConstructor) => {
      const newConstraints = this.cloneConstraints(constraints);
      fallbackConstraints.push(constraintConstructor(newConstraints));
    };

    /**
     * @method getCloserResolutions
     * @param  {Number} value
     * @return {Number[]}
     * @private
     */
    const getCloserResolutions = (value) => [...STANDARD_RESOLUTIONS].sort((a, b) => Math.abs(a - value) - Math.abs(b - value));

    // Try constraints which are close to the requested ones:
    if (constraints.video.width && constraints.video.height) {
      if (constraints.video.width.ideal && constraints.video.height.ideal) {
        const idealWidths = getCloserResolutions(constraints.video.width.ideal).slice(0, 3);
        const idealHeights = getCloserResolutions(constraints.video.height.ideal).slice(0, 3);

        for (let indexWidth = 0, width = 0; indexWidth < idealWidths.length; ++indexWidth) {
          width = idealWidths[indexWidth];

          for (let indexHeight = 0, height = 0; indexHeight < idealHeights.length; ++indexHeight) {
            height = idealHeights[indexHeight];

            if (constraints.video.width.ideal === width && constraints.video.height.ideal === height) {
              // Resolution has been already tried.
              continue;
            }

            const aspectRatio = Math.max(width, height) / Math.min(width, height);
            const tolerance = 0.1;

            if (aspectRatio < (4 / 3) - tolerance || aspectRatio > (16 / 9) - tolerance) {
              continue;
            }

            addConstraintsTryOn((newConstraints) => {
              newConstraints.video.width.ideal = width;
              newConstraints.video.height.ideal = height;
              return newConstraints;
            });
          }
        }
      }

      addConstraintsTryOn((newConstraints) => this.switchWithHeight(newConstraints));

      // Remove resolution
      if (constraints.video.width.ideal && constraints.video.height.ideal) {
        addConstraintsTryOn((newConstraints) => {
          delete newConstraints.video.width.ideal;
          delete newConstraints.video.height.ideal;
          return newConstraints;
        });
      }

      addConstraintsTryOn((newConstraints) => {
        delete newConstraints.video.width;
        delete newConstraints.video.height;
        return newConstraints;
      });
    }

    // Remove facingMode
    if (constraints.video.facingMode) {
      addConstraintsTryOn((newConstraints) => {
        delete newConstraints.video.facingMode;
        return newConstraints;
      });

      if (constraints.video.width && constraints.video.height) {
        addConstraintsTryOn((newConstraints) => {
          this.switchWithHeight(newConstraints);
          delete newConstraints.video.facingMode;
          return newConstraints;
        });
      }
    }

    fallbackConstraints.push({
      audio: constraints.audio,
      video: true,
    });

    return fallbackConstraints;
  }

  /**
   * @method isIOS
   * @return {Boolean}
   */
  isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  }

  isAndroid() {
    return navigator.userAgent.indexOf('Android') !== -1;
  };

  /**
   * @method isSafari
   * @see https://stackoverflow.com/questions/7944460/detect-safari-browser
   * @return {Boolean}
   */
  isSafari() {
    var ua = navigator.userAgent.toLowerCase();
    if (/safari/i.test(ua)) {
      if (/chrome|crios/i.test(ua)) {
        return false;
      }
      return true;
    }
    return false;
  }

  /**
   * @method isApple
   * @return {Boolean}
   */
  isApple() {
    return this.isIOS() || this.isSafari();
  }

  /**
   * @method isPortrait
   * @return {Boolean}
   */
  isPortrait() {
    try {
      if (window.matchMedia('(orientation: portrait)').matches) {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      return (window.innerHeight > window.innerWidth);
    }
  }

  /**
   * @method isCompatible
   * @return {Boolean}
   */
  isCompatible() {
    return !!navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function';
  }
}
