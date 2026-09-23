<div className="map-container">
        <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={userLocation}
            zoom={14}
            onLoad={onLoad}
            options={{
            disableDefaultUI: true, // Clean mobile interface
            zoomControl: true,      // Keep essential zoom buttons
            }}
        >
            {/* User Location Marker (Blue Circle) */}
            <MarkerF
            position={userLocation}
            title="Your Location"
            icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#4285F4",
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: "#FFFFFF",
            }}
            />

            {/* Garage Markers */}
            {garages.map((garage) => {
            const isSelected = garage.id === selectedGarageId;
            return (
                <MarkerF
                key={garage.id}
                position={{ lat: garage.lat, lng: garage.lng }}
                title={garage.name}
                onClick={() => handleSelectGarage(garage)}
                // Apply the custom icon and scaledSize
                icon={{
                    // Replace 'logo.png' with your actual logo filename
                    url: "/auto.png", 
                    // scaledSize ensures the image fits correctly on the map
                    scaledSize: new window.google.maps.Size(40, 40), 
                }}
                />
            );
            })}
            </GoogleMap>
        </div>