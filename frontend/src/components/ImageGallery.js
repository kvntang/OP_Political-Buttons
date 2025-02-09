import React, { useEffect, useState } from "react";
import axios from "axios";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import "./ImageGallery.css"; // Import the CSS file for additional styling

export default function ImageGallery() {
  const [images, setImages] = useState([]);
  const [yearRange, setYearRange] = useState([1940, 2000]); // Default range for year filtering
  const [imageSize, setImageSize] = useState(200); // Default displayed image size in pixels
  const [apiUrl, setApiUrl] = useState(""); // For debugging

  // Checkbox filters for image type
  const [showPolitical, setShowPolitical] = useState(true);
  const [showOther, setShowOther] = useState(true);

  // Fetch images from the backend
  const fetchImages = async () => {
    try {
      // Start constructing the URL with the date range filter
      let url = `http://127.0.0.1:8000/images?min_date=${yearRange[0]}&max_date=${yearRange[1]}`;

      // Determine the type filter:
      // If both checkboxes are checked, then do not add any type filter.
      if (!(showPolitical && showOther)) {
        if (showPolitical && !showOther) {
          url += "&type=political-campaigns";
        } else if (!showPolitical && showOther) {
          url += "&type=other";
        }
        // If neither is checked, you might choose to show none or default to showing all.
        // For now, we'll default to showing all images if neither is checked.
      }

      setApiUrl(url); // For debugging purposes

      const response = await axios.get(url);
      setImages(response.data);
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  };

  // Fetch images when the component mounts or when any filter changes
  useEffect(() => {
    fetchImages();
  }, [yearRange, showPolitical, showOther]);

  return (
    <div>
      {/* Filters Section */}
      <div className="filters">
        {/* Year range slider */}
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
        </div>

        {/* Type Filter Checkboxes */}
        <div className="checkbox-filters">
          {/* Image size slider */}
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
      </div>

      {/* Debug text showing the current API URL (optional) */}
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
              style={{ "--img-size": `${imageSize}px` }} // set the custom property for dynamic sizing
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
                {/* <p>Type: {img.type}</p> */}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
