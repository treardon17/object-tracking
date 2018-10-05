import React from 'react'
import jsfeat from 'jsfeat'
import CameraView from 'modules/camera-view'
import Base from 'modules/module-base'
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

  setDefaults() {}
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

  // events
  onCameraUpdate = (pixels) => {
    // console.log(this.getCorners(pixels))
  }

  render() {
    return (
      <CameraView onUpdate={this.onCameraUpdate} ref={ref => this.cameraView = ref} />
    )
  }
}

export default TrackingView
