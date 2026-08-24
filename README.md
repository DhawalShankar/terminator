# Tourism Explorer --- HyperDart Hackathon Component

A HyperDart component for discovering tourist attractions, landmarks,
museums, monuments, viewpoints, historical places, and other
tourism-related points of interest for a requested city or nearby
location.

The component was built against the supplied **Tourism Explorer
Component --- HyperDart Hackathon Documentation & Problem Statement**.

------------------------------------------------------------------------

## 1. What the Component Does

The component accepts natural-language tourism queries such as:

-   `tourist attractions in Paris`
-   `tourist attractions in NYC`
-   `things to do in Paris`
-   `places to visit in Kyoto`
-   `landmarks in Rome`
-   `sights near Tokyo`
-   `points of interest in London`
-   category-specific queries such as `museums in Paris`

It then:

1.  Receives `searchData` from HyperDart.
2.  Extracts the resolved location entity.
3.  Obtains the city's latitude and longitude.
4.  Determines the tourism/category intent where available.
5.  Queries the Geoapify Places API.
6.  Searches within the required geographic radius.
7.  Normalizes the GeoJSON response.
8.  Removes irrelevant business categories such as restaurants, hotels,
    and shopping.
9.  Displays the results as attraction cards.
10. Displays the locations on an interactive map.
11. Provides local filtering of already-fetched results.
12. Provides map/details/external-map/OSM actions.
13. Handles loading, API errors, empty results, and location fallback
    gracefully.

------------------------------------------------------------------------

## 2. Specification Compliance

The supplied specification requires a tourism-focused component that
surfaces sights and attractions rather than restaurants or lodging.

The implemented component covers:

-   Tourist attractions / sights
-   Landmarks
-   Historical sites
-   Museums
-   Monuments
-   Viewpoints
-   Other tourism-related points of interest

The specification explicitly requires the component to avoid
restaurants, cafes, bars, shopping businesses, and hotels as primary
tourism results.

------------------------------------------------------------------------

## 3. HyperDart Integration

### Component configuration

The component configuration contains:

-   Package name from `package.json`
-   Tourism-related trigger keywords
-   Query regex patterns
-   HyperDart client/module information
-   Base URL
-   Mainline, sidebar, and fullscreen formats
-   Component permissions/info metadata

### Trigger keywords

The component recognizes:

``` text
tourist attraction
tourist attractions
things to do
places to visit
landmarks
sights
points of interest
```

### Query patterns

The configuration supports the following structures:

``` text
tourist attractions in <LOCATION>
tourist attractions near <LOCATION>

things to do in <LOCATION>
things to do near <LOCATION>

places to visit in <LOCATION>
places to visit near <LOCATION>

landmarks in <LOCATION>
landmarks near <LOCATION>

sights in <LOCATION>
sights near <LOCATION>

points of interest in <LOCATION>
points of interest near <LOCATION>
```

The location placeholder is handled through HyperDart's `HD_LOCATION`
entity system.

The regexes were made tolerant of HyperDart's location suffix format:

``` text
HD_LOCATION(__\w+)?
```

and allow additional text after the location.

------------------------------------------------------------------------

## 4. `searchData` Integration

A major part of the implementation is using HyperDart's supplied
`searchData` rather than trying to independently resolve every city.

The component:

-   Accepts `props.searchData`
-   Handles JSON-string and object forms
-   Locates the `LOCATION` entity
-   Reads the resolved geographic information
-   Uses the returned city/coordinates for the Places API request

The relevant location data comes from the HyperDart search-resolution
layer.

This is important because the specification explicitly states that the
platform performs Named Entity Recognition and supplies the resolved
city entity to the component.

------------------------------------------------------------------------

## 5. Location Handling

### Primary path

For normal city queries:

``` text
User query
   ↓
HyperDart searchData
   ↓
LOCATION entity
   ↓
latitude + longitude
   ↓
Geoapify Places API
```

### `near me` fallback

For searches where HyperDart does not provide a resolved location,
browser geolocation is used as a fallback.

