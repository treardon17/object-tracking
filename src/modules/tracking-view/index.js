import React from 'react'
import jsfeat from 'jsfeat'
import CameraView from 'modules/camera-view'
import Base from 'modules/module-base'
import Tracking from '@/scripts/tracking'
import './style.scss'


class TrackingView extends Base {
  constructor() {
    super()
    this.mounted = false
  }
  componentDidMount() {
    super.componentDidMount()
    this.setDefaults()
    this.setBinds()
    this.mounted = true
  }

  setDefaults() {
    this.tracking = new Tracking()
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

  getBlurredImage(imageData) {
    const { canvas } = this.refs
    const blurredImg = new jsfeat.matrix_t(canvas.width, canvas.height, jsfeat.U8_t | jsfeat.C1_t)
    jsfeat.imgproc.gaussian_blur(imageData.data, blurredImg, 3)
    return blurredImg
  }

  drawPoint({ ctx, canvas, x, y, radius = 5, fill = 'red' }) {
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

  // events
  onCameraUpdate = ({ pixels, canvas, ctx }) => {
    // ctx.rect(0, 0, 100, 100)
    // ctx.fill()
    // ctx.fillStyle = 'red'
    // ctx.beginPath()
    // ctx.arc(0, 0, 5, 0, 2 * Math.PI)
    // ctx.fill()

    const descriptors = this.tracking.ORBDescriptors(pixels)
    const { keypoints } = descriptors
    this.drawORBDescriptors({ ctx, radius: 2, keypoints })

    // ctx.stroke()
    // console.log(orb)
    // console.log(this.getCorners(pixels))
  }

  render() {
    return (
      <div className="tracking-view">
        <CameraView scale={0.3} onUpdate={this.onCameraUpdate} ref={ref => this.cameraView = ref} />
      </div>
    )
  }
}

export default TrackingView
