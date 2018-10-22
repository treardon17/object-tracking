import React from 'react'
import ARView from '@/modules/ar-view'

class Home extends React.Component {
  componentDidMount() {
    // this.cameraView.start()
  }

  render() {
    return (
      <div className="page home">
        <ARView ref={ref => this.cameraView = ref} />
      </div>
    )
  }
}

export default Home
