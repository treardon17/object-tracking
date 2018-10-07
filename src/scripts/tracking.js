import { AR, POS1 } from 'js-aruco'

export default class Tracking {
  constructor({ width, height }) {
    this.width = width
    this.height = height
    this.setDefaults()
  }

  setDefaults() {
    this.markerWidth = 10 // width in millimeters
    this.detector = new AR.Detector()
    this.poser = new POS1.Posit(this.markerWidth, this.width)
    this.markers = null
    this.poses = []
  }

  tick({ imageData } = {}) {
    this.markers = this.detector.detect(imageData)
    this.setPoses()
  }

  setPoses() {
    if (this.markers) {
      this.poses = []
      this.markers.forEach((marker) => {
        const { corners } = marker
        // for (let i = 0; i < corners.length; ++i) {
        //   const corner = corners[i]
        //   corner.x -= (this.width / 2)
        //   corner.y = (this.height / 2) - corner.y
        // }
        this.poses.push(this.poser.pose(corners))
      })
    }
  }
}
