import React from 'react'
import jsfeat from 'jsfeat'
import PropTypes from 'prop-types'
import CameraView from 'modules/camera-view'
import Base from 'modules/module-base'
import Tracking from '@/scripts/tracking'
import BABYLON from 'babylonjs'
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
      this.width = width
      this.height = height
      this.tracking = new Tracking({ width, height })
      this.setScene({ width, height })
      this._setup = true
    }
  }

  // /////////////////////////////////
  // THREEJS
  // /////////////////////////////////
  setScene({ width, height }) {
    this.refs.canvasOverlay.width = width
    this.refs.canvasOverlay.height = height
    this.engine = new BABYLON.Engine(this.refs.canvasOverlay, true, { preserveDrawingBuffer: true, stencil: true })
    this.scene = new BABYLON.Scene(this.engine)
    this.scene.clearColor = new BABYLON.Color4(0, 0, 0, 0)
    this.camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 5, -10), this.scene)

    this.camera.setTarget(BABYLON.Vector3.Zero())
    this.camera.attachControl(this.refs.canvasOverlay, false)
    this.light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), this.scene)

    this.sceneItems = {}
  }

  addCubeIfNeeded({ name }) {
    if (!this.sceneItems[name]) {
      const cube = new BABYLON.Mesh.CreateBox('mesh', 3, this.scene)
      cube.showBoundingBox = true
      const material = new BABYLON.StandardMaterial('std', this.scene)
      material.diffuseColor = new BABYLON.Color3(0.5, 0, 0.5)

      cube.material = material

      this.sceneItems[name] = cube
    }
  }

  removeCube({ name }) {
    const cube = this.sceneItems[name]
    if (cube) cube.dispose()
    delete this.sceneItems[name]
  }

  removeExtraCubes() {
    if (this.tracking.markers) {
      const markerKeys = Object.keys(this.tracking.markers)
      const sceneKeys = Object.keys(this.sceneItems)
      const keysToRemove = sceneKeys.filter(i => markerKeys.indexOf(i) < 0)
      keysToRemove.forEach((name) => {
        this.removeCube({ name })
      })
    }
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

  getWorldVector({ x = 0, y = 0, z = 0, width = 0, height = 0 }) {
    return BABYLON.Vector3.UnprojectFromTransform(new BABYLON.Vector3(x, y, z), width, height, BABYLON.Matrix.Identity(), this.scene.getTransformMatrix())
  }

  setCubes({ ctx, rotate = true, translate = true } = {}) {
    if (this.tracking.markers) {
      this.removeExtraCubes()
      this.tracking.markerList.forEach((marker) => {
        this.drawRectContainer({ ctx, corners: marker.corners, color: 'red', strokeWidth: 5 })
        this.addCubeIfNeeded({ name: marker.id })
        const cube = this.sceneItems[marker.id]
        // translation
        if (translate) {
          const [x, y, z] = marker.pose.bestTranslation
          const vector = this.getWorldVector({ x, y, z, width: this.width, height: this.height })
          console.log(vector)
        }

        // rotation
        if (rotate) {
          // const [x, y, z] = marker.pose.bestTranslation
          // cube.position.x = x / base
          // cube.position.y = -y / base
          // cube.position.z = -z / base
          // cube.position.x = vector.x
          // cube.position.y = vector.y
          // cube.position.z = vector.z
          const { x, y, z } = marker.rotation
          cube.rotation.x = -x // correct
          // cube.rotation.y = y
          // // console.log('y:', y, Math.PI / 2)
          cube.rotation.z = -z // correct
        }
      })
    }
  }

  renderScene() {
    this.scene.render()
  }

  // /////////////////////////////////
  // EVENTS
  // /////////////////////////////////
  onCameraUpdate = ({ pixels, canvas, ctx }) => {
    this.setupIfNeeded({ width: canvas.width, height: canvas.height })
    this.tracking.tick({ imageData: pixels })
    this.setCubes({ ctx })
    this.renderScene()
  }

  // /////////////////////////////////
  // RENDER
  // /////////////////////////////////
  render() {
    let classes = 'tracking-view'
    if (this.props.hideCamera) classes += ' hide-camera'
    return (
      <div className={classes}>
        <CameraView scale={0.5} onUpdate={this.onCameraUpdate} ref={ref => this.cameraView = ref} />
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
