import { AR, POS1 as POS } from 'js-aruco'

export default class Tracking {
  constructor({ width, height }) {
    this.width = width
    this.height = height
    this.setDefaults()
  }

  get markerList() {
    return Object.keys(this.markers).map(key => this.markers[key])
  }

  setDefaults() {
    this.markerWidth = 5 // width in millimeters
    this.detector = new AR.Detector()
    this.poser = new POS.Posit(this.markerWidth, this.width)
    this.markers = {}
    // this.poses = {}
    // this.rotations = {}
  }

  tick({ imageData } = {}) {
    this.setMarkers({ imageData })
  }

  getRotationForMarker() {
    if (this.poses.length > 0) {
      this.getRotationFromMatrix(this.poses[0])
    }
    return null
  }

  getRotationFromMatrix(matrix) {
    const x = Math.atan2(matrix[2][1], matrix[2][2])
    // const y = -Math.atan2(-matrix[2][0], Math.sqrt((matrix[2][1] ** 2) + (matrix[2][2] ** 2)))
    const y = -Math.asin(-matrix[2][0])
    const z = Math.atan2(matrix[1][0], matrix[0][0])
    return { x, y, z }
  }

  getPoseForMarker(marker) {
    const { corners } = marker
    const pose = this.poser.pose(corners)
    return pose
  }

  setMarkers({ imageData }) {
    this.markers = {}
    const markers = this.detector.detect(imageData)
    markers.forEach((marker) => {
      const pose = this.getPoseForMarker(marker)
      this.markers[marker.id] = marker
      this.markers[marker.id].pose = pose
      this.markers[marker.id].rotation = this.getRotationFromMatrix(pose.bestRotation)
    })
  }
}
