import React from 'react'
// import ARView from '@/modules/ar-view'
// import ARJSView from '@/modules/arjs-view'
import ARTRacker from '@/modules/ar-tracker'

class Home extends React.Component {
  componentDidMount() {
    // this.cameraView.start()
  }

  render() {
    return (
      <div className="page home">
        {/* <ARView ref={ref => this.cameraView = ref} /> */}
        {/* <ARJSView /> */}
        <ARTRacker />
      </div>
    )
  }
}

export default Home
