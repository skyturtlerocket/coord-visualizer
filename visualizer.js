let map;
let layers = [];
let layerCounter = 0;

// Color palette for different layers
const colors = [
    '#00ff00', '#ff0000', '#0000ff', '#ffff00', '#ff00ff', 
    '#00ffff', '#ff8000', '#8000ff', '#ff0080', '#80ff00',
    '#0080ff', '#ff8080', '#80ff80', '#8080ff', '#ffff80'
];

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

// Remove a specific layer
function removeLayer(layerId) {
    const layerIndex = layers.findIndex(layer => layer.id === layerId);
    if (layerIndex !== -1) {
        map.removeLayer(layers[layerIndex].layer);
        layers.splice(layerIndex, 1);
        updateStatistics();
        showMessage(`Layer ${layerId} removed!`, 'success');
    }
}

// Update statistics panel
function updateStatistics() {
    const totalPoints = layers.reduce((sum, layer) => sum + layer.pointCount, 0);
    document.getElementById('layerCount').textContent = layers.length;
    document.getElementById('totalPoints').textContent = totalPoints;
    
    const layersList = document.getElementById('layersList');
    layersList.innerHTML = '<h4>Active Layers:</h4>';
    
    if (layers.length === 0) {
        document.getElementById('infoPanel').style.display = 'none';
        return;
    }
    
    layers.forEach(layer => {
        const layerDiv = document.createElement('div');
        layerDiv.className = 'layer-item';
        layerDiv.innerHTML = `
            <div class="layer-info">
                <div class="color-indicator" style="background-color: ${layer.color}"></div>
                <span>Layer ${layer.id} (${layer.pointCount} points)</span>
            </div>
            <button class="remove-layer-btn" onclick="removeLayer(${layer.id})">Remove</button>
        `;
        layersList.appendChild(layerDiv);
    });
    
    document.getElementById('infoPanel').style.display = 'block';
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
        
        // Get color for this layer
        const color = colors[layerCounter % colors.length];
        layerCounter++;
        
        // Create polyline connecting the points
        const polyline = L.polyline(polylinePoints, {
            color: color,
            weight: 3,
            opacity: 0.8
        });
        
        // Add polyline to map
        polyline.addTo(map);
        
        // Store layer information
        layers.push({
            id: layerCounter,
            layer: polyline,
            color: color,
            pointCount: validPointCount,
            format: format
        });
        
        // Fit map to include all layers
        const allBounds = [];
        layers.forEach(layer => {
            layer.layer.getLatLngs().forEach(latlng => {
                allBounds.push([latlng.lat, latlng.lng]);
            });
        });
        
        if (allBounds.length > 1) {
            map.fitBounds(allBounds, { padding: [10, 10] });
        } else if (allBounds.length === 1) {
            map.setView(allBounds[0], 15);
        }
        
        // Update statistics
        updateStatistics();
        
        showMessage(`Successfully plotted Layer ${layerCounter} with ${validPointCount} points in ${color}!`, 'success');
        
        // Clear input for next layer
        document.getElementById('coordinateInput').value = '';
        
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

// Clear all layers from the map
function clearMap() {
    layers.forEach(layer => {
        map.removeLayer(layer.layer);
    });
    layers = [];
    layerCounter = 0;
    document.getElementById('coordinateInput').value = '';
    document.getElementById('infoPanel').style.display = 'none';
    showMessage('All layers cleared!', 'success');
}

// Initialize map when page loads
window.onload = function() {
    initMap();
};