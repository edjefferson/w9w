import React, { useState, useEffect, useRef } from 'react';
import './App.css';

import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import CloseIcon from '@mui/icons-material/Close';

import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, Rectangle, FeatureGroup, useMap, ZoomControl, useMapEvents} from 'react-leaflet'
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

import ReactGA from "react-ga4";

const { REACT_APP_GA_TAG } = process.env;

ReactGA.initialize(REACT_APP_GA_TAG);


let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor:  [12.5,41],
});

L.Marker.prototype.options.icon = DefaultIcon;

const RecenterAutomatically = ({lat,lng,setCoords,setZoomLevel,setInputState}) => {
  const map = useMap();
   useEffect(() => {
     map.setView([lat, lng]);

   }, [lat, lng]);


   const mapEvents = useMapEvents({
      click(e) {                                
        setCoords({lat: e.latlng.lat, lng: e.latlng.lng})  
        setInputState(0)           
      },
      zoomend: () => {
        setZoomLevel(mapEvents.getZoom());
    },            
    })
   return null;
 }



const App = () => {

  const [options, setOptions] = useState([]);
  const [inputValue, setInputValue] = useState([]);
  const [coords,setCoords] = useState({lat: 51.509865, lng: -0.118092})
  const [zoomLevel,setZoomLevel] = useState(15)
  const [placeLabel,setPlaceLabel] = useState("London")
  const [value,setValue] = useState([])
  const [copyState,setCopyState] = useState(0)
  const [inputState,setInputState] = useState(0)
  const intervalRef = useRef();

  const copyRef = useRef();
  const inputRef = useRef();

  useEffect(() => {
    ReactGA.send("pageview");
  }, []);

  
  const wholist = [
    "Hartnell",
    "Troughton",
    "Pertwee",
    "TBaker",
    "Davison",
    "CBaker",
    "McCoy",
    "McGann",
    "Eccleston",
    "Tennant",
    "Smith",
    "Capaldi",
    "Whittaker",
    "Gatwa",
    "Hurt",
    "Martin",
    "Cushing"
  ]
  
  const finalgrid = [
    [0,1,2,3],
    [4,5,6,7],
    [8,9,10,11],
    [12,13,14,15]
  ]

  const latSize = 180.0/(Math.pow(wholist.length-1,4))
  const lngSize = 360.0/(Math.pow(wholist.length-1,4))


  const convert = (x_or_y,mode,accuracy,how_many_whos) => {


    let max = mode === "lat" ? 180 : 360

    let last_square = how_many_whos * (max/2 +x_or_y)/max



    let squares = [Math.floor(last_square)]
    let y = 0
    while (y < accuracy - 1) {
      last_square = how_many_whos * (last_square - Math.floor(last_square))
      squares.push(Math.floor(last_square))
      y+=1
    }

    let x = - max/2
    squares.forEach( (f,i) => {
      x +=  f/parseFloat(how_many_whos)** (i+1) * max

    })
    return [squares,x]
  }
 
  const get_final_grid = (final_lat,final_lng,lat,lng) => {
    let y = Math.floor(4*(lat - final_lat)/latSize)
    let x = Math.floor(4*(lng - final_lng)/lngSize)
  

    return finalgrid[x][y]
  }

  const reverse_final_grid = (no) => {
    let x = finalgrid.findIndex(g => g.includes(no))
    let y = finalgrid[x].indexOf(no)
    return [x,y]
  }

  const rotateNumbers = (numbers) => {
    let lastNumber = numbers.pop()
    let rotated = numbers.map((n) => n + lastNumber > wholist.length - 1 ? n + lastNumber - (wholist.length ) : n + lastNumber) 
    rotated.push(lastNumber)
    let iRotate = rotated.map((n, i) => n + i > wholist.length - 1 ? n + i - (wholist.length ) : n + i) 
    return iRotate
  }

  const unrotateNumbers = (numbers) => {
    let iUnrotate = numbers.map((n, i) => n - i < 0 ? n - i + wholist.length  : n - i) 

    let lastNumber = iUnrotate.pop()

    let unrotated = iUnrotate.map((n) => n - lastNumber < 0  ? n - lastNumber + wholist.length : n - lastNumber)
    unrotated.push(lastNumber)
    return unrotated
  }

  const get_whos = (lat,lng,accuracy,wholist) => {
    let [ys, final_lat] = convert(lat,"lat",accuracy,wholist.length)
    let [xs, final_lng] = convert(lng,"lng",accuracy,wholist.length)
    let final_grid_doc = get_final_grid(final_lat,final_lng,lat,lng)
    let numbers = [...Array(accuracy).keys()].map((x => [xs[x],ys[x]])).flat()
    numbers.push(final_grid_doc)

    let rotatedNumbers = rotateNumbers(numbers)
    return rotatedNumbers.map(n => wholist[n])
  }


  const deconvert = (squares,mode,how_many_whos) => {
    let max = mode === "lat" ? 180 : 360

    
    let x = - max/2
    squares.forEach( (f,i) => {
      x +=  f/parseFloat(how_many_whos)** (i+1) * max
    })
    return x
  }


  const decode_whos = (whos,wholist) => {
    let xs = []
    let ys = []
    let who_nums = whos.map(w => wholist.indexOf(w))
    let unrotated_whos = unrotateNumbers(who_nums)
    let last_who = unrotated_whos.pop()
    let final_grid_pos = reverse_final_grid(last_who)
    
    unrotated_whos.forEach((w,i) =>  i % 2 !== 0 ? ys.push(w) : xs.push(w))
    let lat = deconvert(ys,"lat",wholist.length) + final_grid_pos[1] * latSize/4
    let lng = deconvert(xs,"lng",wholist.length) + final_grid_pos[0] * lngSize/4


    return [lat,lng]
  }




  const decoded = [coords.lat,coords.lng]
  let rectangle = [
    decoded,
    [decoded[0]+latSize/4,decoded[1]+ lngSize/4],
  ]





  const getEncodedWhos = (lat,lng) => {
    return get_whos(coords.lat,coords.lng,4,wholist)
  }

  useEffect(() => {

    setPlaceLabel("London, Greater London, England, United Kingdom")
    setValue(getEncodedWhos(coords.lat,coords.lng))
  },[])

  const onInputChange = (e) => {
    console.log(e.target.value)
    setInputValue(e.target.value)
  }

  useEffect(()=> {
    clearTimeout(intervalRef.current)
    
    if (inputValue.length > 0 && inputValue.startsWith("/") && inputValue.includes(".")) {
      let whostring = inputValue.replace(/(\/+)/,"/").split("/")[1]
      let whos = whostring.trim().split(".").map(w => w.toLowerCase())
      let downcased_whos = wholist.map(w => w.toLowerCase())
      let who_check = true

      whos.forEach(w => {if(downcased_whos.indexOf(w) < 0) who_check = false })
      if (whos.length === 9 && who_check) {
        let [lat,lng] = decode_whos(whos,downcased_whos)

        setOptions([{label: inputValue, key: 1, lat: lat, lng: lng}])
        
      } else {
        console.log("error")
      }
    } else {
      setOptions([])
      console.log("ape")
      intervalRef.current = setTimeout(() => {
        fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(inputValue)}&format=json`,
        {method: "GET"})
          .then((response) => response.json())
          .then((data) => {
            let newOptions = data.map((d)=> { return {label: d.display_name, key: d.place_id, lat: d.lat, lng: d.lon, id: d.place_id}})
            console.log(newOptions)
            setOptions(newOptions)
          }
          )},500)
        }

  
    
    
  },[inputValue])

  useEffect(() => {
    setValue(getEncodedWhos(coords.lat,coords.lng))
  }, [coords])


  const formatw9w = (value) => {
    
    return <ul className="wholist">{value.map((w,i) => <li key={i} className="wholistwho">{i === value.length -1 ? w :  w + "."}</li>)}</ul>
  }

  const copyContent = () => {
    navigator.clipboard.writeText("/////////" + value.join("."))
    setCopyState(1)
  }

  const inputOn = () => {
    setInputValue("")
    setInputState(1)
  }

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();

  },[inputState,inputRef])

  useEffect(() => {
    if (copyState) {
      copyRef.current = setTimeout(() => setCopyState(0), 500);
    }
    return () => {
      
      clearTimeout(copyRef.current);
    }
  }, [copyState])

  return (
    <div className="App">
      <div id="title"><h1><span id="slashes">{"/////////"}</span>what9whos</h1></div>


      <div id="search-box" className="search-box">
        

     

      </div>
      {inputState ? <><div id="input-box" className="search-box">
      <div id="backicon"><ArrowBackIosIcon onClick={() => setInputState(0)} color="action"/>   </div>
     
        <input ref={inputRef} onChange={onInputChange} placeholder="Search"></input>
        <div id="closeicon"><CloseIcon onClick={() => setInputState(0)} color="action"/>   </div>
      </div>
      
      {options.length > 0 ? 
      <div id="infobox">
        {options.map((o,i)=> <div className="searchoption" key={i} onClick={() => {
          setCoords({lat: parseFloat(o.lat), lng: parseFloat(o.lng)})
          setInputState(0)
}}>{o.label}</div>)}
        </div>
        :
      <div id="infobox">

        <p>Search for any place or what9whos address</p>
      <p>e.g. Ianto Jones Shrine</p>
      <ul className="wholist"><li>///////// Smith.</li><li>Cushing.</li><li>Tennant.</li><li>Capaldi.</li><li>CBaker.</li><li>Tennant.</li><li>Gatwa.Capaldi.</li><li>Smith</li></ul></div>
}
      </>:
      <div id="search-box-new" className="search-box"><div id="w9waddress" onClick={inputOn}><span id="slashessb">/////////</span><span id="whoscontainer">{formatw9w(value)}</span></div><div id="buttons">{copyState ? <span>Copied</span> : <div><ContentCopyIcon color="action" onClick={copyContent} /></div>}<div><SearchIcon onClick={inputOn} color="action"/></div></div></div>}

      <div id="mapcontainer">
        <MapContainer center={[coords.lat,coords.lng]} zoom={15} scrollWheelZoom={false} zoomControl={false} >
        <ZoomControl position="bottomleft" />


          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {zoomLevel > 13 ?
          <FeatureGroup pathOptions={{ color: 'purple' }}>
            <Rectangle stroke={true} bounds={rectangle} />
          </FeatureGroup> :
          <Marker  icon={DefaultIcon} position={[coords.lat,coords.lng]}/> }
          
          <RecenterAutomatically lat={coords.lat} lng={coords.lng} setCoords={setCoords} setZoomLevel={setZoomLevel} setInputState={setInputState}/>
        </MapContainer>
      </div>
    </div>
  );
}

export default App;