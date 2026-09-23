import React, { useState, useEffect, useCallback } from "react";
import { useJsApiLoader, GoogleMap, MarkerF } from "@react-google-maps/api";
import auto from "../assets/auto.png";
import locator from "../assets/locator.jpg";
import red from "../assets/redLocator.png";
import black from "../assets/blackLocator.png";
import logo from "../assets/autoRescue.png";
import loc from "../assets/locator.png"
import phone from "../assets/phone.png"

import { BarLoader } from "react-spinners";

const libraries = ["places"];

const defaultLocation = {
  lat: 51.9956,
  lng: 4.2089,
};

// Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return (R * c).toFixed(2);
}

export default function Map() {
  const [userLocation, setUserLocation] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [garages, setGarages] = useState([]);
  const [selectedGarageId, setSelectedGarageId] = useState(null);
  const [panelHeight, setPanelHeight] = useState(48);
  const [isDragging, setIsDragging] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
    version: "weekly",
  });

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => setUserLocation(defaultLocation),
      );
    } else {
      setUserLocation(defaultLocation);
    }
  }, []);

  const onLoad = useCallback((map) => {
    setMapInstance(map);
  }, []);

  // Search nearby garages
  const handleSearchGarages = async () => {
    if (!mapInstance || !userLocation) return;

    try {
      const { Place } = await window.google.maps.importLibrary("places");

      const request = {
        fields: [
          "id",
          "displayName",
          "location",
          "formattedAddress",
          "nationalPhoneNumber",
          "photos",
        ],

        locationRestriction: {
          center: userLocation,
          radius: 10000,
        },

        includedPrimaryTypes: ["car_repair"],

        maxResultCount: 20,
      };

      const { places } = await Place.searchNearby(request);
      console.log(places);

      if (places && places.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();

        bounds.extend(userLocation);

        const formattedGarages = places.map((place) => {
          const garageLat = place.location.lat();
          const garageLng = place.location.lng();

          bounds.extend(place.location);

          const photo = place.photos?.[0];

          return {
            id: place.id,
            name: place.displayName || "Auto Garage",
            address: place.formattedAddress || "Address unavailable",
            phone: place.nationalPhoneNumber || null,

            lat: garageLat,
            lng: garageLng,

            distance: calculateDistance(
              userLocation.lat,
              userLocation.lng,
              garageLat,
              garageLng,
            ),

            image: photo
              ? photo.getURI({
                  maxWidth: 300,
                  maxHeight: 300,
                })
              : null,
          };
        });

        // Sort nearest first
        formattedGarages.sort(
          (a, b) => Number(a.distance) - Number(b.distance),
        );

        setGarages(formattedGarages);

        mapInstance.fitBounds(bounds);
      } else {
        alert("No nearby garages found.");
      }
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  // Select garage
  const handleSelectGarage = (garage) => {
    setSelectedGarageId(garage.id);

    if (mapInstance) {
      mapInstance.panTo({
        lat: garage.lat,
        lng: garage.lng,
      });

      mapInstance.setZoom(16);
    }
  };

  // Zoom controls
  const handleZoomIn = () => {
    if (mapInstance) {
      mapInstance.setZoom(mapInstance.getZoom() + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapInstance) {
      mapInstance.setZoom(mapInstance.getZoom() - 1);
    }
  };

  // Go back to user's location
  const handleMyLocation = () => {
    if (mapInstance && userLocation) {
      mapInstance.panTo(userLocation);
      mapInstance.setZoom(14);
    }
  };

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center">
        Error loading Google Maps
      </div>
    );
  }

  if (!isLoaded || !userLocation) {
    return (
      <div className="flex h-full items-center justify-center align-center border-1 h-screen">
        <BarLoader color="#000000" />
      </div>
    );
  }

  const handleDragStart = (e) => {
    setIsDragging(true);

    const startY = e.clientY;
    const startHeight = panelHeight;

    const handleMove = (event) => {
      const deltaY = startY - event.clientY;

      const newHeight = startHeight + (deltaY / window.innerHeight) * 100;

      // Keep panel between 15% and 85%
      const clampedHeight = Math.min(Math.max(newHeight, 15), 85);

      setPanelHeight(clampedHeight);
    };

    const handleEnd = () => {
      setIsDragging(false);

      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleEnd);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleEnd);
  };

  return (
    <div className="relative h-[calc(100vh-64px)] w-full overflow-hidden bg-white">
      {/* =====================================================
          MAP
      ====================================================== */}

      <div className="absolute left-0 right-0 top-2 bottom-0">
        <GoogleMap
          mapContainerStyle={{
            width: "100%",
            height: "100%",
          }}
          center={userLocation}
          zoom={14}
          onLoad={onLoad}
          options={{
            disableDefaultUI: true,
            clickableIcons: false,
            gestureHandling: "greedy",
          }}
        >
          {/* User location */}
          <MarkerF
            position={userLocation}
            title="Your Location"
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#1677FF",
              fillOpacity: 1,
              strokeWeight: 3,
              strokeColor: "#ffffff",
            }}
          />

          {/* Garage markers */}
          {garages.map((garage) => {
            const isSelected = garage.id === selectedGarageId;

            return (
              <MarkerF
                key={garage.id}
                position={{
                  lat: garage.lat,
                  lng: garage.lng,
                }}
                title={garage.name}
                onClick={() => handleSelectGarage(garage)}
                icon={{
                  url: isSelected ? black : red,
                  scaledSize: new window.google.maps.Size(
                    isSelected ? 48 : 40,
                    isSelected ? 48 : 40,
                  ),
                }}
              />
            );
          })}
        </GoogleMap>

        {/* =================================================
            CUSTOM MAP CONTROLS
        ================================================== */}

        <div className="absolute left-5 top-5 z-20 flex flex-col overflow-hidden rounded-xl bg-white shadow-lg">
          <button
            onClick={handleZoomIn}
            className="flex h-11 w-11 items-center justify-center
                       border-b border-gray-200 text-2xl font-light
                       text-gray-600 hover:bg-gray-50"
          >
            +
          </button>

          <button
            onClick={handleZoomOut}
            className="flex h-11 w-11 items-center justify-center
                       text-2xl font-light text-gray-600
                       hover:bg-gray-50"
          >
            −
          </button>
        </div>

        {/* My location button */}

        <button
          onClick={handleMyLocation}
          className="absolute right-5 top-5 z-20 flex h-12 w-12
                     items-center justify-center rounded-full
                     bg-white text-gray-600 shadow-lg
                     transition hover:bg-gray-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-6 w-6"
          >
            <circle cx="12" cy="12" r="3" />
            <circle cx="12" cy="12" r="8" />
            <path d="M12 2v3" />
            <path d="M12 19v3" />
            <path d="M2 12h3" />
            <path d="M19 12h3" />
          </svg>
        </button>
      </div>

      {/* =====================================================
          GARAGE BOTTOM PANEL
      ====================================================== */}

      <div
        className={`
            absolute
            bottom-0
            left-0
            right-0
            z-20
            rounded-t-[30px]
            bg-white
            shadow-[0_-5px_25px_rgba(0,0,0,0.12)]
            ${isDragging ? "" : "transition-[height] duration-200"}
        `}
        style={{
          height: `${panelHeight}%`,
        }}
      >
        {/* Small drag indicator */}
        <div
          onPointerDown={handleDragStart}
          className="flex cursor-grab justify-center pt-3 touch-none active:cursor-grabbing"
        >
          <div className="h-1.5 w-12 rounded-full bg-gray-300" />
        </div>

        {/* Panel heading */}
        <div className="flex items-center justify-between px-5 pb-3 pt-2">
          <div className=" =text-center">
            <div className="text-xl font-semibold text-green-700">999</div>
            <div className="text-xs font-semibold text-gray-500">
              National Emergency Number
            </div>
          </div>
          {/* Search button */}
          <div className="gap-5 flex pr-5">
            <button
              onClick={handleSearchGarages}
              className="
                    rounded-xl
                    bg-gray-900
                    border-2
                    border-red-700
                    px-4
                    py-2
                    text-sm
                    font-medium
                    text-white
                    shadow-sm
                    transition
                    hover:bg-gray-700
                    active:scale-95
                    "
            >
              Search Garage
            </button>
          </div>
        </div>

        {/* =================================================
            GARAGE LIST
        ================================================== */}

        <div
          className="overflow-y-auto px-4 pb-5"
          style={{
            height: "calc(100% - 95px)",
          }}
        >
          {garages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-3 flex items-center justify-center rounded-2xl">
                <img
                  src={logo}
                  alt="Auto garage"
                  className=" object-contain h-10"
                />
              </div>

              <p className="text-sm font-medium text-gray-600">
                No garages loaded
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Tap Search to find nearby garages
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {garages.map((garage) => {
                const isSelected = garage.id === selectedGarageId;

                const directionsUrl =
                  `https://www.google.com/maps/dir/?api=1` +
                  `&origin=${userLocation.lat},${userLocation.lng}` +
                  `&destination=${garage.lat},${garage.lng}` +
                  `&destination_place_id=${garage.id}`;

                return (
                  <div
                    key={garage.id}
                    onClick={() => handleSelectGarage(garage)}
                    className={`
                      cursor-pointer
                      rounded-2xl
                      border
                      bg-white
                      p-3
                      shadow-[0_2px_10px_rgba(0,0,0,0.08)]
                      transition

                      ${
                        isSelected
                          ? "border-red-700 ring-2 ring-red-200"
                          : "border-gray-100"
                      }
                    `}
                  >
                    {/* Garage information */}

                    <div className="flex gap-3">
                      {/* Garage image */}

                      <div
                        className="
                          flex
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                        "
                      >
                        <img
                          src={garage.image || logo}
                          alt={garage.name}
                          className="h-10 w-20"
                        />
                      </div>

                      {/* Details */}

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-[18px] font-medium text-slate-800">
                          {garage.name}
                        </h3>

                        <p className="text-sm font-medium text-slate-700 mt-1">
                          {garage.distance} km
                        </p>

                        <div className="flex gap-2 mt-1">
                            <img src={loc} className="h-3 mt-1 opacity-70"/>
                             <p className="truncate text-sm text-slate-700">
                               {garage.address}
                            </p>
                        </div>

                        {garage.phone && (
                          <div className="flex gap-2 mt-1">
                            <img src={phone} className="h-3 mt-1 opacity-70" />
                            <a
                              href={`tel:${garage.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="block truncate text-sm text-green-700 font-bold"
                            >
                              {garage.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Directions */}

                    <a
                      href={directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="
                        mt-3
                        flex
                        h-10
                        w-full
                        items-center
                        justify-center
                        rounded-full
                        bg-gray-900
                        border-2
                        border-red-700
                        text-sm
                        font-medium
                        text-white
                        shadow-sm
                        transition

                        hover:bg-gray-700
                        active:scale-[0.98]
                      "
                    >
                      Get Directions
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