The browser location flow:

-   Checks whether geolocation is supported.
-   Requests the current position.
-   Uses latitude/longitude returned by the browser.
-   Displays a clear error if location access is unavailable or denied.

The geolocation request uses:

``` text
enableHighAccuracy: true
timeout: 10000 ms
maximumAge: 300000 ms
```

This fallback is specifically useful for location-based searches such as
nearby/near-me queries.

------------------------------------------------------------------------

## 6. Geoapify Places API

The component uses the Geoapify Places API.

The specification requires:

``` text
/v2/places
```

with tourism-related categories, a geographic filter, a limit of 20, and
the Geoapify API key.

The required geographic search is based on:

``` text
circle:{longitude},{latitude},5000
```

Important:

**Geoapify expects longitude,latitude order in proximity filters.**

The component therefore keeps latitude and longitude separate and
constructs the request in the correct order.

------------------------------------------------------------------------

## 7. Geographic Radius

The required search radius is:

``` text
5000 metres
```

or:

``` text
5 km
```

This means the API search is centered around the resolved city/location
coordinates.

It is **not** a hardcoded list of cities.

For example:

``` text
Paris → Paris coordinates → 5 km search
Rome → Rome coordinates → 5 km search
Pune → Pune coordinates → 5 km search
```

The same logic works for other locations supplied by HyperDart.

------------------------------------------------------------------------

## 8. Result Limit

The specification requires:

``` text
limit = 20
```

The component requests a maximum of 20 places.

This prevents unnecessarily large result sets and matches the hackathon
requirement.

------------------------------------------------------------------------

## 9. GeoJSON Response Normalization

Geoapify returns GeoJSON-style Feature objects.

The implementation safely extracts:

### Name

``` text
properties.name
```

### Categories

``` text
properties.categories
```

### Latitude

``` text
properties.lat
```

with fallback to:

``` text
geometry.coordinates[1]
```

### Longitude

``` text
properties.lon
```

with fallback to:

``` text
geometry.coordinates[0]
```

### Description

``` text
properties.description
```

### Address

``` text
properties.formatted
```

### Distance

``` text
properties.distance
```

when available.

The component also validates that the result has:

-   A usable name
-   A finite latitude
-   A finite longitude

before displaying it.

------------------------------------------------------------------------

## 10. Category Handling

Each attraction retains the Geoapify category information.

The component identifies a primary tourism category where possible,
preferring:

``` text
tourism.sights...
```

and then other:

``` text
tourism...
```

categories.

The category is formatted for human-readable display.

The component also keeps the original category array so that filtering
and defensive classification can use the raw Geoapify categories.

------------------------------------------------------------------------

## 11. Irrelevant Business Filtering

Because the component is specifically a Tourism Explorer, unrelated
businesses should not become primary results.

The implementation defensively excludes results containing categories
beginning with:

``` text
catering.
```

for restaurants/food businesses,

``` text
accommodation.
```

for hotels/lodging,

and:

``` text
commercial.shopping
```

for shopping.

This keeps the result set focused on tourism.

------------------------------------------------------------------------

## 12. Result Cards

Each result is presented as an attraction card.

The card contains:

-   Attraction name
-   Category
-   Address
-   Coordinates
-   Description when available
-   Result number

The component does **not** intentionally render an empty description.

------------------------------------------------------------------------

## 13. Map

The component includes an attraction map.

The map:

-   Centers around the searched location/results.
-   Displays markers for returned attractions.
-   Associates marker numbers with the attraction list.
-   Allows the user to visually understand where results are located.
-   Supports focusing on an attraction from the list.

The UI also labels the map:

``` text
📍 Attraction Map
Markers correspond to the attractions listed below.
```

------------------------------------------------------------------------

## 14. Result Actions

Each attraction provides actions such as:

### View on Map

Focuses the map on the selected attraction.

### Details

Opens/loads additional information for the selected place where
supported.

### Maps

Provides an external map destination.

### OSM

