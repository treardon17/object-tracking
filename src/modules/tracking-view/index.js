import React from 'react'
import jsfeat from 'jsfeat'
import PropTypes from 'prop-types'
import CameraView from 'modules/camera-view'
import Base from 'modules/module-base'
import Tracking from '@/scripts/tracking'
import THREE from 'three.js'
// import Util from '@/util'
import './style.scss'


class TrackingView extends Base {
  componentDidMount() {
    super.componentDidMount()
    this.setDefaults()
  }


  // /////////////////////////////////
  // SETUP
  // /////////////////////////////////
  setDefaults() {}

  setupIfNeeded({ width, height }) {
    if (!this._setup) {
      this.tracking = new Tracking({ width, height })
      this.setScene({ width, height })
      this._setup = true
    }
  }

  // /////////////////////////////////
  // THREEJS
  // /////////////////////////////////
  setScene({ width, height }) {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    this.renderer = new THREE.WebGLRenderer({ canvas: this.refs.canvasOverlay, alpha: true })
    this.renderer.setSize(width, height)
    this.camera.position.z = 50

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
    this.scene.add(this.directionalLight)

    this.sceneItems = {}
    this.addCube({ name: 'test' })
  }

  addCube({ name }) {
    const geometry = new THREE.BoxGeometry(10, 10, 10)
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    const cube = new THREE.Mesh(geometry, material)

    const eGeometry = new THREE.EdgesGeometry(cube.geometry)
    const eMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 10 })
    const edges = new THREE.LineSegments(eGeometry, eMaterial)
    cube.add(edges)


    cube.name = name
    this.sceneItems[name] = cube
    this.scene.add(cube)
  }

  // /////////////////////////////////
  // ACTIONS
  // /////////////////////////////////
  start() { this.cameraView.start() }
  stop() { this.cameraView.stop() }

  // /////////////////////////////////
  // HELPERS
  // /////////////////////////////////
  drawPoint({ ctx, canvas, x, y, radius = 2, fill = 'red' }) {
    if (!ctx && canvas) ctx = canvas.getContext('2d') // eslint-disable-line
    ctx.fillStyle = fill
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, 2 * Math.PI)
    ctx.fill()
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
        // this.drawPoint({ ctx, x, y, radius: 5, fill: i === 0 ? 'blue' : color })
      }
      if (corners.length > 0) {
        ctx.lineTo(corners[0].x, corners[0].y)
      }
      ctx.stroke()
    }
  }

  // /////////////////////////////////
  // EVENTS
  // /////////////////////////////////
  onCameraUpdate = ({ pixels, canvas, ctx }) => {
    this.setupIfNeeded({ width: canvas.width, height: canvas.height })
    this.tracking.tick({ imageData: pixels })
    if (this.tracking.markers && this.tracking.markers.length > 0) {
      this.tracking.markers.forEach((marker) => {
        this.drawRectContainer({ ctx, corners: marker.corners, color: 'red', strokeWidth: 5 })
      })
      if (this.sceneItems.test && this.tracking.poses.length > 0) {
        const { test } = this.sceneItems
        if (test.rotation.z < Math.PI * 2) {
          test.rotation.z += 0.1
        }
        const { poses } = this.tracking
        const [pose] = poses
        // rotation
        // test.rotation.z = pose.bestRotation[0][0] // eslint-disable-line
        // console.log(pose.bestRotation[0])
        // test.rotation.z = pose.bestRotation[0][1] // eslint-disable-line
        // test.rotation.x = pose.bestRotation[0][2] // eslint-disable-line
        // position
        // console.log(test)
        const [x, y, z] = pose.bestTranslation
        const denominator = this.camera.position.z
        // test.position.x = x
        // test.position.y = -(y / denominator) - ((canvas.height / 2) / denominator)
        // test.position.z = -(z / denominator)
        // test.position.x = (x / denominator) - (canvas.width / 2)
        // test.position.y = -((y / denominator) - (canvas.height / 2))
        // test.position.z = -(z / 100)
        // test.position.set(...pose.bestTranslation)
      }
    }
    this.renderer.render(this.scene, this.camera)
  }

  // /////////////////////////////////
  // RENDER
  // /////////////////////////////////
  render() {
    let classes = 'tracking-view'
    if (this.props.hideCamera) classes += ' hide-camera'
    return (
      <div className={classes}>
        <CameraView scale={1} onUpdate={this.onCameraUpdate} ref={ref => this.cameraView = ref} />
        <canvas className="canvas-overlay" data-ref="canvasOverlay" />
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
