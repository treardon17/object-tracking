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

  drawRectContainer({ ctx, canvas, strokeWidth = 5, strokeColor = 'red', corners = [] }) {
    if (!ctx && canvas) ctx = canvas.getContext('2d') // eslint-disable-line
    if (corners.length > 0) {
      ctx.beginPath()
      ctx.strokeWidth = strokeWidth
      ctx.strokeStyle = strokeColor
      for (let i = 0; i < corners.length; i += 1) {
        const corner = corners[i]
        const { x, y } = corner
        ctx.lineTo(x, y)
      }
      ctx.lineTo(corners[0].x, corners[0].y)
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
    if (this._iterationCount % 1500 || !this._descriptors) {
      const data = { imageData: pixels }
      if (!this.trainingImg) {
        this.trainingImg = pixels
        data.trainingImg = this.trainingImg
      }
      this.tracking.tick(data)
    }
    if (this.tracking.rectCorners) {
      this.drawRectContainer({ ctx, corners: this.tracking.rectCorners })
    }
    console.log('good matches:', this.tracking.rectCorners)
    const { keypoints } = this.tracking.descriptors
    this.drawORBDescriptors({ ctx, radius: 2, keypoints })
  }

  render() {
    return (
      <div className="tracking-view">
        <CameraView scale={0.3} onUpdate={this.onCameraUpdate} ref={ref => this.cameraView = ref} />
      </div>
    )
  }
}

TrackingView.propTypes = {
  throttle: PropTypes.number,
  markerImg: PropTypes.string
}

export default TrackingView