Provides an OpenStreetMap destination.

------------------------------------------------------------------------

## 15. Local Result Filtering

A local filter was added below the map.

Example:

``` text
Filter attractions
```

The filter works against already-loaded results instead of making
another API request.

The searchable fields include:

-   Name
-   Category
-   Description
-   Address
-   City

The entered text is tokenized, so multiple words can be searched.

For example:

``` text
art
```

can match attractions related to art.

This was also useful for category-specific exploration after broad
tourism results had been loaded.

------------------------------------------------------------------------

## 16. Category-Specific Queries

The component supports category intent in natural-language queries.

Examples:

``` text
museums in Paris
landmarks in Rome
historical places in Delhi
viewpoints in Tokyo
```

The supplied specification explicitly says that the component should
understand the relevant attraction category when one is specified and
map that intent to an appropriate Places category.

The final UI also allows the user to refine the fetched attraction set
locally through the filter.

------------------------------------------------------------------------

## 17. Loading State

A loading state was implemented deliberately to avoid showing a false
"not found" state while the API request is still running.

The lifecycle is:

``` text
New query
   ↓
Loading = true
   ↓
Show loading UI
   ↓
Wait for API response
   ↓
Results OR empty state OR error
```

An important bug encountered during development was that the
empty-result state could appear for a few seconds while the API request
was still pending.

This was corrected so that:

``` text
loading === true
```

takes precedence over the no-results state.

The component therefore does not prematurely tell the user that nothing
was found.

------------------------------------------------------------------------

## 18. No-Results Modal

When the request has finished and no suitable results are available, the
component uses a modal rather than a persistent red error banner.

The intended message explains that:

-   The requested location/results could not be found.
-   Nearby locations can still be explored.

The important distinction is:

``` text
Loading
≠
No results
≠
API error
```

These states are handled separately.

------------------------------------------------------------------------

## 19. Error Handling

API/runtime errors are handled through a dedicated error state.

The component:

-   Logs the error for debugging.
-   Shows a user-readable error message.
-   Clears invalid results.
-   Stops the loading state.
-   Signals HyperDart that the component has finished loading.

A fallback message is used when the original error does not contain a
useful message.

------------------------------------------------------------------------

## 20. `componentLoaded()` Handling

The component communicates its lifecycle back to HyperDart through:

``` text
props.messageHandlers.componentLoaded()
```

A `useRef` guard prevents the callback from being triggered repeatedly.

This was added to ensure the component does not leave the host platform
waiting indefinitely after successful loading or failure.

------------------------------------------------------------------------

## 21. Search Data Changes

The component creates a stable key from:

``` text
props.searchData
```

and reloads the tourism data when the search payload changes.

This prevents the component from remaining stuck on results belonging to
a previous query.

------------------------------------------------------------------------

## 22. Request Cancellation / Race Protection

An internal cancellation flag is used inside the loading effect.

This prevents stale asynchronous requests from updating React state
after a newer query has replaced them or the component has unmounted.

Conceptually:

``` text
Request A starts
Request B starts
Request A finishes late
        ↓
ignored if obsolete
```

This avoids stale-result UI bugs.

------------------------------------------------------------------------

## 23. Defensive API Parsing

The implementation does not assume Geoapify will always return a perfect
response.

For example:

``` text
data.features
```

is checked before processing.

Missing values are handled safely.

Invalid coordinates are removed.

Missing descriptions become empty strings.

Missing addresses become empty strings.

Missing categories fall back safely.

------------------------------------------------------------------------

## 24. UI/UX Improvements Made During Development

Several issues were identified and corrected while testing the
component:

### Premature "not found"

**Problem:** Empty state appeared before the API request finished.

**Fix:** Loading state now takes precedence.

------------------------------------------------------------------------

### Red error banner for empty results

**Problem:** A no-result condition looked like an application error.

**Fix:** Empty results are represented through a user-friendly modal.

------------------------------------------------------------------------

### Extra nested scrollbar

