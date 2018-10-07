import React from 'react'
import TrackingView from 'modules/tracking-view'
import Marker from '../assets/img/marker.png'

class Home extends React.Component {
  componentDidMount() {
    this.cameraView.start()
  }

  render() {
    return (
      <div className="page home">
        <TrackingView markerImg={Marker} ref={ref => this.cameraView = ref} />
      </div>
    )
  }
}

export default Home
