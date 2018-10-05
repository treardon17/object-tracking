import React from 'react'
import TrackingView from 'modules/tracking-view'

class Home extends React.Component {
  componentDidMount() {
    this.cameraView.start()
  }

  render() {
    return (
      <div className="page home">
        <TrackingView ref={ref => this.cameraView = ref} />
      </div>
    )
  }
}

export default Home
