import React from 'react'
import jsfeat from 'jsfeat'
import PropTypes from 'prop-types'
import CameraView from 'modules/camera-view'
import Base from 'modules/module-base'
import Tracking from '@/scripts/tracking'
import './style.scss'


class TrackingView extends Base {
  constructor() {
    super()
    this._mounted = false
    this.setDefaults()
  }

  setDefaults() {
    this._iterationCount = 0
    this._descriptors = null
  }

  componentDidMount() {
    super.componentDidMount()
    this.setBinds()
    this._mounted = true
  }

  setBinds() {}

  // actions
  start() { this.cameraView.start() }
  stop() { this.cameraView.stop() }

  getCorners(imageData) {
    const { canvas } = this.refs
    jsfeat.fast_corners.set_threshold(30)
    const corners = []
    let i = canvas.width * canvas.height
    while (--i >= 0) {
      corners[i] = new jsfeat.keypoint_t(0, 0, 0, 0, -1)
    }
    const blurred = this.getBlurredImage(imageData)
    const count = jsfeat.fast_corners.detect(blurred, corners, 3)
    return corners
    // return count
  }

  drawPoint({ ctx, canvas, x, y, radius = 2, fill = 'red' }) {
    if (!ctx && canvas) ctx = canvas.getContext('2d') // eslint-disable-line
    ctx.fillStyle = fill
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, 2 * Math.PI)
    ctx.fill()
  }

  drawORBDescriptors({ canvas, ctx, radius = 2, fill = 'red', keypoints = [] }) {
    if (!ctx && canvas) ctx = canvas.getContext('2d') // eslint-disable-line
    for (let i = 0; i < keypoints.length; i += 1) {
      const descriptor = keypoints[i]
      const { x, y } = descriptor
      this.drawPoint({ x, y, ctx, radius, fill })
    }
  }

  drawRectContainer({ ctx, canvas, strokeWidth = 5, color = 'green', corners = [] }) {
    if (!ctx && canvas) ctx = canvas.getContext('2d') // eslint-disable-line
    if (corners.length > 0) {
      ctx.beginPath()
      ctx.strokeWidth = strokeWidth
      ctx.strokeStyle = color
      for (let i = 0; i < corners.length; i += 1) {
        const corner = corners[i]
        const { x, y } = corner
        // ctx.lineTo(x, y)
        this.drawPoint({ ctx, x, y, fill: color })
      }
      // ctx.lineTo(corners[0].x, corners[0].y)
      ctx.stroke()
    }
  }

  // events
  onCameraUpdate = ({ pixels, canvas, ctx }) => {
    if (!this.tracking) {
      this.tracking = new Tracking({ width: canvas.width, height: canvas.height })
      this.tracking.setTraining({ trainingImg: this.props.markerImg })
      // this.tracking.setTraining({ trainingImg: pixels })
    }

    this._iterationCount += 1
    if (this._iterationCount % 500 || !this._descriptors) {
      this.tracking.tick({ imageData: pixels })
    }

    if (this.tracking.rectCorners) {
      this.drawRectContainer({ ctx, corners: this.tracking.rectCorners })
    }

    if (this.props.showSmooth && this.smoothCanvas) {
      this.smoothCanvas.width = canvas.width
      this.smoothCanvas.height = canvas.height
      const grayCtx = this.smoothCanvas.getContext('2d')
      const { imgU8Smooth } = this.tracking
      const clamped = Uint8ClampedArray.from(imgU8Smooth.data)
      grayCtx.putImageData(new ImageData(clamped, imgU8Smooth.cols / 2, imgU8Smooth.rows / 2), 0, 0, 0, 0, canvas.width, canvas.height)
    }

    if (this.props.showDots && this.dotCanvas) {
      const { keypoints } = this.tracking.descriptors
      this.dotCanvas.width = canvas.width
      this.dotCanvas.height = canvas.height
      this.drawORBDescriptors({ canvas: this.dotCanvas, radius: 2, keypoints })
    }
  }

  render() {
    let classes = 'tracking-view'
    if (this.props.hideCamera) classes += ' hide-camera'
    return (
      <div className={classes}>
        <CameraView scale={0.5} onUpdate={this.onCameraUpdate} ref={ref => this.cameraView = ref} />
        { this.props.showDots ? <canvas ref={ref => this.dotCanvas = ref} /> : null }
        { this.props.showSmooth ? <canvas ref={ref => this.smoothCanvas = ref} /> : null}
      </div>
    )
  }
}

TrackingView.propTypes = {
  hideCamera: PropTypes.bool,
  showDots: PropTypes.bool,
  showSmooth: PropTypes.bool,
  markerImg: PropTypes.string,
}

export default TrackingView
