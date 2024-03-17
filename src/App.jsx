import { useEffect, useState, useRef } from "react";
import "./App.css";
import { extractColors } from "extract-colors";

function App() {
  return <CurrentlyPlaying />;
}

const downloadImage = async (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // This is necessary for images from different origins
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        const localUrl = URL.createObjectURL(blob);
        resolve(localUrl);
      }, "image/png"); // Specify the image format
    };
    img.onerror = (error) => {
      reject(error);
    };
    img.src = url;
  });
};

function CurrentlyPlaying() {
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [artistColor, setArtistColor] = useState("");
  const artistRef = useRef(null); // Ref for the .artist element
  const titleRef = useRef(null); // Ref for the .title element
  const nameArtistRef = useRef(null);

  // Function to determine the style object based on the extracted color
  const getArtistStyle = () => {
    return {
      backgroundColor: artistColor,
      WebkitBackgroundClip: "text", // For WebKit browsers
      backgroundClip: "text", // Standard property
      color: "transparent", // Hide the original text color
    };
  };

  useEffect(() => {
    const fetchCurrentlyPlaying = async () => {
      try {
        const response = await fetch(
          "http://192.168.0.2:8888/currently-playing"
        );
        const data = await response.json();
        setCurrentlyPlaying(data);

        let src = data.item.album.images[0].url;
        src = await downloadImage(src); // Wait for the image to load

        extractColors(src, {
          pixels: 64000,
          distance: 0.22,
          colorValidator: (red, green, blue, alpha = 255) => alpha > 250,
          saturationDistance: 0.2,
          lightnessDistance: 0.2,
          hueDistance: 0.083333333,
        })
          .then((colors) => {
            const mostDominantColor = colors[0];
            setArtistColor(mostDominantColor.hex);
          })
          .catch((error) => {
            console.error("Error extracting colors:", error);
          });
      } catch (error) {
        console.error("Error fetching currently playing track:", error);
      }
    };

    const interval = setInterval(fetchCurrentlyPlaying, 5000); // Refresh every 5 seconds
    fetchCurrentlyPlaying(); // Fetch immediately when component mounts

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

  useEffect(() => {
    if (artistRef.current && titleRef.current && nameArtistRef.current) {
      if (artistRef.current.offsetWidth > nameArtistRef.current.offsetWidth) {
        artistRef.current.style.animation = "scrollText 10s linear infinite";
      } else {
        artistRef.current.style.animation = "none";
      }

      if (titleRef.current.offsetWidth > nameArtistRef.current.offsetWidth) {
        titleRef.current.style.animation = "scrollText 10s linear infinite";
      } else {
        titleRef.current.style.animation = "none";
      }
    }
  }, [currentlyPlaying]);

  return (
    <div className="player">
      {currentlyPlaying && currentlyPlaying.is_playing ? (
        <>
          <img
            src={currentlyPlaying.item.album.images[0].url}
            alt="Album Artwork"
          />
          <div className="name-artists" ref={nameArtistRef}>
            <div className="artist" ref={artistRef} style={getArtistStyle()}>
              {currentlyPlaying.item.artists
                .map((artist) => artist.name)
                .join(", ")}
            </div>
            <div className="title" ref={titleRef}>
              {currentlyPlaying.item.name}
            </div>
          </div>
        </>
      ) : (
        <></>
      )}
    </div>
  );
}

export default App;
