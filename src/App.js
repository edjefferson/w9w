import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import RecenterAutomatically from './recenterAutomatically';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ShareIcon from '@mui/icons-material/Share';
import MyLocationIcon from '@mui/icons-material/MyLocation';


import {
  EmailShareButton,
  FacebookShareButton,
  LinkedinShareButton,
  TwitterShareButton,
} from "react-share";

import {
  EmailIcon,
  FacebookIcon,
  LinkedinIcon,
  TwitterIcon,
} from "react-share";

import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Polyline, Rectangle, FeatureGroup, ZoomControl} from 'react-leaflet'
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





const App = () => {

  let defaultLoc = {lat: 51.50315489517607, lng: -0.22844554064247316}

  const searchParams = new URLSearchParams(document.location.search)
  const [query,setQuery] =  useState(searchParams.get("whos"))

  const [options, setOptions] = useState([]);
  const [inputValue, setInputValue] = useState([]);
  const [coords,setCoords] = useState(0)
  const [preciseLocation,setPreciseLocation] = useState(0)
  const [zoomLevel,setZoomLevel] = useState(15)
  const [mapCentre,setMapCentre] = useState(0)
  const [grids,setGrids] = useState(1)

  const [value,setValue] = useState([])
  const [aboutBox,setAboutBox] = useState(0)
  const [share,setShare] = useState(0)

  const [copyState,setCopyState] = useState(0)
  const [copyURLState,setCopyURLState] = useState(0)

  const [inputState,setInputState] = useState(0)
  const intervalRef = useRef();

  const copyRef = useRef();
  const copyURLRef = useRef();

  const inputRef = useRef();

  const [rectangle,setRectangle] = useState([])
  const [hlines,setHlines] = useState([])
  const [vlines,setVlines] = useState([])


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

  const latSize = 180.0/(Math.pow(wholist.length,4))
  const lngSize = 360.0/(Math.pow(wholist.length,4))


  const convertPreciseToNearest = (coords) => {
    let pcoords = {lat: Math.floor(4*((coords.lat+180/2)/latSize))*latSize/4-180/2,
    lng: Math.floor(4*((coords.lng+360/2)/lngSize))*lngSize/4-360/2 }

    return pcoords
     
  }


  useEffect(() => {
    if (preciseLocation) {
      let newCoords = convertPreciseToNearest(preciseLocation)
      setCoords(newCoords)
    }

  },[preciseLocation])

  
  const checkQueryParams = () => {
    
    if (query && query.length > 0 && query.includes(".")) {
      let whos = query.trim().split(".").map(w => w.toLowerCase())
      let downcased_whos = wholist.map(w => w.toLowerCase())
      let who_check = true
      whos.forEach(w => {if(downcased_whos.indexOf(w) < 0) who_check = false })
      if (whos.length === 9 && who_check) {
        let [lat,lng] = decode_whos(whos,downcased_whos)

        return {lat: lat, lng: lng}
        
      } else {
        return defaultLoc
      }
    } else {

      return defaultLoc
      

    }
  }

  useEffect(() => {

    ReactGA.send("pageview");

    let newcoords = checkQueryParams()
    setCoords(c => newcoords)
    setMapCentre(newcoords)
    
  }, []);
  

  const convert = (x_or_y,mode,accuracy,how_many_whos) => {


    let max = mode === "lat" ? 180 : 360

    let last_square = parseFloat(how_many_whos) * (max/2 +x_or_y)/max



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
    x = x >= 4 ? 0 : x
    y = y >= 4 ? 0 : y
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
 

  const getEncodedWhos = (lat,lng,accuracy) => {
    
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
      x +=  f/parseFloat(how_many_whos** (i+1)) * max
    })
    return x
  }


  const decode_whos = (whos,wholist) => {
    let xs = []
    let ys = []
    let who_nums = whos.map(w => wholist.indexOf(w))
    
    let unrotated_whos = unrotateNumbers(who_nums)
    
    let last_who = unrotated_whos.pop()

    unrotated_whos.forEach((w,i) =>  i % 2 !== 0 ? ys.push(w) : xs.push(w))

    let final_grid_pos = reverse_final_grid(last_who)

    let lat = deconvert(ys,"lat",wholist.length) + final_grid_pos[1] * latSize/4
    let lng = deconvert(xs,"lng",wholist.length) + final_grid_pos[0] * lngSize/4
    return [lat,lng]
  }

  useEffect(() => {
    if (coords) {
      let encodedWhos = getEncodedWhos(coords.lat + latSize/8,coords.lng+ lngSize/8,4)


      setValue(encodedWhos)
      const url = new URL(window.location.href);
      url.searchParams.set("whos", encodedWhos.join("."));
      setQuery(encodedWhos.join("."))
      window.history.pushState(null, '', url);

      setRectangle([
        [coords.lat+latSize/4,coords.lng+lngSize/4],
        [coords.lat,coords.lng],
      ])
    }

  },[coords])

  useEffect(()=> {

    let gridSize = 60
    if (mapCentre) {
      let centreCoords = {lat: Math.floor(4*((mapCentre.lat+180/2)/latSize))*latSize/4-180/2,
      lng: Math.floor(4*((mapCentre.lng+360/2)/lngSize))*lngSize/4-360/2 }

      setHlines([...Array(gridSize).keys()].map(x => [
        [centreCoords.lat+ latSize/4 * (x-gridSize/2.0), centreCoords.lng-1], [centreCoords.lat + latSize/4 * (x-gridSize/2.0), centreCoords.lng+1]
      ]))
      setVlines([...Array(gridSize).keys()].map(x => [
        [centreCoords.lat-1, centreCoords.lng + lngSize/4 * (x-gridSize/2.0)], [centreCoords.lat + 1, centreCoords.lng+ lngSize/4 * (x-gridSize/2.0)]
      ]))
    }
  },[mapCentre,zoomLevel])








  const onInputChange = (e) => {
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

        setOptions([{label: inputValue, key: 1, lat: lat + latSize/8, lng: lng + lngSize/8}])
        
      } else {
        console.log("error")
      }
    } else {
      setOptions([])
      intervalRef.current = setTimeout(() => {
        fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(inputValue)}&format=json`,
        {method: "GET"})
          .then((response) => response.json())
          .then((data) => {
            let newOptions = data.map((d)=> { 
       

              return {label: d.display_name, key: d.place_id, lat: parseFloat(d.lat), lng: parseFloat(d.lon), id: d.place_id}})
            setOptions(newOptions)
          }
          )},500)
        }

  
    
    
  },[inputValue])



  const formatw9w = (value) => {
    
    return <ul className="wholist">{value.map((w,i) => <li key={i} className="wholistwho">{i === value.length -1 ? w :  w + "."}</li>)}</ul>
  }

  const copyContent = () => {
    navigator.clipboard.writeText("/////////" + value.join("."))
    setCopyState(1)
  }

  const copyURLContent = () => {
    navigator.clipboard.writeText("https://edjefferson.com/w9w?whos=" + value.join("."))
    setCopyURLState(1)
  }

  const inputOn = () => {
    setInputValue("")
    setInputState(1)
    setShare(0)
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

  useEffect(() => {
    if (copyURLState) {
      copyURLRef.current = setTimeout(() => setCopyURLState(0), 500);
    }
    return () => {
      
      clearTimeout(copyURLRef.current);
    }
  }, [copyURLState])


  const geoLocate = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setPreciseLocation({lat: position.coords.latitude, lng: position.coords.longitude});
        
      });
    } else {
      console.log("no geolocation")
    }

  }
  return (
    <div className="App">
      <div id="title"><h1><span id="slashes">{"/////////"}</span>what9whos</h1> <InfoOutlinedIcon onClick={()=> setAboutBox(1)} style={{color: "white"}} /></div>
      {aboutBox ? <div id="aboutbox">
        <div id="abtitle"><h2><span id="slashes">{"/////////"}</span>what9whos - about</h2> <CloseIcon onClick={()=> setAboutBox(0)} style={{color: "white"}} /></div>
        <div id="about-content">
          <h3>The most Doctor Who-based way to talk about location</h3>
          <p>Have you ever wished that you could describe the precise location of anywhere in the world by simply listing the names of 9 actors who have played TV's (and film's) Doctor Who?</p>
          <p>We had, for some reason, so that's why we created what9whos.</p>
          <p>what9whos includes all 14 'main' Doctor Whos from Hartnell to Gatwa, plus John Hurt, Jo Martin and Peter Cushing. If you do not accept this as canon you are welcome to build your own Doctor Who-based geolocation system.</p>
          <h4>Disclaimer</h4>
          <p>We would not recommend using what9whos in any kind of emergency situation (or at all).</p>
          <p>Doctor Who is the property of the BBC who have absolutely nothing to do with what9whos, so please don't blame them.</p>
          <p>As far as we know this only works on planet Earth.</p>
          <p>We promise not to send you a legal threat if you attempt to reverse engineer any of our stupid algorithms.</p>
          <p><a id="sitelink" href="https://edjefferson.com">edjefferson.com</a> / <a id="sitelink" href="https://twitter.com/edjeff">@edjeff</a></p>
          </div>
        
        </div> : ""}


      {inputState ? <><div id="input-box" className="search-box">
      <div id="backicon"><ArrowBackIosIcon onClick={() => {setInputState(0)
      setShare(0)}
      } color="action"/>   </div>
     
        <input ref={inputRef} onChange={onInputChange} placeholder="Search"></input>
        <div id="closeicon"><CloseIcon onClick={() => {setInputState(0)
      setShare(0)}} color="action"/>   </div>
      </div>
      
      {options.length > 0 ? 
      <div id="infobox">
        {options.map((o,i)=> <div className="searchoption" key={i} onClick={() => {

          setPreciseLocation({lat: o.lat, lng: o.lng})
          setInputState(0)
          setShare(0)
}}>{o.label}</div>)}
        </div>
        :
      <div id="infobox">

        <p>Search for any place or what9whos address</p>
      <p>e.g. Ianto Jones Shrine</p>
      <ul className="wholist"><li>{"/////////"} Smith.</li><li>Cushing.</li><li>Tennant.</li><li>Capaldi.</li><li>CBaker.</li><li>Tennant.</li><li>Gatwa.</li><li>Capaldi.</li><li>Smith</li></ul></div>
}
      </>:
      <><div id="search-box-new" className="search-box"><div id="w9waddress" onClick={inputOn}><span id="slashessb">{"/////////"}</span><span id="whoscontainer">{formatw9w(value)}</span></div><div id="buttons">{copyState ? <span>Copied</span> : <div><ContentCopyIcon color="action" onClick={copyContent} /></div>}<div><SearchIcon onClick={inputOn} color="action"/></div></div></div>
      <div id="sharebox">
        <div id="sharebutton" onClick={() => setShare(share => share ? 0 : 1)}>
      <ShareIcon style={{color: "white", paddingRight: "0.5em", fontSize: "1.2em"}} />
        <span>SHARE</span>
        </div>
       
        {share ? <> <div id="sharebumf">
          <div id="shareurl">https://edjefferson.com/w9w/?whos={value.join(".")}</div>{copyURLState ? <span>Copied</span> : <ContentCopyIcon style={{color: "white"}} onClick={copyURLContent} />}</div>
          <div id="socialsharebuttons">
            <TwitterShareButton title={`Meet me at /////////${value.join(".")}`} url={`https://edjefferson.com/w9w/?whos=${value.join(".")}`}>
            <TwitterIcon size={32} round={true} />
              </TwitterShareButton>
              <FacebookShareButton quote={`Meet me at /////////${value.join(".")}`} url={`https://edjefferson.com/w9w/?whos=${value.join(".")}`}>
            <FacebookIcon size={32} round={true} />
              </FacebookShareButton>
              <LinkedinShareButton title={`Meet me at /////////${value.join(".")}`} url={`https://edjefferson.com/w9w/?whos=${value.join(".")}`}>
            <LinkedinIcon size={32} round={true} />
              </LinkedinShareButton>

              <EmailShareButton body={`Meet me at /////////${value.join(".")}`} url={`https://edjefferson.com/w9w/?whos=${value.join(".")}`}>
            <EmailIcon size={32} round={true} />
              </EmailShareButton>
            </div></>
          
          : ""}
        
      </div>
      
      </>}

      {coords && mapCentre && hlines.length && vlines.length ? 
      <div id="mapcontainer">
        <MapContainer center={[coords.lat+ latSize/4,coords.lng+lngSize/8]} zoom={16} scrollWheelZoom={false} zoomControl={false} >

        <ZoomControl position="bottomleft" />


          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {zoomLevel > 14 ?
          <>
          <FeatureGroup pathOptions={{ color: 'purple' }}>
            {rectangle[0] ? <Rectangle stroke={true} bounds={rectangle} /> : ""}
          </FeatureGroup> 
          
          <FeatureGroup pathOptions={{ color: 'grey' }}>
            {grids ? 
          <>{hlines.length ? hlines.map((l,i) => <Polyline weight={0.7} opacity={0.5} positions={l} key={i} />) : ""}
            {vlines.length ? vlines.map((l,i) => <Polyline weight={0.7} opacity={0.5} positions={l} key={i} />) : ""}</> 
            : ""}
          </FeatureGroup>
          </>:
          <Marker  icon={DefaultIcon} position={[coords.lat,coords.lng]}/> }
          <RecenterAutomatically lat={coords.lat} lng={coords.lng} setPreciseLocation={setPreciseLocation} setZoomLevel={setZoomLevel} setInputState={setInputState} setShare={setShare} setMapCentre={setMapCentre} lngSize={lngSize} latSize={latSize} setGrids={setGrids}/>
        </MapContainer>
      </div> :""}
      <div id="geolocatebutton" onClick={geoLocate}><MyLocationIcon style={{color: "black"}}/></div>
    </div>
  );
}

export default App;