**Problem:** The component initially produced an unnecessary inner
scrollbar around the content.

**Fix:** Layout/overflow handling was corrected so the component does
not unnecessarily create a second scroll container.

------------------------------------------------------------------------

### JavaScript variable redeclaration

Development errors such as:

``` text
Cannot redeclare block-scoped variable 'apiKey'
```

and:

``` text
Cannot access 'detectedCategory2' before initialization
```

were caused by intermediate iterations of the implementation.

Those duplicate/incorrect declarations were removed in the corrected
version.

------------------------------------------------------------------------

### JSX duplicate attributes

An intermediate version also produced:

``` text
JSX elements cannot have multiple attributes with the same name
```

This was corrected by ensuring each JSX element has unique attribute
names.

------------------------------------------------------------------------

### Undefined category variable

An intermediate implementation produced:

``` text
detectedCategory is not defined
```

The category detection flow was corrected so category values are defined
before being used.

------------------------------------------------------------------------

## 25. Visual Design

The component was kept consistent with the HyperDart environment.

The final UI contains:

-   Clean attraction cards
-   Category chips
-   Address/location indicators
-   Coordinates
-   Map
-   Result numbering
-   Action buttons
-   Loading feedback
-   Empty-state modal
-   Error handling
-   Local filtering

The component also supports:

``` text
mainline
sidebar
fullscreen
```

as configured in the component configuration.

------------------------------------------------------------------------

## 26. Data Flow

The complete architecture is:

``` text
                    USER QUERY
                         │
                         ▼
                  ┌─────────────┐
                  │  HyperDart  │
                  │   Search    │
                  └──────┬──────┘
                         │
                         ▼
                    searchData
                         │
                         ▼
              Resolve LOCATION entity
                         │
                         ▼
                  latitude/longitude
                         │
                         ▼
              Detect tourism/category
                         │
                         ▼
                 Geoapify Places API
                         │
                         ▼
                 GeoJSON Feature[]
                         │
                         ▼
                 Normalize results
                         │
                         ▼
             Remove irrelevant businesses
                         │
                         ▼
                  Store in React state
                    /             \
                   ▼               ▼
                Map             Cards
                                   │
                                   ▼
                            Local filtering
```

------------------------------------------------------------------------

## 27. Main React State

The implementation maintains state for:

``` text
places
loading
error
location
focusedPlace
selectedPlace
details
detailsLoading
searchText
```

A ref is also used to prevent duplicate `componentLoaded()` signalling.

------------------------------------------------------------------------

## 28. Core Technologies

### Frontend

-   React
-   React hooks
-   Material UI

### Maps

-   Map-based attraction visualization
-   OpenStreetMap-related external actions

### Places / Geodata

-   Geoapify Places API
-   GeoJSON response handling

### Platform Integration

-   HyperDart
-   `searchData`
-   HyperDart LOCATION entities
-   `componentLoaded()` lifecycle callback

------------------------------------------------------------------------

## 29. Important Specification Details

The supplied documentation requires:

``` text
Geoapify Places API
categories = tourism.sights
5 km geographic filter
limit = 20
```

It also requires city resolution before the Places API call and
explicitly notes that Geoapify uses longitude,latitude ordering for
proximity coordinates.

The documentation further requires the component to understand a
requested category when specified and exclude irrelevant businesses from
tourism results.

------------------------------------------------------------------------

## 30. Supported Examples

### Broad tourism

``` text
tourist attractions in NYC
tourist attractions in Paris
tourist attractions in Pune
```

### Things to do

``` text
things to do in Paris
things to do in Kyoto
```

### Places to visit

``` text
places to visit in Kyoto
places to visit in Rome
```

### Landmarks

``` text
landmarks in Rome
landmarks in Delhi
```

### Sights

``` text
sights in Tokyo
sights near Paris
```

### Category-specific

``` text
museums in Paris
historical places in Delhi
viewpoints in Tokyo
```

------------------------------------------------------------------------

## 31. Testing Performed

