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
    // const x = Math.atan2(matrix[2][1], matrix[2][2])
    // // const y = -Math.atan2(-matrix[2][0], Math.sqrt((matrix[2][1] ** 2) + (matrix[2][2] ** 2)))
    // const y = -Math.asin(-matrix[2][0])
    // const z = Math.atan2(matrix[1][0], matrix[0][0])
    const [r11, r12, r13] = matrix[0]
    const [r21, r22, r23] = matrix[1]
    const [r31, r32, r33] = matrix[2]

    const vector = { x: 0, y: 0, z: 0 }

    if (r31 !== 1 && r31 !== -1) {
      const y1 = -Math.sin(r31)
      const y2 = Math.PI - y1

      const x1 = Math.atan2((r32 / Math.cos(y1)), (r33 / Math.cos(y1)))
      const x2 = Math.atan2((r32 / Math.cos(y2)), (r33 / Math.cos(y2)))

      const z1 = Math.atan2((r21 / Math.cos(y1)), (r11 / Math.cos(y1)))
      const z2 = Math.atan2((r21 / Math.cos(y2)), (r11 / Math.cos(y2)))

      vector.x = x2
      vector.y = y2
      vector.z = z2
    } else if (r31 === -1) {
      const z = 0
      const y = Math.PI / 2
      const x = -z + Math.atan2(r12, r13)

      vector.x = x
      vector.y = y
      vector.z = z
    } else if (r31 === 1) {
      const z = 0
      const y = -Math.PI / 2
      const x = -z + Math.atan2(-r12, -r13)

      vector.x = x
      vector.y = y
      vector.z = z
    }

    return vector
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
