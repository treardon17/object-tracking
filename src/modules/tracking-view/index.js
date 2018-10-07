import React from 'react'
import jsfeat from 'jsfeat'
import PropTypes from 'prop-types'
import CameraView from 'modules/camera-view'
import Base from 'modules/module-base'
import Tracking from '@/scripts/tracking'
// import Util from '@/util'
import './style.scss'


class TrackingView extends Base {
  constructor() {
    super()
    this.setDefaults()
  }

  setDefaults() {
  }

  componentDidMount() {
    super.componentDidMount()
    this.setBinds()
  }

  setBinds() {}

  // actions
  start() { this.cameraView.start() }
  stop() { this.cameraView.stop() }

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
      ctx.lineWidth = strokeWidth
      ctx.strokeWidth = strokeWidth
      ctx.strokeStyle = color
      for (let i = 0; i < corners.length; i += 1) {
        const corner = corners[i]
        const { x, y } = corner
        ctx.lineTo(x, y)
        // this.drawPoint({ ctx, x, y, fill: color })
      }
      if (corners.length > 0) {
        ctx.lineTo(corners[0].x, corners[0].y)
      }
      ctx.stroke()
    }
  }

  // events
  onCameraUpdate = ({ pixels, canvas, ctx }) => {
    if (!this.tracking) this.tracking = new Tracking({ width: canvas.width, height: canvas.height })
    this.tracking.tick({ imageData: pixels })
    if (this.tracking.markers) {
      this.tracking.markers.forEach((marker) => {
        this.drawRectContainer({ ctx, corners: marker.corners, color: 'red', strokeWidth: 10 })
      })
      console.log(this.tracking.poses)
    }
  }

  render() {
    let classes = 'tracking-view'
    if (this.props.hideCamera) classes += ' hide-camera'
    return (
      <div className={classes}>
        <CameraView scale={1} onUpdate={this.onCameraUpdate} ref={ref => this.cameraView = ref} />
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
