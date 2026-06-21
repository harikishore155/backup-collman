import { useState } from "react";
import { Skeleton } from "@radix-ui/themes";
import { BiSolidUserCircle } from "react-icons/bi";
import "./ImageWithFallback.scss";

const ImageWithFallback = ({
    src,
    alt = "",
    fallbackIcon = <BiSolidUserCircle />,
    fallbackImg,
    className = "",
}) => {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    if (!src) {
        return (
            <>
                {fallbackIcon}
            </>
        );
    }

    return (
        < >
            {!loaded && !error && (
                <Skeleton variant="rectangular" />
            )}

            {!error && (
                <img
                    src={src}
                    alt={alt}
                    className={className}
                    style={{
                        objectFit: "cover",
                        display: loaded ? "block" : "none",
                    }}
                    onLoad={() => setLoaded(true)}
                    onError={() => setError(true)}
                />
            )}

            {error && (
                fallbackImg ? (
                    <img
                        src={fallbackImg}
                        alt="fallback"
                        style={{ width: "100%", height: "100%" }}
                    />
                ) : (
                    <>
                        {fallbackIcon}
                    </>
                )
            )}
        </>
    )
}

export default ImageWithFallback;