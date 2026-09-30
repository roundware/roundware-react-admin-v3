/**
 * Where a map overlay image sits on the ground.
 *
 * TWIN: roundware-web-app-v3/src/utils/mapOverlayGeometry.ts, which is what
 * participants see. This copy lets the admin's map editor draw the overlay with
 * the same maths, so what an author places is exactly what appears in the app.
 * Change one, change both — the admin cannot import across repos.
 *
 * The overlay is described by a center, a width in meters, a rotation and an
 * opacity. Height comes from the image's own aspect ratio, so the image fills
 * its box exactly and is never letterboxed.
 *
 * This replaced a `size` in *degrees*, applied to both latitude and longitude.
 * A degree of longitude shrinks with cos(latitude) while a degree of latitude
 * does not, so that "square" was about 35% taller than wide in Boston and
 * the image sat letterboxed inside it — the numbers an author typed did not
 * describe what they saw.
 */

/** Meters per degree of latitude — close enough everywhere at overlay scale. */
const METRES_PER_DEGREE_LAT = 111_320;

export interface MapOverlayPlacement {
	/** Center of the image. */
	center: { lat: number; lng: number };
	/** Width of the image on the ground, before rotation. */
	widthMeters: number;
	/** Clockwise, in degrees, about the center. */
	rotation: number;
	/** 0–1. */
	opacity: number;
}

/**
 * The unrotated rectangle the image occupies, as south-west / north-east
 * corners. `aspect` is height ÷ width of the image; pass 1 until it has loaded.
 */
export function overlayBounds(
	center: { lat: number; lng: number },
	widthMeters: number,
	aspect: number
): { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } } {
	const heightMeters = widthMeters * (aspect > 0 ? aspect : 1);
	const dLat = heightMeters / METRES_PER_DEGREE_LAT;
	const cosLat = Math.max(Math.cos((center.lat * Math.PI) / 180), 1e-6);
	const dLng = widthMeters / (METRES_PER_DEGREE_LAT * cosLat);
	return {
		sw: { lat: center.lat - dLat / 2, lng: center.lng - dLng / 2 },
		ne: { lat: center.lat + dLat / 2, lng: center.lng + dLng / 2 },
	};
}

/**
 * Build a Google Maps OverlayView that draws `src` at `placement`.
 *
 * A factory rather than a module-level class because `google.maps` only
 * exists once the Maps script has loaded. The image is an <img>, so it works
 * for SVG, PNG, JPEG and WebP alike, and needs no CORS — the old overlay
 * fetched the file as SVG text and parsed it, which failed for every raster
 * upload.
 */
export function createImageOverlay(src: string, placement: MapOverlayPlacement) {
	class ImageOverlay extends google.maps.OverlayView {
		private div: HTMLDivElement | null = null;
		private img: HTMLImageElement | null = null;
		private placement: MapOverlayPlacement;

		constructor(p: MapOverlayPlacement) {
			super();
			this.placement = p;
		}

		/** Move, resize, rotate or fade without rebuilding the overlay. */
		setPlacement(p: MapOverlayPlacement) {
			this.placement = p;
			if (this.img) this.img.style.opacity = String(p.opacity);
			this.draw();
		}

		onAdd(): void {
			const div = document.createElement('div');
			div.style.position = 'absolute';
			div.style.pointerEvents = 'none';
			div.style.transformOrigin = '50% 50%';

			const img = document.createElement('img');
			img.src = src;
			img.alt = '';
			img.draggable = false;
			img.style.width = '100%';
			img.style.height = '100%';
			img.style.display = 'block';
			img.style.opacity = String(this.placement.opacity);
			// Height depends on the image's aspect ratio, known only once loaded.
			img.onload = () => this.draw();
			div.appendChild(img);

			this.div = div;
			this.img = img;
			this.getPanes()?.overlayLayer.appendChild(div);
		}

		draw(): void {
			const projection = this.getProjection();
			if (!this.div || !this.img || !projection) return;
			const { naturalWidth: w, naturalHeight: h } = this.img;
			const aspect = w > 0 && h > 0 ? h / w : 1;
			const { sw, ne } = overlayBounds(this.placement.center, this.placement.widthMeters, aspect);
			const swPx = projection.fromLatLngToDivPixel(new google.maps.LatLng(sw.lat, sw.lng));
			const nePx = projection.fromLatLngToDivPixel(new google.maps.LatLng(ne.lat, ne.lng));
			if (!swPx || !nePx) return;
			this.div.style.left = `${swPx.x}px`;
			this.div.style.top = `${nePx.y}px`;
			this.div.style.width = `${nePx.x - swPx.x}px`;
			this.div.style.height = `${swPx.y - nePx.y}px`;
			this.div.style.transform = `rotate(${this.placement.rotation}deg)`;
		}

		onRemove(): void {
			this.div?.remove();
			this.div = null;
			this.img = null;
		}
	}
	return new ImageOverlay(placement);
}
