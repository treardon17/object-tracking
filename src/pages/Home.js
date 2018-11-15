import React from 'react'
// import ARView from '@/modules/ar-view'
// import ARJSView from '@/modules/arjs-view'
// import ARTRacker from '@/modules/ar-tracker'
import ARJSView2 from '@/modules/arjs-view2'

class Home extends React.Component {
  componentDidMount() {
    // this.cameraView.start()
  }

  render() {
    return (
      <div className="page home">
        {/* <ARView ref={ref => this.cameraView = ref} /> */}
        {/* <ARJSView /> */}
        {/* <ARTRacker /> */}
        <ARJSView2 />
      </div>
    )
  }
}

export default Home
