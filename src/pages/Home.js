import React from 'react'
import CameraView from 'modules/camera-view'

class Home extends React.Component {
  componentDidMount() {
    this.cameraView.start()
  }

  render() {
    return (
      <div className="page home">
        <CameraView ref={ref => this.cameraView = ref} />
      </div>
    )
  }
}

export default Home
