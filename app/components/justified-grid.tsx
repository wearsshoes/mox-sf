"use client";

import { useEffect, useState, useRef } from "react";

interface MasonryProps {
  images: string[];
  targetRowHeight?: number;
}

export default function Masonry({
  images,
  targetRowHeight = 300,
}: MasonryProps) {
  const [imageRatios, setImageRatios] = useState<number[]>([]);
  const [containerWidth, setContainerWidth] = useState(1000);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateContainerWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.getBoundingClientRect().width);
      }
    };

    updateContainerWidth();
    window.addEventListener("resize", updateContainerWidth);
    return () => window.removeEventListener("resize", updateContainerWidth);
  }, []);

  useEffect(() => {
    const loadImages = async () => {
      const ratios = await Promise.all(
        images.map(
          (src) =>
            new Promise<number>((resolve) => {
              const img = new Image();
              img.onload = () => resolve(img.width / img.height);
              img.src = src;
            })
        )
      );
      setImageRatios(ratios);
    };

    loadImages();
  }, [images]);

  const getRows = () => {
    const rows: { src: string; width: number; height: number }[][] = [];

    // Process images in groups of 3
    for (let i = 0; i < images.length; i += 3) {
      const rowImages = images.slice(i, i + 3);
      const rowRatios = imageRatios.slice(i, i + 3);

      // Skip if we don't have ratio data yet
      if (rowRatios.some((r) => !r)) continue;

      // Calculate row layout
      const spacing = 16; // 4 units of gap (4 * 4px = 16px)
      const availableWidth = containerWidth - spacing * 2; // Account for gaps

      // Initial widths at target height
      const initialWidths = rowRatios.map((ratio) => targetRowHeight * ratio);
      const totalWidth = initialWidths.reduce((sum, w) => sum + w, 0);

      // Scale factor to fit container
      const scale = availableWidth / totalWidth;
      const rowHeight = targetRowHeight * scale;

      // Create row with calculated dimensions
      rows.push(
        rowImages.map((src, j) => ({
          src,
          width: initialWidths[j] * scale,
          height: rowHeight,
        }))
      );
    }

    console.log("rows measured at", rows);

    return rows;
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-2">
      {getRows().map((row, i) => (
        <div key={i} className="flex gap-2">
          {row.map(({ src, width, height }, j) => (
            <img
              key={j}
              src={src}
              alt=""
              style={{ width: `${width}px`, height: `${height}px` }}
              className="object-cover"
              loading="lazy"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
