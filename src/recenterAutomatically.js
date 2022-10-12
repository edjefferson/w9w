import { useEffect } from 'react';
import { useMap, useMapEvents} from 'react-leaflet'

const RecenterAutomatically = ({lat,lng,setPreciseLocation,setZoomLevel,setInputState,setShare,setMapCentre,lngSize,latSize}) => {
  const map = useMap();

  useEffect(() => {
    let bounds = map.getBounds();
    console.log(bounds)
    if (lat < bounds._southWest.lat + latSize/4 || lat > bounds._northEast.lat - latSize * 1.6 || lng < bounds._southWest.lng + lngSize/4 || lng > bounds._northEast.lng - lngSize * 3/4) {
      map.setView([lat + latSize/8, lng+lngSize/8])
    }
  }, [lat, lng]);

   


  const mapEvents = useMapEvents({
    click(e) {                
      setPreciseLocation({lat: e.latlng.lat, lng: e.latlng.lng})  
      setInputState(0)  
      setShare(0)         
    },
    zoomend: () => {
      setZoomLevel(mapEvents.getZoom());
    },
    move: (e)  => {
      setMapCentre(map.getCenter())
    }        
  })
  return null;
 }

 export default RecenterAutomatically;
