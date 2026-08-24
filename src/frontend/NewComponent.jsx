import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

function NewComponent(props) {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [location, setLocation] = useState(null);
  const [focusedPlace, setFocusedPlace] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  const componentLoadedRef = useRef(false);

  const searchDataKey = JSON.stringify(props?.searchData ?? {});

  const signalComponentLoaded = () => {
    if (componentLoadedRef.current) return;

    componentLoadedRef.current = true;

    props?.messageHandlers?.componentLoaded?.();

    console.log(
      "Tourism Explorer: componentLoaded() signalled"
    );
  };

  /*
   * Browser location fallback.
   *
   * Used when HyperDart does not provide resolved
   * LOCATION data, e.g. "historical places near me".
   */
  const getUserLocation = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(
          new Error(
            "Your browser does not support location access."
          )
        );
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (err) => {
          console.error(
            "Browser geolocation error:",
            err
          );

          reject(
            new Error(
              "Location access is required for 'near me' searches."
            )
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        }
      );
    });

  useEffect(() => {
    let cancelled = false;

    const loadTourismPlaces = async () => {
      try {
        setLoading(true);
        setError("");

        let searchData = props?.searchData;

        console.log(
          "Tourism Explorer searchData:",
          searchData
        );

        /*
         * HyperDart may initially mount the component
         * with empty searchData.
         */
        if (typeof searchData === "string") {
          try {
            searchData = JSON.parse(searchData);
          } catch {
            searchData = {};
          }
        }

        const hasSearchData =
          searchData &&
          Object.keys(searchData).length > 0;

        let latitude;
        let longitude;
        let city;
        let usingUserLocation = false;

        /*
         * ========================================================
         * CASE 1:
         * HyperDart resolved a LOCATION entity.
         * ========================================================
         */

        if (hasSearchData) {
          console.log(
            "Tourism Explorer parsed searchData:",
            searchData
          );

          const locationEntity =
            searchData?.entities?.find(
              (entity) =>
                entity?.entityType === "LOCATION" ||
                entity?.collectionType ===
                  "HD_LOCATION" ||
                entity?.entityInfo?.geo
            );

          const geo =
            locationEntity?.entityInfo?.geo;

          if (geo) {
            latitude = Number(geo.lat);
            longitude = Number(geo.long);

            city =
              geo.city ||
              locationEntity?.word ||
              "Requested city";
          }
        }

        /*
         * ========================================================
         * CASE 2:
         * HyperDart has no LOCATION.
         *
         * Use browser geolocation as fallback.
         *
         * This is particularly useful for:
         *
         * "historical places near me"
         * ========================================================
         */

        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude)
        ) {
          console.log(
            "No resolved HyperDart location. Trying browser geolocation..."
          );

          const userLocation =
            await getUserLocation();

          latitude =
            userLocation.latitude;

          longitude =
            userLocation.longitude;

          city = "your location";

          usingUserLocation = true;
        }

        if (cancelled) return;

        console.log(
          "RESOLVED LOCATION:",
          city
        );

        console.log(
          "LATITUDE:",
          latitude
        );

        console.log(
          "LONGITUDE:",
          longitude
        );

        console.log(
          "USING USER LOCATION:",
          usingUserLocation
        );

        setLocation({
          city,
          latitude,
          longitude,
          usingUserLocation,
        });

        /*
         * HyperDart only needs to know that the component
         * initialized successfully.
         *
         * Do NOT wait for Geoapify.
         */
        signalComponentLoaded();

        /*
         * ========================================================
         * GEOAPIFY
         * ========================================================
         */

        const apiKey =
          import.meta.env.VITE_GEO_API_KEY ||
          import.meta.env.GEO_API_KEY;

        if (!apiKey) {
          throw new Error(
            "Geoapify API key is missing."
          );
        }

        const url =
          "https://api.geoapify.com/v2/places" +
          "?categories=tourism.sights" +
          `&filter=circle:${longitude},${latitude},5000` +
          "&limit=20" +
          `&apiKey=${encodeURIComponent(apiKey)}`;

        console.log(
          "GEOAPIFY REQUEST:",
          url
        );

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(
            `Geoapify request failed (${response.status}).`
          );
        }

        const data = await response.json();

        console.log(
          "GEOAPIFY RESPONSE:",
          data
        );

        console.log(
          "FEATURE COUNT:",
          Array.isArray(data?.features)
            ? data.features.length
            : "NO FEATURES"
        );

        const features = Array.isArray(
          data?.features
        )
          ? data.features
          : [];

        /*
         * ========================================================
         * NORMALIZE RESULTS
         * ========================================================
         */

        const attractions = features
          .map((feature) => {
            const properties =
              feature?.properties || {};

            const geometryCoordinates =
              feature?.geometry?.coordinates ||
              [];

            const lat =
              properties.lat ??
              geometryCoordinates[1];

            const lon =
              properties.lon ??
              geometryCoordinates[0];

            const categories =
              Array.isArray(
                properties.categories
              )
                ? properties.categories
                : [];

            const primaryCategory =
              categories.find((category) =>
                category.startsWith(
                  "tourism.sights"
                )
              ) ||
              categories.find((category) =>
                category.startsWith(
                  "tourism"
                )
              ) ||
              "tourism.sights";

            return {
              id:
                properties.place_id ||
                `${properties.name}-${lat}-${lon}`,

              placeId:
                properties.place_id ||
                null,

              name:
                properties.name ||
                "Unnamed attraction",

              category:
                formatCategory(
                  primaryCategory
                ),

              categories,

              description:
                properties.description ||
                "",

              address:
                properties.formatted ||
                "",

              city:
                properties.city ||
                "",

              lat: Number(lat),
              lon: Number(lon),

              distance:
                Number.isFinite(
                  Number(
                    properties.distance
                  )
                )
                  ? Number(
                      properties.distance
                    )
                  : null,
            };
          })
          .filter(
            (place) =>
              place.name &&
              Number.isFinite(place.lat) &&
              Number.isFinite(place.lon)
          )
          .filter((place) => {
            /*
             * Defensive exclusion of unrelated
             * businesses.
             */
            const categories =
              place.categories || [];

            const isRestaurant =
              categories.some((category) =>
                category.startsWith(
                  "catering."
                )
              );

            const isHotel =
              categories.some((category) =>
                category.startsWith(
                  "accommodation."
                )
              );

            const isShopping =
              categories.some((category) =>
                category.startsWith(
                  "commercial.shopping"
                )
              );

            return (
              !isRestaurant &&
              !isHotel &&
              !isShopping
            );
          });

        if (cancelled) return;

        console.log(
          "NORMALIZED ATTRACTIONS:",
          attractions
        );

        setPlaces(attractions);
        setError("");
        setLoading(false);
      } catch (err) {
        if (cancelled) return;

        console.error(
          "Tourism Explorer error:",
          err
        );

        setError(
          err?.message ||
            "Unable to load tourist attractions."
        );

        setPlaces([]);
        setLoading(false);

        /*
         * Make sure HyperDart never waits forever.
         */
        signalComponentLoaded();
      }
    };

    loadTourismPlaces();

    return () => {
      cancelled = true;
    };
  }, [searchDataKey]);

  /*
   * ============================================================
   * LOCAL FILTER
   * ============================================================
   */

  const filteredPlaces = useMemo(() => {
    const query =
      searchText.trim().toLowerCase();

    if (!query) return places;

    const tokens = query
      .split(/\s+/)
      .filter(Boolean);

    return places.filter((place) => {
      const searchableText = [
        place.name,
        place.category,
        place.description,
        place.address,
      ]
        .join(" ")
        .toLowerCase();

      return tokens.every((token) =>
        searchableText.includes(token)
      );
    });
  }, [places, searchText]);

  /*
   * ============================================================
   * MAP CENTER
   * ============================================================
   */

  const mapCenter = useMemo(() => {
    if (focusedPlace) {
      return {
        longitude: focusedPlace.lon,
        latitude: focusedPlace.lat,
      };
    }

    if (location) {
      return {
        longitude: location.longitude,
        latitude: location.latitude,
      };
    }

    return null;
  }, [focusedPlace, location]);

  /*
   * ============================================================
   * STATIC MAP
   * ============================================================
   */

  const mapUrl = useMemo(() => {
    if (!mapCenter) return "";

    const apiKey =
      import.meta.env.VITE_GEO_API_KEY ||
      import.meta.env.GEO_API_KEY;

    if (!apiKey) return "";

    let markers = [];

    if (focusedPlace) {
      markers = [
        `lonlat:${focusedPlace.lon},${focusedPlace.lat};` +
          "type:circle;" +
          "size:48;" +
          "text:1",
      ];
    } else {
      markers = places
        .slice(0, 20)
        .map((place, index) => {
          return (
            `lonlat:${place.lon},${place.lat};` +
            "type:circle;" +
            "size:32;" +
            `text:${index + 1}`
          );
        });
    }

    const params = new URLSearchParams();

    params.set(
      "style",
      "osm-bright"
    );

    params.set(
      "width",
      "1200"
    );

    params.set(
      "height",
      "500"
    );

    params.set(
      "center",
      `lonlat:${mapCenter.longitude},${mapCenter.latitude}`
    );

    params.set(
      "zoom",
      focusedPlace ? "15" : "13"
    );

    if (markers.length) {
      params.set(
        "marker",
        markers.join("|")
      );
    }

    params.set(
      "apiKey",
      apiKey
    );

    const finalUrl =
      "https://maps.geoapify.com/v1/staticmap?" +
      params.toString();

    console.log(
      "MAP URL:",
      finalUrl
    );

    return finalUrl;
  }, [
    mapCenter,
    places,
    focusedPlace,
  ]);

  /*
   * ============================================================
   * MAP FOCUS
   * ============================================================
   */

  const focusPlace = (place) => {
    setFocusedPlace(place);

    setTimeout(() => {
      document
        .getElementById(
          "tourism-explorer-map"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    }, 50);
  };

  /*
   * ============================================================
   * EXTERNAL MAPS
   * ============================================================
   */

  const openGoogleMaps = (place) => {
    const url =
      "https://www.google.com/maps/search/" +
      "?api=1" +
      `&query=${encodeURIComponent(
        `${place.lat},${place.lon}`
      )}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const openOpenStreetMap = (place) => {
    const url =
      `https://www.openstreetmap.org/?mlat=${place.lat}` +
      `&mlon=${place.lon}` +
      `#map=18/${place.lat}/${place.lon}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  /*
   * ============================================================
   * PLACE DETAILS
   * ============================================================
   */

  const loadDetails = async (place) => {
    setSelectedPlace(place);
    setDetails(null);

    if (!place.placeId) return;

    try {
      setDetailsLoading(true);

      const apiKey =
        import.meta.env.VITE_GEO_API_KEY ||
        import.meta.env.GEO_API_KEY;

      if (!apiKey) return;

      const url =
        "https://api.geoapify.com/v2/place-details" +
        `?id=${encodeURIComponent(
          place.placeId
        )}` +
        `&apiKey=${encodeURIComponent(
          apiKey
        )}`;

      const response =
        await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Place details request failed (${response.status}).`
        );
      }

      const data =
        await response.json();

      setDetails(
        data?.features?.[0]?.properties ||
          null
      );
    } catch (err) {
      console.error(
        "Place details error:",
        err
      );

      setDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  /*
   * ============================================================
   * INITIAL / NO DATA
   * ============================================================
   */

  if (loading && !location) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        spacing={2}
        sx={{
          width: "100%",
          py: 8,
        }}
      >
        <CircularProgress />

        <Typography>
          Finding tourist attractions...
        </Typography>
      </Stack>
    );
  }

  if (error && !places.length) {
    return (
      <Alert
        severity="error"
        sx={{ width: "100%" }}
      >
        {error}
      </Alert>
    );
  }

  if (!places.length) {
    return (
      <Alert
        severity="info"
        sx={{ width: "100%" }}
      >
        No suitable tourist attractions were
        found within 5 km.
      </Alert>
    );
  }

  /*
   * ============================================================
   * MAIN UI
   * ============================================================
   */

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        overflowX: "hidden",
        boxSizing: "border-box",
      }}
    >
      <Stack
        spacing={3}
        sx={{
          width: "100%",
          minWidth: 0,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={800}
          >
            🗺️ Tourist Attractions
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            Explore sights and attractions near{" "}
            <strong>
              {location?.city}
            </strong>
          </Typography>

          {location?.usingUserLocation && (
            <Chip
              label="📍 Using your current location"
              size="small"
              sx={{ mt: 1 }}
            />
          )}
        </Box>

        {mapUrl && (
          <Card
            id="tourism-explorer-map"
            variant="outlined"
            sx={{
              width: "100%",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                width: "100%",
                height: {
                  xs: 300,
                  sm: 380,
                  md: 500,
                },
              }}
            >
              <Box
                component="img"
                src={mapUrl}
                alt={`Tourist attractions near ${location?.city}`}
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "block",
                  objectFit: "cover",
                }}
              />
            </Box>

            <CardContent>
              <Stack spacing={1}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                    >
                      📍 Attraction Map
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      {focusedPlace
                        ? `Showing ${focusedPlace.name}`
                        : "Markers correspond to the attractions listed below."}
                    </Typography>
                  </Box>

                  {focusedPlace && (
                    <Button
                      size="small"
                      onClick={() =>
                        setFocusedPlace(null)
                      }
                    >
                      Reset Map
                    </Button>
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        )}

        <TextField
          fullWidth
          size="small"
          label="Filter attractions"
          placeholder="Eiffel Tower, museum, landmark..."
          value={searchText}
          onChange={(event) =>
            setSearchText(
              event.target.value
            )
          }
        />

        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography
            variant="body2"
            color="text.secondary"
          >
            {searchText.trim()
              ? `${filteredPlaces.length} matching attractions`
              : `Showing ${places.length} of ${places.length} attractions`}
          </Typography>

          {focusedPlace && (
            <Chip
              label={`📍 ${focusedPlace.name}`}
              onDelete={() =>
                setFocusedPlace(null)
              }
              size="small"
            />
          )}
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              md: "repeat(2, minmax(0, 1fr))",
            },
            gap: 2,
            width: "100%",
            minWidth: 0,
          }}
        >
          {filteredPlaces.map(
            (place, index) => {
              const isFocused =
                focusedPlace?.id ===
                place.id;

              return (
                <Box
                  key={place.id}
                  sx={{
                    minWidth: 0,
                    width: "100%",
                  }}
                >
                  <Card
                    variant="outlined"
                    onClick={() =>
                      focusPlace(place)
                    }
                    sx={{
                      height: "100%",
                      cursor: "pointer",
                      borderRadius: 3,
                      border: isFocused
                        ? "2px solid #1976d2"
                        : undefined,
                      backgroundColor:
                        isFocused
                          ? "rgba(25,118,210,0.04)"
                          : undefined,
                      transition:
                        "all 0.2s ease",
                      "&:hover": {
                        transform:
                          "translateY(-2px)",
                        boxShadow: 3,
                      },
                    }}
                  >
                    <CardContent>
                      <Stack spacing={1.5}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="flex-start"
                          gap={1}
                        >
                          <Typography
                            variant="h6"
                            fontWeight={700}
                          >
                            {place.name}
                          </Typography>

                          <Chip
                            label={
                              place.category
                            }
                            size="small"
                            variant="outlined"
                          />
                        </Stack>

                        {place.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            {
                              place.description
                            }
                          </Typography>
                        )}

                        {place.address && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            📍{" "}
                            {place.address}
                          </Typography>
                        )}

                        {place.distance !=
                          null && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {formatDistance(
                              place.distance
                            )}{" "}
                            away
                          </Typography>
                        )}

                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Coordinates:{" "}
                          {place.lat.toFixed(
                            5
                          )}
                          ,{" "}
                          {place.lon.toFixed(
                            5
                          )}
                        </Typography>

                        <Divider />

                        <Stack
                          direction="row"
                          spacing={1}
                          flexWrap="wrap"
                          useFlexGap
                        >
                          <Button
                            size="small"
                            variant={
                              isFocused
                                ? "contained"
                                : "outlined"
                            }
                            onClick={(event) => {
                              event.stopPropagation();

                              focusPlace(
                                place
                              );
                            }}
                          >
                            {isFocused
                              ? "On Map"
                              : "View on Map"}
                          </Button>

                          <Button
                            size="small"
                            variant="outlined"
                            onClick={(event) => {
                              event.stopPropagation();

                              loadDetails(
                                place
                              );
                            }}
                          >
                            Details
                          </Button>

                          <Button
                            size="small"
                            variant="outlined"
                            onClick={(event) => {
                              event.stopPropagation();

                              openGoogleMaps(
                                place
                              );
                            }}
                          >
                            Maps
                          </Button>

                          <Button
                            size="small"
                            variant="text"
                            onClick={(event) => {
                              event.stopPropagation();

                              openOpenStreetMap(
                                place
                              );
                            }}
                          >
                            OSM
                          </Button>
                        </Stack>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          #{index + 1}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>
              );
            }
          )}
        </Box>

        <Dialog
          open={Boolean(selectedPlace)}
          onClose={() => {
            setSelectedPlace(null);
            setDetails(null);
          }}
          fullWidth
          maxWidth="sm"
        >
          {selectedPlace && (
            <>
              <DialogTitle fontWeight={800}>
                {selectedPlace.name}
              </DialogTitle>

              <DialogContent dividers>
                {detailsLoading ? (
                  <Stack
                    alignItems="center"
                    spacing={2}
                    sx={{ py: 5 }}
                  >
                    <CircularProgress />

                    <Typography>
                      Loading place details...
                    </Typography>
                  </Stack>
                ) : (
                  <Stack spacing={2}>
                    <Chip
                      label={
                        selectedPlace.category
                      }
                      sx={{
                        width: "fit-content",
                      }}
                    />

                    {selectedPlace.description && (
                      <Typography>
                        {
                          selectedPlace.description
                        }
                      </Typography>
                    )}

                    {selectedPlace.address && (
                      <Typography>
                        📍{" "}
                        {
                          selectedPlace.address
                        }
                      </Typography>
                    )}

                    {details?.website && (
                      <Link
                        href={
                          details.website
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Official website →
                      </Link>
                    )}

                    {details?.opening_hours && (
                      <Box>
                        <Typography fontWeight={700}>
                          Opening hours
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          {
                            details.opening_hours
                          }
                        </Typography>
                      </Box>
                    )}

                    {details?.contact?.phone && (
                      <Typography>
                        ☎️{" "}
                        {
                          details.contact.phone
                        }
                      </Typography>
                    )}

                    {details?.contact?.email && (
                      <Typography>
                        ✉️{" "}
                        {
                          details.contact.email
                        }
                      </Typography>
                    )}
                  </Stack>
                )}
              </DialogContent>

              <DialogActions>
                <Button
                  onClick={() =>
                    focusPlace(
                      selectedPlace
                    )
                  }
                >
                  View on Map
                </Button>

                <Button
                  onClick={() =>
                    openGoogleMaps(
                      selectedPlace
                    )
                  }
                >
                  Open Maps
                </Button>

                <Button
                  onClick={() => {
                    setSelectedPlace(null);
                    setDetails(null);
                  }}
                >
                  Close
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Stack>
    </Box>
  );
}

function formatCategory(category) {
  return (
    category
      .replace(
        /^tourism\.sights\.?/,
        ""
      )
      .replace(
        /^tourism\.?/,
        ""
      )
      .replace(
        /[._-]/g,
        " "
      )
      .trim()
      .replace(
        /\b\w/g,
        (char) => char.toUpperCase()
      ) ||
    "Tourist Attraction"
  );
}

function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  return `${(meters / 1000).toFixed(1)} km`;
}

export default NewComponent;