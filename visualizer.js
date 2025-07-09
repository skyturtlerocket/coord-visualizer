let map;
let currentLayer;

// Initialize the map
function initMap() {
    map = L.map('map').setView([40.8797, -122.5413], 13);
    
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }).addTo(map);
}

// Show message to user
function showMessage(text, type = 'info') {
    const messageDiv = document.getElementById('message');
    messageDiv.innerHTML = `<div class="${type}">${text}</div>`;
    setTimeout(() => {
        messageDiv.innerHTML = '';
    }, 5000);
}

// Detect coordinate format (longitude/latitude vs latitude/longitude)
function detectCoordinateFormat(coords) {
    // Sample a few points to determine format
    const sampleSize = Math.min(10, coords.length);
    let lonLatCount = 0;
    let latLonCount = 0;
    
    for (let i = 0; i < sampleSize; i++) {
        const [first, second] = coords[i];
        
        // Check if first value is longitude (-180 to 180) and second is latitude (-90 to 90)
        if (first >= -180 && first <= 180 && second >= -90 && second <= 90) {
            if (Math.abs(first) > Math.abs(second)) {
                lonLatCount++;
            } else {
                latLonCount++;
            }
        }
    }
    
    return lonLatCount > latLonCount ? 'lon-lat' : 'lat-lon';
}

        // Plot coordinates on the map
        function plotCoordinates() {
    const input = document.getElementById('coordinateInput').value.trim();
    
    if (!input) {
        showMessage('Please enter coordinate data.', 'error');
        return;
    }
    
    try {
        const coordinates = JSON.parse(input);
        
        if (!Array.isArray(coordinates) || coordinates.length === 0) {
            showMessage('Invalid format. Please enter an array of coordinates.', 'error');
            return;
        }
        
        // Validate coordinate format
        for (let i = 0; i < coordinates.length; i++) {
            if (!Array.isArray(coordinates[i]) || coordinates[i].length !== 2) {
                showMessage(`Invalid coordinate at index ${i}. Each coordinate must be an array of [x, y].`, 'error');
                return;
            }
        }
        
        // Clear existing layer
        if (currentLayer) {
            map.removeLayer(currentLayer);
        }
        
        // Detect format
        const format = detectCoordinateFormat(coordinates);
        
        // Create polyline points
        const polylinePoints = [];
        let bounds = [];
        let validPointCount = 0;
        
        coordinates.forEach((coord, index) => {
            let lat, lon;
            
            if (format === 'lon-lat') {
                [lon, lat] = coord;
            } else {
                [lat, lon] = coord;
            }
            
            // Validate coordinates
            if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
                console.warn(`Invalid coordinate at index ${index}: [${lat}, ${lon}]`);
                return;
            }
            
            polylinePoints.push([lat, lon]);
            bounds.push([lat, lon]);
            validPointCount++;
        });
        
        if (validPointCount === 0) {
            showMessage('No valid coordinates found.', 'error');
            return;
        }
        
        // Create polyline connecting the points
        const polyline = L.polyline(polylinePoints, {
            color: '#00ff00',
            weight: 2,
            opacity: 0.8
        });
        
        // Add only the polyline to map
        currentLayer = polyline.addTo(map);
        
        // Fit map to bounds
        if (bounds.length > 1) {
            map.fitBounds(bounds, { padding: [10, 10] });
        } else if (bounds.length === 1) {
            map.setView(bounds[0], 15);
        }
        
        // Show statistics
        document.getElementById('pointCount').textContent = validPointCount;
        document.getElementById('coordFormat').textContent = format === 'lon-lat' ? 'Lon, Lat' : 'Lat, Lon';
        document.getElementById('infoPanel').style.display = 'block';
        
        showMessage(`Successfully plotted path with ${validPointCount} points!`, 'success');
        
    } catch (error) {
        showMessage(`Error parsing JSON: ${error.message}`, 'error');
    }
}
// Load example data
function loadExample() {
    const exampleData = [
        [-122.541347576002, 40.8797068810007],
        [-122.541319702002, 40.8797905080007],
        [-122.541320089002, 40.8797907340007],
        [-122.541320000002, 40.8797910000008],
        [-122.541346723002, 40.8798062700008],
        [-122.541361851002, 40.8798149140008],
        [-122.541362000002, 40.8798150000007],
        [-122.541373978002, 40.8798154920007],
        [-122.541435001002, 40.8798180000007],
        [-122.541529000002, 40.8798180000007]
    ];
    
    document.getElementById('coordinateInput').value = JSON.stringify(exampleData, null, 2);
    showMessage('Example data loaded! Click "Plot Coordinates" to visualize.', 'success');
}

// Clear the map
function clearMap() {
    if (currentLayer) {
        map.removeLayer(currentLayer);
        currentLayer = null;
    }
    document.getElementById('coordinateInput').value = '';
    document.getElementById('infoPanel').style.display = 'none';
    showMessage('Map cleared!', 'success');
}

// Initialize map when page loads
window.onload = function() {
    initMap();
};