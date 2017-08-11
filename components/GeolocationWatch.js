import React, { Component } from 'react';
import { Button, Image, Text, View  } from 'react-native';
import { Constants, Location, Permissions, Platform } from 'expo';

import { CrossOSButton } from './ui/CrossOSButton';

export default class GeolocationWatch extends Component {

  state = {
    startLocation: {coords:{latitude:58.24, longitude:22.48}},
    //startLocation: {latitude:59.4227, longitude:24.7430}, // Tallinn
    //startLocation: null,
    location: null,
    errorLocation: null,
    heading: null,
    errorHeading: null,
    bearing: 0,
    distance: 0,
    appRunning: false,
  };


  componentWillMount() {

  }
  componentDidMount() {

  }
  componentWillUnmount() {
    if(this.state.appRunning){
      this.locationWatch.remove();
      this.headingWatch.remove();
      this.setState({appRunning : false});
    }
  }

  _updateLocation = (coords) => {
    let bearing = this._getBearing(coords);
    let distance = this._getDistance(coords);
    this.setState({location : coords, bearing : bearing, distance : distance });
  }
  _updateHeading = (heading) => {
    this.setState({heading:heading});
  }

  _getBearing = (location) =>{
    let coords = {
      lat2:this.state.startLocation.coords.latitude,
      lng2:this.state.startLocation.coords.longitude,
      lat1:location.coords.latitude,
      lng1:location.coords.longitude
    };

    let dLon = this._toRad(coords.lng2-coords.lng1);
    let y = Math.sin(dLon) * Math.cos(this._toRad(coords.lat2));
    let x = Math.cos(this._toRad(coords.lat1))*Math.sin(this._toRad(coords.lat2)) - Math.sin(this._toRad(coords.lat1))*Math.cos(this._toRad(coords.lat2))*Math.cos(dLon);
    let brng = this._toDeg(Math.atan2(y, x));
    let bearing = ((brng + 360) % 360);
    return bearing;
    //this.setState({ bearing:bearing });
  };

  _getDistance = (location) => {
    let coords = {
      lat2:this.state.startLocation.coords.latitude,
      lng2:this.state.startLocation.coords.longitude,
      lat1:location.coords.latitude,
      lng1:location.coords.longitude
    };
    const R = 6371000;
    let dLat = this._toRad(coords.lat2-coords.lat1);
    let dLon = this._toRad(coords.lng2-coords.lng1);
    let a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this._toRad(coords.lat1)) * Math.cos(this._toRad(coords.lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    ;
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    let d = Math.round(R * c);
    return d;
  }

  _toRad = (deg) => {
    return deg * Math.PI / 180;
  };
  _toDeg = (rad) => {
    return rad * 180 / Math.PI;
  };




  _compassCircleRotation = () => {
    if(this.state.heading){
      return {
       transform:[{ rotate: -this.state.heading.trueHeading+"deg" }]
      }
    } else {
      return {transform:[{ rotate: "0deg" }] }
    }
  }
  _compassArrowRotation = () => {

    if(this.state.heading){
      let angle = this.state.bearing - this.state.heading.trueHeading;
      return { position:"absolute", transform:[{ rotate: angle+"deg" }] }
    } else {
      return { position:"absolute", transform:[{ rotate: "0deg" }] }
    }

  }

  _btnPressHandler = (e) => {
    this.state.appRunning ? this._stopWatch() : this._startWatch();
  }

  _startStopWatch = async (e) => {

    if(this.state.appRunning === false){

        // give me my location at the moment
        let startLocation = await Location.getCurrentPositionAsync({enableHighAccuracy: true});
        this.setState({startLocation: startLocation});
        // start watching for my location and heading
        this.locationWatch = await Location.watchPositionAsync({enableHighAccuracy: true, timeInterval : 2000, distanceInterval : 2 }, (locationData) => {
        //this.locationWatch = await Location.watchPositionAsync({enableHighAccuracy: true}, (locationData) => {
          this._updateLocation(locationData);
        });
        this.headingWatch = await Location.watchHeadingAsync((headingData) => {
          //headingWatch = headingData;
          this._updateHeading(headingData);
        });

        this.setState({appRunning : true});

    } else {

        this.locationWatch.remove();
        this.headingWatch.remove();
        this.setState({appRunning : false});

    }



  }


  render() {
    let textLocation = 'Waiting for location';
    let textHeading = 'Waiting for heading';
    let textBearing = 'Waiting for bearing';

    if (this.state.errorLocation) {
      textLocation = this.state.errorLocation;
    } else if (this.state.location) {
      textLocation = 'MyLat: ' + this.state.location.coords.latitude + ' MyLong: ' + this.state.location.coords.longitude;
      //textLocation = JSON.stringify(this.state.location);
    }

    if (this.state.errorHeading) {
      textHeading = this.state.errorHeading;
    } else if (this.state.heading) {
      textHeading = JSON.stringify(this.state.heading.trueHeading);
    }

    return (
      <View style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View>
          <Image
            style={ this._compassCircleRotation() }
            source={require('../assets/images/compass-circle.png')}
          />
          <Image
            style={ this._compassArrowRotation() }
            source={require('../assets/images/compass-arrow.png')}
          />

        </View>

        <View>
          <Text style={{fontSize:48, textAlign:"center"}}> {this.state.distance} </Text>
          <Text style={{fontSize:10, color:"#777", textAlign:"center", marginTop:-10, marginBottom:10}}> METERS </Text>
        </View>

        <View >
          <CrossOSButton raised label={this.state.appRunning ? "STOP" : "START HERE"} onPress={this._startStopWatch.bind(this)} />

        </View>

        <View >
          <Text style={{ fontSize:10 }}>StartLat: {this.state.startLocation.coords.latitude} , StartLong: {this.state.startLocation.coords.longitude}</Text>
          <Text style={{ fontSize:10 }}>{textLocation}</Text>
          <Text style={{ fontSize:10 }}>Bearing: {JSON.stringify(this.state.bearing)}</Text>
          <Text style={{ fontSize:10 }}>Heading: {textHeading}</Text>
        </View>
      </View>
    );
  }

}
