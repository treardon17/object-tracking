import React from 'react'
import Base from 'modules/module-base'
import { ARCameraParam, ARController, artoolkit } from 'jsartoolkit5'
import * as THREE from 'three'
import CameraView from '@/modules/camera-view'
import './style.scss'


class ARTracker extends Base {
  componentDidMount() {
    super.componentDidMount()
    this.setDefaults()
    this.setBinds()
    this.setup()
  }

  // ////////////////////
  // SETUP
  // ////////////////////

  setDefaults() {
    this.sceneItems = {}
    this.debug = false
  }

  setBinds() {
    window.addEventListener('resize', this.onResize.bind(this))
  }

  setup() {
    return new Promise((resolve, reject) => {
      this.setScene()
      this.addCube({ name: 'cube' })
      this.cameraView.start()
        .then(this.setupARToolkit.bind(this))
        .then(resolve)
        .catch(reject)
    })
  }

  // ////////////////////
  // ARTOOLKIT
  // ////////////////////

  setupARToolkit({ width, height }) {
    this.arControllerStatus = 'loading'
    return new Promise((resolve, reject) => {
      this.arController = new ARController(width, height, '/assets/data/camera_para.dat')
      this.arController.onload = () => {
        this.arControllerStatus = 'loaded'
        if (this.debug) {
          this.arController.debugSetup()
          const arCanvas = document.querySelectorAll('.ar-canvas')
          for (let i = 0; i < arCanvas.length; i += 1) document.body.removeChild(arCanvas[i])
          const { canvas } = this.arController
          canvas.classList.add('ar-canvas')
          canvas.style.position = 'absolute'
          canvas.style.top = 0
          canvas.style.left = '50%'
          canvas.style.transform = 'translate3d(-50%, 0, 0)'
        }
        resolve()
      }
    })
  }

  aRToolkitProcess(video) {
    if (!this.arControllerStatus && video != null) {
      const { videoWidth, videoHeight } = video
      this.setupARToolkit({ width: videoWidth, height: videoHeight })
    } else if (this.arControllerStatus === 'loaded' && video != null) {
      this.arController.process(video)
      const { barcodeMarkers } = this.arController
      // if (barcodeMarkers && barcodeMarkers[0]) {
      //   const matrix = new THREE.Matrix4()
      //   const otherMatrix = this.arController.getMarkerTransformationMatrix()
      //   // const otherMatrix = barcodeMarkers[0].matrix
      //   matrix.elements = [...otherMatrix, 0, 0, 0, 1]
      //   this.sceneItems.cube.geometry.applyMatrix(matrix)
      //   this.sceneItems.cube.updateMatrix()
      // }
      // console.log(this.arController.getMarker(0))
      // this.numMarkers = this.arController.getMarkerNum()
      // if (markerNum > 0) {
      //   // marker index, marker width
      //   // this.arController.getTransMatSquare(0, 1, markerRoot.userData.markerMatrix)
      //   // this.arController.transMatToGLMat(markerRoot.userData.markerMatrix, markerRoot.matrix.elements)
      // }
      // console.log(barcodeMarkers)
      // const matrix = this.arController.getTransformationMatrix()
      // console.log(matrix)
    }
  }


  // ////////////////////
  // SCENE
  // ////////////////////

  setScene() {
    // init renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.refs.canvasOverlay,
      antialias: true,
      alpha: true
    })
    // init scene and camera
    this.scene = new THREE.Scene()
    // create a camera
    this.camera = new THREE.Camera()
    this.scene.add(this.camera)
    // add light
    this.light = new THREE.DirectionalLight(0xffffff)
    this.light.position.set(0, 1, 1).normalize()
    this.scene.add(this.light)

    // Setup loading manager
    this.loadingManager = new THREE.LoadingManager()
    this.loadingManager.onProgress = (item, loaded, total) => {
      console.log(item, loaded, total)
    }

    this.scene.visible = true
  }

  addCube({ name }) {
    const geometry = new THREE.CubeGeometry(1, 1, 1)
    const material = new THREE.MeshNormalMaterial({
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.y = geometry.parameters.height / 2
    this.scene.add(mesh)
    if (name) this.sceneItems[name] = mesh
  }

  addMonkey({ name }) {
    return new Promise((resolve) => {
      const loader = new THREE.OBJLoader(this.loadingManager)
      loader.load('/assets/mesh/monkeyAward.obj', (obj) => {
        // scale monkey
        obj.position.y = 2.5 * 0.5
        obj.scale.x = 0.5
        obj.scale.y = 0.5
        obj.scale.z = 0.5

        const material = new THREE.MeshPhongMaterial({
          ambient: 0x050505,
          color: 0xffffff,
          specular: 0x555555,
          shininess: 30
        })

        obj.traverse((child) => {
          if (child instanceof THREE.Mesh) child.material = material
        })

        this.scene.add(obj)
        if (name) this.sceneItems[name] = obj
        resolve()
      })
    })
  }

  setCanvasSize() {
    if (this.refs.canvasOverlay && this.cameraView) {
      const width = this.cameraView.videoWidth
      const height = this.cameraView.videoHeight
      this.refs.canvasOverlay.width = width
      this.refs.canvasOverlay.height = height
      this.renderer.setSize(width, height, false)
    }
  }

  // ////////////////////
  // EVENTS
  // ////////////////////

  onResize() {
    console.log('resizing')
  }

  onCameraUpdate = ({ video }) => {
    this.setCanvasSize()
    this.renderer.render(this.scene, this.camera)
    this.aRToolkitProcess(video)
  }

  // ////////////////////
  // RENDER
  // ////////////////////

  render() {
    return (
      <div className="ar-tracker">
        <div className="ar-tracker-inner">
          <CameraView
            ref={(ref) => { this.cameraView = ref }}
            onUpdate={this.onCameraUpdate}
          />
          <canvas className="canvas-overlay" data-ref="canvasOverlay" />
        </div>
      </div>
    )
  }
}

export default ARTracker
