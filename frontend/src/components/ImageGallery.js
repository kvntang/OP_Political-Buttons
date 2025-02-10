import React, { useEffect, useState } from "react";
import axios from "axios";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import "./ImageGallery.css"; // Import the CSS file for additional styling

export default function ImageGallery() {
  const [images, setImages] = useState([]);
  const [yearRange, setYearRange] = useState([1940, 2000]); // Default range for year filtering
  const [imageSize, setImageSize] = useState(100); // Default displayed image size in pixels
  const [apiUrl, setApiUrl] = useState(""); // For debugging

  // Checkbox filters for image type
  const [showPolitical, setShowPolitical] = useState(true);
  const [showOther, setShowOther] = useState(true);

  // New: Color filter and tolerance states
  // Initialize with a valid hex color to avoid errors.
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [tolerance, setTolerance] = useState(10); // Hue tolerance in degrees
  const [applyColorFilter, setApplyColorFilter] = useState(false);

  // New: Toggle for applying the date (timeline) filter
  const [applyDateFilter, setApplyDateFilter] = useState(true);

  // Fetch images from the backend
  const fetchImages = async () => {
    try {
      // Start constructing the URL with the date filter toggle and date range
      let url = `http://127.0.0.1:8000/images?apply_date=${applyDateFilter}&min_date=${yearRange[0]}&max_date=${yearRange[1]}`;

      // Determine the type filter:
      if (!(showPolitical && showOther)) {
        if (showPolitical && !showOther) {
          url += "&type=political-campaigns";
        } else if (!showPolitical && showOther) {
          url += "&type=other";
        }
      }

      // Append color filter if it is enabled and a color is selected.
      if (applyColorFilter && selectedColor) {
        url += `&color=${encodeURIComponent(
          selectedColor
        )}&hue_tolerance=${tolerance}`;
      }

      setApiUrl(url); // Set the URL for debugging purposes
      const response = await axios.get(url);
      setImages(response.data);
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  };

  // Fetch images when the component mounts or when any filter changes
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
  ]);

  return (
    <div>
      {/* Filters Section */}
      <div className="filters">
        {/* Year range slider and Timeline Filter Toggle */}
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
          {/* New: Toggle for applying the timeline/date filter */}
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

        {/* Type Filter Checkboxes and Grid Size Slider */}
        <div className="checkbox-filters">
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
        </div>

        {/* Color Filter Toggle, Color Picker and Tolerance Slider */}
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
                className="color-picker-input"
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
                className="tolerance-slider-container"
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

      {/* Debug Section: Displaying the full query URL */}
      <div className="debug" style={{ margin: "1rem 0", color: "white" }}>
        <small>API Query: {apiUrl}</small>
      </div>

      {/* Debug text showing the number of images found */}
      <small style={{ color: "white" }}>{images.length} images found</small>

      {/* Image Gallery */}
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
                "--img-size": `${imageSize}px`, // For layout purposes
                "--img-num": imageSize, // Unitless numeric value for scaling calculations
              }}
            >
              {img.image_url ? (
                <img
                  src={encodeURI(img.image_url)}
                  alt={img.title}
                  className="gallery-image"
                  style={{
                    width: `${imageSize}px`,
                    height: `${imageSize}px`,
                    objectFit: "cover",
                  }}
                />
              ) : (
                <p>⚠️ Image Not Found</p>
              )}
              <div className="image-info">
                <p>{img.title.replace(/-/g, " ")}</p>
                <p>
                  {img.date}, {img.dimension}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