The component was manually tested against multiple locations and query
forms, including:

-   Paris
-   Rome
-   Pune
-   Kanpur
-   Tokyo
-   NYC

Testing included:

-   Broad attraction queries
-   Category-specific queries
-   Map rendering
-   Attraction markers
-   Result cards
-   Local filtering
-   Empty-result behavior
-   Loading behavior
-   Location resolution
-   API result normalization
-   Error states
-   UI scrolling/layout
-   HyperDart component integration

Example successful tourism result testing included Pune and Rome, where
attraction cards and map markers were rendered.

Category/filter testing was also performed using queries such as:

``` text
museums in Paris
```

followed by local filtering such as:

``` text
art
```

which successfully narrowed the displayed results.

------------------------------------------------------------------------

## 32. Known Behaviour

The Geoapify dataset determines what places are actually returned.

Therefore:

``` text
No Geoapify result
```

does not necessarily mean:

``` text
The city does not exist.
```

It means that the configured search did not return suitable places
within the requested geographic search area.

This distinction is why the UI separates:

-   loading
-   no results
-   API/runtime errors

------------------------------------------------------------------------

## 33. What Was Deliberately Avoided

The component was not turned into a generic business-search component.

It does not intentionally make:

-   restaurants
-   cafes
-   bars
-   hotels
-   shopping businesses

the primary result type for normal tourism queries.

This keeps the implementation aligned with the Tourism Explorer scope.

------------------------------------------------------------------------

## 34. Final Specification Checklist

``` text
[✓] HyperDart component configuration
[✓] Tourism trigger keywords
[✓] LOCATION-aware query regex
[✓] searchData integration
[✓] Named location extraction
[✓] Latitude/longitude handling
[✓] Geoapify Places API
[✓] tourism.sights baseline
[✓] 5 km geographic filter
[✓] Maximum 20 results
[✓] GeoJSON parsing
[✓] Category extraction
[✓] Name extraction
[✓] Coordinates extraction
[✓] Description handling
[✓] Address handling
[✓] Restaurant exclusion
[✓] Hotel/lodging exclusion
[✓] Shopping exclusion
[✓] Attraction cards
[✓] Attraction map
[✓] Map markers
[✓] View-on-map action
[✓] Details action
[✓] Maps action
[✓] OSM action
[✓] Local filtering
[✓] Loading state
[✓] No-result handling
[✓] No-result modal
[✓] API error handling
[✓] componentLoaded signalling
[✓] Async cancellation protection
[✓] Fullscreen support
[✓] Sidebar support
[✓] Mainline support
[✓] Manual testing across multiple cities
```

------------------------------------------------------------------------

## 35. Final Status

**Tourism Explorer is complete and ready for submission/testing against
the HyperDart hackathon environment.**

The implementation follows the supplied problem statement and API
requirements while adding practical UX improvements around loading,
errors, empty results, mapping, filtering, and asynchronous state
management.

The important final principle is:

> The component should behave like a tourism explorer, not a generic
> places/business search engine.

------------------------------------------------------------------------

## 36. Submission Notes

Before submission:

1.  Confirm the Geoapify API key is supplied through the expected
    environment/configuration.
2.  Run the component locally.
3.  Test at least:
    -   `tourist attractions in Paris`
    -   `things to do in Kyoto`
    -   `landmarks in Rome`
    -   `museums in Paris`
    -   `sights near Tokyo`
4.  Confirm loading appears before results.
5.  Confirm no-results appears only after the request finishes.
6.  Confirm the map and cards agree on marker/result numbering.
7.  Confirm no console/runtime errors remain.
8.  Build/package the component according to the HyperDart submission
    workflow.

------------------------------------------------------------------------

## Credits / APIs

This component was developed for the HyperDart hackathon using:

-   HyperDart component/search integration
-   Geoapify Places API
-   React
-   Material UI
-   Map/OpenStreetMap-related map functionality

The project implementation and final behaviour should be evaluated
against the supplied Tourism Explorer hackathon documentation.
