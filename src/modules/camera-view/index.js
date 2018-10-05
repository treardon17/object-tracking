import React from 'react'
import PropTypes from 'prop-types'
import Base from 'modules/module-base'
import './style.scss'


class CameraView extends Base {
  componentDidMount() {
    super.componentDidMount()
    this.setDefaults()
    this.setBinds()
  }

  setDefaults() {}
  setBinds() {}

  get _scale() {
    return this.props.scale || 1
  }

  start() {
    this.setupCamera()
  }

  stop() {
    this.video = null
    this.streaming = false
    if (this.track) this.track.stop()
  }

  setupCamera() {
    this.initCameraFeed().then(() => {
      this.streaming = true
      this.update()
    }).catch(() => {
      this.supported = false
    })
  }

  async initCameraFeed() {
    const { canvas } = this.refs
    return new Promise((resolve, reject) => {
      let userMediaKey
      if (window.navigator.getUserMedia) {
        userMediaKey = 'getUserMedia'
      } else if (window.navigator.webkitGetUserMedia) {
        userMediaKey = 'webkitGetUserMedia'
      } else if (window.navigator.mozGetUserMedia) {
        userMediaKey = 'mozGetUserMedia'
      } else if (window.navigator.msGetUserMedia) {
        userMediaKey = 'msGetUserMedia'
      } else {
        reject()
        return
      }
      this.video = document.createElement('video')
      this.video.setAttribute('muted', true)
      this.video.setAttribute('playsinline', true)
      navigator[userMediaKey]({
        audio: false,
        video: {
          width: 1280,
          height: 720,
          // facingMode: 'user', // front-facing camera
          facingMode: 'environment', // back camera
        }
      }, (stream) => {
        this.video.addEventListener('loadedmetadata', () => {
          canvas.width = this.video.videoWidth * this._scale
          canvas.height = this.video.videoHeight * this._scale
          this.video.width = this.video.videoWidth
          this.video.height = this.video.videoHeight
          resolve()
        })
        this.stream = stream
        this.video.srcObject = stream
        this.track = stream.getTracks()[0] // eslint-disable-line
        this.video.play()
      }, (e) => {
        reject(e)
      })
    })
  }

  update() {
    window.requestAnimationFrame(this.update.bind(this))
    if (typeof this.props.onUpdate === 'function') {
      const { canvas } = this.refs
      this.props.onUpdate(this.getPixels({
        x: 0,
        y: 0,
        width: canvas.width,
        height: canvas.height
      }))
    }
    if (this.streaming) {
      this.renderCameraFeed()
      if (typeof this.onDraw === 'function') {
        const { canvas } = this.refs
        this.onDraw(canvas, canvas.getContext('2d'))
      }
    }
  }

  renderCameraFeed() {
    const { canvas } = this.refs
    if (canvas) {
      const videoHeight = canvas.height
      const videoWidth = canvas.width
      const videoX = (canvas.width / 2) - (videoWidth / 2)
      const videoY = (canvas.height / 2) - (videoHeight / 2)
      this.context = canvas.getContext('2d')
      // this.context.imageSmoothingEnabled = false
      this.context.drawImage(this.video, videoX, videoY, videoWidth, videoHeight)
    }
  }

  // input range [-100..100]
  contrastImage(imgData, contrast) {
    const d = imgData.data
    const theContrast = (contrast / 100) + 1 // convert to decimal & shift range: [0..2]
    const intercept = 128 * (1 - theContrast)
    for (let i = 0; i < d.length; i += 4) { // r,g,b,a
      d[i] = (d[i] * theContrast) + intercept
      d[i + 1] = (d[i + 1] * theContrast) + intercept
      d[i + 2] = (d[i + 2] * theContrast) + intercept
    }
    return imgData
  }

  grayScale(imgData) {
    const pixels = imgData.data
    for (let i = 0, n = pixels.length; i < n; i += 4) { // eslint-disable-line
      const grayscale = (pixels[i] * 0.3) + (pixels[i + 1] * 0.59) + (pixels[i + 2] * 0.11)
      pixels[i] = grayscale // red
      pixels[i + 1] = grayscale // green
      pixels[i + 2] = grayscale // blue
      // pixels[i+3]              is alpha
    }
    return imgData
  }

  getPixels({ x, y, width, height, contrast, grayscale } = {}) {
    const { canvas } = this.refs
    if (x != null && y != null && width && height) {
      const ctx = canvas.getContext('2d')
      ctx.imageSmoothingEnabled = false
      let imagedata = ctx.getImageData(x, y, width, height)
      if (grayscale != null) { imagedata = this.grayScale(imagedata) }
      if (contrast != null) { imagedata = this.contrastImage(imagedata, contrast) }
      return imagedata
    }
    return null
  }

  snapshot({ x, y, width, height, contrast, grayscale, flash } = {}) {
    if (flash) {
      if (this.flashTimeout) clearTimeout(this.flashTimeout)
      this.showFlash = true
      this.flashTimeout = setTimeout(() => { this.showFlash = false }, 200)
    }
    if (x != null && y != null && width && height) {
      const imagedata = this.getPixels({ x, y, width, height, contrast, grayscale })
      tempCtx.putImageData(imagedata, 0, 0)
      return tempCanvas.toDataURL('jpg')
    }
    const { canvas } = this.refs
    // base64 image
    const image = canvas.toDataURL('jpg')
    return image
  }

  onCanvasClick() {
    if (typeof this.click === 'function') {
      this.click()
    }
  }

  render() {
    return (
      <div className="camera-view">
        <canvas className="canvas" data-ref="canvas" />
      </div>
    )
  }
}

CameraView.propTypes = {
  onUpdate: PropTypes.func
}

export default CameraView
