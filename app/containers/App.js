import React, { Component, PropTypes } from 'react';
import { MuiThemeProvider } from 'material-ui';
import injectTapEventPlugin from 'react-tap-event-plugin';
import HomePage from './HomePage';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

const farsiTheme = getMuiTheme({fontFamily: 'Diplomat'});



injectTapEventPlugin();
export default class App extends Component {
  constructor(props) {
    super(props);
    this.updateDimensions = this.updateDimensions.bind(this);
    this.state = { width: 0, height: 0}
  }
  updateDimensions() {
    this.setState({width: window.innerWidth, height: window.innerHeight});
  }
  componentWillMount() {
    this.updateDimensions();
  }
  componentDidMount() {
    window.addEventListener("resize", this.updateDimensions);
  }
  componentWillUnmount() {
    window.removeEventListener("resize", this.updateDimensions);
  }
  render() {
    return (
      <div>
        <MuiThemeProvider muiTheme={farsiTheme}>
          <HomePage windowWidth={this.state.width} windowHeight={this.state.height}/>
        </MuiThemeProvider>
      </div>
    );
  }
}
