import React from 'react'
import { ARCameraParam, ARController, artoolkit } from 'jsartoolkit5'
import Base from 'modules/module-base'
import BABYLON from 'babylonjs'
// import * as THREE from 'three'
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
      // this.width = 640
      // this.height = 480
      // this.setScene()
      // this.addBox({ name: 'box' })
      // // this.showMarkers(true)
      // this.scene.render()
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
        this.arController.debugSetup()
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
    const box = BABYLON.Mesh.CreateBox('mesh', 1, this.scene)
    box.position = new BABYLON.Vector3(0, 0, -5)
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
    } else {
      this.showMarkers(false)
    }
    this.arController.debugDraw()
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
  // componentDidMount() {
  //   this.width = 640
  //   this.height = 480
  //   // console.log(new THREE.Camera().projectionMatrix)
  //   ARController.getUserMediaThreeScene({
  //     maxARVideoSize: 320,
  //     cameraParam: '/assets/data/camera_para-iPhone5rear640x4801.0m.dat',
  //     onSuccess: () => {
  //       console.log('on success!')
  //     }
  //   })
  // }
  // render() {
  //   return (
  //     <div>
  //       <h1>hello</h1>
  //     </div>
  //   )
  // }
  // componentDidMount() {
  //   super.componentDidMount()
  //   this.setDefaults()
  //   this.setBinds()
  //   this.setup()
  // }

  // // ////////////////////
  // // SETUP
  // // ////////////////////

  // setDefaults() {
  //   this.sceneItems = {}
  //   this.debug = false
  //   this.width = 0
  //   this.height = 0
  //   this.ready = false
  //   this.arController = null
  //   this.arControllerStatus = null
  //   this.camera = null
  //   this.light = null
  //   this.loadingManager = null
  // }

  // setBinds() {
  //   window.addEventListener('resize', this.onResize.bind(this))
  // }

  // setup() {
  //   return new Promise((resolve, reject) => {
  //     this.startCamera()
  //       .then(() => this.setupARToolkit())
  //       .then(() => {
  //         this.setRenderSize()
  //         this.setScene()
  //         this.addCube({ name: 'cube' })
  //         this.ready = true
  //         console.log('ready', this.width, this.height)
  //         resolve()
  //       })
  //       .catch(reject)
  //     // this.width = 640
  //     // this.height = 480
  //     // this.setScene()
  //     // this.setRenderSize()
  //     // this.addCube({ name: 'cube', focus: true })
  //     // this.renderScene()
  //   })
  // }

  // startCamera() {
  //   return new Promise((resolve, reject) => {
  //     this.cameraView.start()
  //       .then(() => {
  //         this.setRenderSize()
  //         resolve()
  //       })
  //       .catch(reject)
  //   })
  // }

  // // ////////////////////
  // // ARTOOLKIT
  // // ////////////////////

  // setupARToolkit() {
  //   this.arControllerStatus = 'loading'
  //   return new Promise((resolve, reject) => {
  //     this.arController = new ARController(this.width, this.height, '/assets/data/camera_para.dat')
  //     this.arController.onload = () => {
  //       this.arControllerStatus = 'loaded'
  //       if (this.debug) {
  //         this.arController.debugSetup()
  //         const arCanvas = document.querySelectorAll('.ar-canvas')
  //         for (let i = 0; i < arCanvas.length; i += 1) document.body.removeChild(arCanvas[i])
  //         const { canvas } = this.arController
  //         canvas.classList.add('ar-canvas')
  //         canvas.style.position = 'absolute'
  //         canvas.style.top = 0
  //         canvas.style.left = '50%'
  //         canvas.style.transform = 'translate3d(-50%, 0, 0)'
  //       }
  //       resolve()
  //     }
  //   })
  // }

  // aRToolkitProcess(video) {
  //   if (!this.arControllerStatus && video != null) {
  //     const { videoWidth, videoHeight } = video
  //     this.setupARToolkit({ width: videoWidth, height: videoHeight })
  //   } else if (this.arControllerStatus === 'loaded' && video != null) {
  //     this.arController.process(video)
  //     const projectionMatrix = this.arController.getCameraMatrix()
  //     // this.camera.projectionMatrix.elements.set(projectionMatrix)
  //     // if (barcodeMarkers && barcodeMarkers[0]) {
  //     //   const matrix = new THREE.Matrix4()
  //     //   const otherMatrix = this.arController.getMarkerTransformationMatrix()
  //     //   // const otherMatrix = barcodeMarkers[0].matrix
  //     //   matrix.elements = [...otherMatrix, 0, 0, 0, 1]
  //     //   this.sceneItems.cube.geometry.applyMatrix(matrix)
  //     //   this.sceneItems.cube.updateMatrix()
  //     // }
  //     // console.log(this.arController.getMarker(0))
  //     // this.numMarkers = this.arController.getMarkerNum()
  //     // if (markerNum > 0) {
  //     //   // marker index, marker width
  //     //   // this.arController.getTransMatSquare(0, 1, markerRoot.userData.markerMatrix)
  //     //   // this.arController.transMatToGLMat(markerRoot.userData.markerMatrix, markerRoot.matrix.elements)
  //     // }
  //     // console.log(barcodeMarkers)
  //     // const matrix = this.arController.getTransformationMatrix()
  //     // console.log(matrix)
  //   }
  // }


  // // ////////////////////
  // // SCENE
  // // ////////////////////

  // setScene() {
  //   // init renderer
  //   this.renderer = new THREE.WebGLRenderer({
  //     canvas: this.refs.canvasOverlay,
  //     antialias: true,
  //     alpha: true
  //   })
  //   this.setRenderSize()
  //   // init scene and camera
  //   this.scene = new THREE.Scene()
  //   // create a camera
  //   this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 1000)
  //   // this.camera.position.set(30, 30, 30)
  //   this.scene.add(this.camera)
  //   // add light
  //   this.light = new THREE.DirectionalLight(0xffffff)
  //   this.light.position.set(0, 1, 1).normalize()
  //   this.scene.add(this.light)

  //   // Setup loading manager
  //   this.loadingManager = new THREE.LoadingManager()
  //   this.loadingManager.onProgress = (item, loaded, total) => {
  //     console.log(item, loaded, total)
  //   }

  //   this.scene.visible = true
  // }

  // addCube({ name, focus = false }) {
  //   const geometry = new THREE.CubeGeometry(0.5, 0.5, 0.5)
  //   const material = new THREE.MeshNormalMaterial({
  //     transparent: true,
  //     opacity: 0.5,
  //     side: THREE.DoubleSide
  //   })
  //   const mesh = new THREE.Mesh(geometry, material)
  //   mesh.position.y = geometry.parameters.height / 2
  //   this.scene.add(mesh)
  //   if (focus) {
  //     this.camera.position.z = 5
  //   }
  //   if (name) this.sceneItems[name] = mesh
  // }

  // addMonkey({ name }) {
  //   return new Promise((resolve) => {
  //     const loader = new THREE.OBJLoader(this.loadingManager)
  //     loader.load('/assets/mesh/monkeyAward.obj', (obj) => {
  //       // scale monkey
  //       obj.position.y = 2.5 * 0.5
  //       obj.scale.x = 0.5
  //       obj.scale.y = 0.5
  //       obj.scale.z = 0.5

  //       const material = new THREE.MeshPhongMaterial({
  //         ambient: 0x050505,
  //         color: 0xffffff,
  //         specular: 0x555555,
  //         shininess: 30
  //       })

  //       obj.traverse((child) => {
  //         if (child instanceof THREE.Mesh) child.material = material
  //       })

  //       this.scene.add(obj)
  //       if (name) this.sceneItems[name] = obj
  //       resolve()
  //     })
  //   })
  // }

  // renderScene() {
  //   if (this.scene && this.camera) {
  //     this.renderer.render(this.scene, this.camera)
  //   }
  // }

  // setRenderSize() {
  //   this.width = this.cameraView.videoWidth
  //   this.height = this.cameraView.videoHeight
  //   if (this.renderer) {
  //     this.renderer.setSize(this.width, this.height, false)
  //   }
  //   if (this.refs.canvasOverlay) {
  //     this.refs.canvasOverlay.width = this.width
  //     this.refs.canvasOverlay.height = this.height
  //   }
  // }

  // // ////////////////////
  // // EVENTS
  // // ////////////////////

  // onResize() {
  //   console.log('resizing')
  //   this.setRenderSize()
  // }

  // onCameraUpdate = ({ video }) => {
  //   if (this.ready) {
  //     this.aRToolkitProcess(video)
  //     this.renderScene()
  //   }
  // }

  // // ////////////////////
  // // RENDER
  // // ////////////////////

  // render() {
  //   return (
  //     <div className="ar-tracker">
  //       <div className="ar-tracker-inner">
  //         <CameraView
  //           ref={(ref) => { this.cameraView = ref }}
  //           onUpdate={this.onCameraUpdate}
  //         />
  //         <canvas width={640} height={480} className="canvas-overlay" data-ref="canvasOverlay" />
  //       </div>
  //     </div>
  //   )
  // }
}

export default ARTracker
