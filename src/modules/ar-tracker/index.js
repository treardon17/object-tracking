import React from 'react'
import { ARCameraParam, ARController, artoolkit } from 'jsartoolkit5'
import Base from 'modules/module-base'
import BABYLON from '@/libraries/babylonjs/babylon.2.5.max.js'
import CameraView from '@/modules/camera-view'
import './style.scss'

class ARTracker extends Base {
  componentDidMount() {
    super.componentDidMount()
    this.sceneItems = {}
    this.setup()
  }

  setup() {
    return new Promise((resolve, reject) => {
      this.cameraView.start()
        .then(() => {
          this.width = this.cameraView.videoWidth
          this.height = this.cameraView.videoHeight
          this.setScene()
          this.addBox({ name: 'box' })
          return Promise.resolve()
        })
        .then(this.setARController.bind(this))
        .then(() => {
          this.runRenderLoop()
          return Promise.resolve()
        })
        .then(resolve)
        .catch(reject)
    })
  }

  setARController() {
    return new Promise((resolve, reject) => {
      const cameraParam = new ARCameraParam()
      cameraParam.onload = () => {
        this.arController = new ARController(this.width, this.height, cameraParam)
        // this.arController.debugSetup()
        this.camera.freezeProjectionMatrix(BABYLON.Matrix.FromArray(this.arController.getCameraMatrix()))
        resolve()
      }
      cameraParam.load('/assets/data/camera_para.dat')
    })
  }

  setScene() {
    // engine
    this.engine = new BABYLON.Engine(this.refs.arOverlay, true)
    this.engine.setSize(this.width, this.height)
    // scene
    this.scene = new BABYLON.Scene(this.engine)
    this.scene.clearColor = new BABYLON.Color4(1, 0, 0, 0)
    this.scene.useRightHandedSystem = true
    this.camera = new BABYLON.Camera('camera1', new BABYLON.Vector3(0, 0, 0), this.scene)
    this.camera.attachControl(this.refs.arOverlay, true)
    this.markerRoot = new BABYLON.AbstractMesh('markerRoot', this.scene)
    this.markerRoot.wasVisible = false
    this.markerRoot.markerMatrix = new Float64Array(12)
    this.light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), this.scene)
  }

  addBox({ name = 'box' } = {}) {
    // create a box
    const box = BABYLON.Mesh.CreateBox('box1', 1, this.scene)
    // box.position = new BABYLON.Vector3(0, 0, -5)
    box.showBoundingBox = true
    const material = new BABYLON.StandardMaterial('std', this.scene)
    material.diffuseColor = new BABYLON.Color3(0.5, 0, 0.5)
    box.material = material
    //set the marker object as box parent
    box.parent = this.markerRoot
    this.sceneItems[name] = box
  }

  removeBox({ name }) {
    const cube = this.sceneItems[name]
    if (cube) cube.dispose()
    delete this.sceneItems[name]
  }

  showMarkers(show) {
    this.markerRoot.isVisible = show
    this.markerRoot.getChildMeshes().forEach((mesh) => {
      mesh.isVisible = show
    })
  }

  runRenderLoop() {
    this.engine.runRenderLoop(this.renderAR.bind(this))
  }

  renderAR() {
    if (!this.arController || !this.cameraView) return
    this.arController.detectMarker(this.cameraView.video)
    const markerNum = this.arController.getMarkerNum()
    if (markerNum > 0) {
      if (this.markerRoot.isVisible) {
        this.arController.getTransMatSquareCont(0, 1, this.markerRoot.markerMatrix, this.markerRoot.markerMatrix)
      } else {
        this.arController.getTransMatSquare(0 /* Marker index */ , 1 /* Marker width */ , this.markerRoot.markerMatrix)
      }
      this.showMarkers(true)
      this.arController.transMatToGLMat(this.markerRoot.markerMatrix, this.markerRoot._worldMatrix.m)
    } else {
      this.showMarkers(false)
    }
    // this.arController.debugDraw()
    this.scene.render()
  }

  onCameraUpdate() {}

  render() {
    return (
      <div className="ar-tracker">
        <div className="ar-tracker-inner">
          <CameraView
            ref={(ref) => { this.cameraView = ref }}
          />
          <canvas className="ar-overlay" data-ref="arOverlay" />
        </div>
      </div>
    )
  }
}

export default ARTracker
