import React, { useEffect, useState } from "react";
import axios from "axios";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import "./ImageGallery.css"; // Your CSS file

export default function ImageGallery() {
  const [images, setImages] = useState([]);
  const [yearRange, setYearRange] = useState([1940, 2000]); // Default year range
  const [imageSize, setImageSize] = useState(100); // Default grid image size (px)
  const [apiUrl, setApiUrl] = useState(""); // For debugging

  // Checkbox filters for image type
  const [showPolitical, setShowPolitical] = useState(true);
  const [showOther, setShowOther] = useState(true);

  // Color filter and tolerance states
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [tolerance, setTolerance] = useState(10); // Hue tolerance in degrees
  const [applyColorFilter, setApplyColorFilter] = useState(false);

  // Toggle for applying the date (timeline) filter
  const [applyDateFilter, setApplyDateFilter] = useState(true);

  // Real-Life Size View toggle and scale factor
  const [realLifeSizeView, setRealLifeSizeView] = useState(false);
  const [realLifeScale, setRealLifeScale] = useState(100);

  // **New states for keyword search:**
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  // Fetch images from the backend //////////////////////////////////////////////////////
  const fetchImages = async () => {
    try {
      // Construct URL with date filter toggle and date range
      let url = `http://127.0.0.1:8000/images?apply_date=${applyDateFilter}&min_date=${yearRange[0]}&max_date=${yearRange[1]}`;

      // Type filtering
      if (!(showPolitical && showOther)) {
        if (showPolitical && !showOther) {
          url += "&type=political-campaigns";
        } else if (!showPolitical && showOther) {
          url += "&type=other";
        }
      }

      // Append color filter if enabled
      if (applyColorFilter && selectedColor) {
        url += `&color=${encodeURIComponent(
          selectedColor
        )}&hue_tolerance=${tolerance}`;
      }

      // Append keyword filter if provided
      if (searchTerm) {
        url += `&keyword=${encodeURIComponent(searchTerm)}`;
      }

      setApiUrl(url); // For debugging purposes
      const response = await axios.get(url);
      setImages(response.data);
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  };

  // Fetch images when filters change
  useEffect(() => {
    fetchImages();
  }, [
    yearRange,
    showPolitical,
    showOther,
    applyColorFilter,
    selectedColor,
    tolerance,
    applyDateFilter,
    searchTerm,
  ]);

  // Utility to extract the numeric value from a dimension string (e.g., "2.3cm")
  // If the dimension is "na" (or missing), fallback to imageSize.
  const getDimensionInPixels = (dimensionStr) => {
    if (!dimensionStr || dimensionStr.toLowerCase() === "na") return imageSize;
    const num = parseFloat(dimensionStr.replace("cm", "").trim());
    return isNaN(num) ? imageSize : num * realLifeScale;
  };

  // Handler to fetch suggestions as the user types
  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.length > 0) {
      try {
        const response = await axios.get(
          `http://127.0.0.1:8000/suggestions?q=${value}`
        );
        setSuggestions(response.data);
      } catch (err) {
        console.error(err);
      }
    } else {
      setSuggestions([]);
    }
  };

  return (
    <div>
      {/* Filters Section */}
      <div className="filters">
        {/* 1. Year Range Filter */}
        <div className="year-filter">
          <p>
            from {yearRange[0]} to {yearRange[1]}
          </p>
          <Slider
            range
            min={1936}
            max={2006}
            step={1}
            value={yearRange}
            onChange={(range) => setYearRange(range)}
          />
          <label
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <input
              type="checkbox"
              checked={applyDateFilter}
              onChange={(e) => setApplyDateFilter(e.target.checked)}
            />
            <small>Apply Timeline Filter</small>
          </label>
        </div>

        {/* 2. Keyword Search */}
        <div
          className="keyword-search"
          style={{ position: "relative", marginBottom: "1rem" }}
        >
          <input
            type="text"
            placeholder="Search images..."
            value={searchTerm}
            onChange={handleSearchChange}
            onBlur={() => setTimeout(() => setSuggestions([]), 150)}
            style={{ padding: "0.5rem", width: "200px" }}
          />

          {suggestions.length > 0 && (
            <ul
              className="suggestions"
              style={{
                position: "absolute",
                top: "2.5rem",
                left: 0,
                backgroundColor: "#fff",
                listStyle: "none",
                padding: "0.5rem",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                width: "200px",
                zIndex: 100,
              }}
            >
              {suggestions.map((sugg, index) => (
                <li
                  key={index}
                  onClick={() => {
                    setSearchTerm(sugg);
                    setSuggestions([]);
                  }}
                  style={{ cursor: "pointer", padding: "0.25rem 0" }}
                >
                  {sugg}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 3. Checkboxes and Sliders */}
        <div className="checkbox-filters">
          {/* Show grid size slider when NOT in Real-Life Size View */}
          {!realLifeSizeView && (
            <div style={{ width: "100%" }}>
              <small>Grid size:</small>
              <Slider
                min={100}
                max={400}
                step={10}
                value={imageSize}
                onChange={(value) => setImageSize(value)}
              />
            </div>
          )}
          {/* Show real-life scale slider when in Real-Life Size View */}
          {realLifeSizeView && (
            <div style={{ width: "100%" }}>
              <small>Real Life Scale (px per cm):</small>
              <Slider
                min={10}
                max={50}
                step={5}
                value={realLifeScale}
                onChange={(value) => setRealLifeScale(value)}
              />
            </div>
          )}
          <label>
            <input
              type="checkbox"
              checked={showPolitical}
              onChange={() => setShowPolitical((prev) => !prev)}
            />
            <small>Political Campaigns</small>
          </label>
          <label>
            <input
              type="checkbox"
              checked={showOther}
              onChange={() => setShowOther((prev) => !prev)}
            />
            <small>Everything Else</small>
          </label>
          {/* Toggle for Real-Life Size View */}
          <label>
            <input
              type="checkbox"
              checked={realLifeSizeView}
              onChange={(e) => setRealLifeSizeView(e.target.checked)}
            />
            <small>Real Life Size View</small>
          </label>
        </div>

        {/* 4. Color Filter Controls */}
        <div
          className="color-picker-container"
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <input
              type="checkbox"
              checked={applyColorFilter}
              onChange={(e) => setApplyColorFilter(e.target.checked)}
            />
            <small>Apply Color Filter</small>
          </label>
          {applyColorFilter && (
            <>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <label htmlFor="colorPicker">
                  <small>Select Color:</small>
                </label>
                <input
                  id="colorPicker"
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  style={{
                    width: "2rem",
                    height: "2rem",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    backgroundColor: "transparent",
                  }}
                />
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <label htmlFor="toleranceSlider">
                  <small>Hue Tolerance:</small>
                </label>
                <Slider
                  id="toleranceSlider"
                  min={0}
                  max={50}
                  step={1}
                  value={tolerance}
                  onChange={(value) => setTolerance(value)}
                  style={{ width: "150px" }}
                />
                <small>{tolerance}°</small>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Debug Info */}
      <div className="debug" style={{ margin: "1rem 0", color: "white" }}>
        <small>API Query: {apiUrl}</small>
      </div>
      <small style={{ color: "white" }}>{images.length} images found</small>

      {/* Image Gallery */}
      {realLifeSizeView ? (
        // Real-Life Size View: Use a flex container with wrapping for a free-flowing layout.
        // Filter out images whose dimension is "na".
        <div
          className="gallery real-life"
          style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}
        >
          {images.filter((img) => img.dimension.toLowerCase() !== "na")
            .length === 0 ? (
            <p>No images found in this time range.</p>
          ) : (
            images
              .filter((img) => img.dimension.toLowerCase() !== "na")
              .map((img) => {
                const computedWidth = getDimensionInPixels(img.dimension);
                return (
                  <div
                    key={img.id}
                    className="image-container"
                    style={{
                      width: `${computedWidth}px`,
                      "--img-size": `${computedWidth}px`,
                      "--img-num": computedWidth,
                    }}
                  >
                    {img.image_url ? (
                      <img
                        src={encodeURI(img.image_url)}
                        alt={img.title}
                        className="gallery-image"
                        title={img.title}
                      />
                    ) : (
                      <p>⚠️ Image Not Found</p>
                    )}
                    <div className="image-info">
                      <p>{img.title.replace(/-/g, " ")}</p>
                      <p>
                        {img.date}, {img.dimension}
                      </p>
                      <p>{img.ocr_text}</p>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      ) : (
        // Grid View: Uniform size images based on the grid size slider.
        <div
          className="gallery"
          style={{
            gridTemplateColumns: `repeat(auto-fill, minmax(${imageSize}px, 1fr))`,
          }}
        >
          {images.length === 0 ? (
            <p>No images found in this time range.</p>
          ) : (
            images.map((img) => (
              <div
                key={img.id}
                className="image-container"
                style={{
                  "--img-size": `${imageSize}px`,
                  "--img-num": imageSize,
                }}
              >
                {img.image_url ? (
                  <img
                    src={encodeURI(img.image_url)}
                    alt={img.title}
                    className="gallery-image"
                  />
                ) : (
                  <p>⚠️ Image Not Found</p>
                )}
                <div className="image-info">
                  <p>{img.title.replace(/-/g, " ")}</p>
                  <p>
                    {img.date}, {img.dimension.toLowerCase()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
