import React from 'react';

import * as js_common from '../../js/js_common.js';
import { EVENTS as js_event } from '../../js/events/js_eventList.js';
import { EventBridge } from '../../js/hooks/EventBridge.jsx';
import { js_stillImageStore } from '../../js/js_stillImageStore.js';
import { js_dialogs } from '../../js/app/dialogService.js';

// Number of thumbnails shown in the gallery strip.
const CONST_GALLERY_THUMB_COUNT = 5;

/**
 * Still image gallery component — displays captured still images stored
 * in the IndexedDB still image store for the current unit. Provides
 * prev/next navigation, a 5-thumbnail strip, double-click to open the
 * full FPV viewer (with save/rotate), and a clear button.
 *
 * Subscribes to EE_stillImagesChanged via EventBridge so new images
 * arriving from de_camera refresh the gallery live.
 *
 * @param {string}  partyId   — the unit party ID to filter images by
 * @param {boolean} isCompact — mobile/compact layout flag
 */
export default class ClssStillImageGallery extends React.Component
{
    constructor(props)
    {
        super(props);
        this.state = {
            'm_galleryImages': [],   // array of { id, blob, url, timestamp, lat, lng, alt, description }
            'm_galleryIndex': 0,     // currently selected image index
            'm_galleryLoading': false,
        };

        this.fn_onStillImagesChanged = this.fn_onStillImagesChanged.bind(this);
    }

    componentDidMount()
    {
        this.fn_loadGallery();
    }

    componentWillUnmount()
    {
        this.fn_revokeGalleryUrls();
    }

    componentDidUpdate(prevProps)
    {
        // Reload when the partyId changes (different unit selected)
        if (prevProps.partyId !== this.props.partyId) {
            this.fn_loadGallery();
        }
    }

    // ── Still image gallery ──────────────────────────────────────────

    /**
     * EventBridge callback for EE_stillImagesChanged. Reloads the
     * gallery from the IndexedDB store for the current party ID.
     */
    fn_onStillImagesChanged(payload)
    {
        const partyId = this.props.partyId;
        if (partyId && payload && payload.partyId && payload.partyId !== partyId) {
            return;
        }
        this.fn_loadGallery();
    }

    /**
     * Load images for the current party ID from the IndexedDB store
     * and update the gallery state. Creates object URLs for display.
     */
    fn_loadGallery()
    {
        const partyId = this.props.partyId;
        if (!partyId) return;

        this.setState({ m_galleryLoading: true });

        js_stillImageStore.fn_getImages(partyId).then((records) => {
            this.fn_revokeGalleryUrls();

            const images = records.map((rec) => ({
                id: rec.id,
                blob: rec.blob,
                url: URL.createObjectURL(rec.blob),
                timestamp: rec.timestamp,
                lat: rec.lat,
                lng: rec.lng,
                alt: rec.alt,
                description: rec.description,
            }));

            // If new images were added, jump to the latest one
            const prevCount = this.state.m_galleryImages.length;
            const newIndex = (images.length > prevCount && images.length > 0)
                ? images.length - 1
                : Math.min(this.state.m_galleryIndex, Math.max(0, images.length - 1));

            this.setState({
                m_galleryImages: images,
                m_galleryIndex: newIndex,
                m_galleryLoading: false,
            });
        }).catch((e) => {
            js_common.fn_console_log('Gallery load error: ' + e);
            this.setState({ m_galleryLoading: false });
        });
    }

    /**
     * Revoke all object URLs currently held in the gallery state.
     */
    fn_revokeGalleryUrls()
    {
        for (const img of this.state.m_galleryImages) {
            if (img.url) {
                URL.revokeObjectURL(img.url);
            }
        }
    }

    /**
     * Navigate to the previous image in the gallery.
     */
    fn_galleryPrev()
    {
        if (this.state.m_galleryImages.length === 0) return;
        this.setState((s) => ({
            m_galleryIndex: (s.m_galleryIndex - 1 + s.m_galleryImages.length) % s.m_galleryImages.length,
        }));
    }

    /**
     * Navigate to the next image in the gallery.
     */
    fn_galleryNext()
    {
        if (this.state.m_galleryImages.length === 0) return;
        this.setState((s) => ({
            m_galleryIndex: (s.m_galleryIndex + 1) % s.m_galleryImages.length,
        }));
    }

    /**
     * Select a specific image by index.
     */
    fn_gallerySelect(index)
    {
        if (index >= 0 && index < this.state.m_galleryImages.length) {
            this.setState({ m_galleryIndex: index });
        }
    }

    /**
     * Clear all stored images for the current unit from IndexedDB.
     */
    fn_galleryClear()
    {
        const partyId = this.props.partyId;
        if (!partyId) return;

        js_stillImageStore.fn_clearImages(partyId).then(() => {
            this.fn_revokeGalleryUrls();
            this.setState({
                m_galleryImages: [],
                m_galleryIndex: 0,
            });
        }).catch((e) => {
            js_common.fn_console_log('Gallery clear error: ' + e);
        });
    }

    /**
     * Compute the thumbnail window: CONST_GALLERY_THUMB_COUNT thumbnails
     * centered on the current index, clamped to the array bounds.
     * @returns {{start: number, end: number, thumbs: Array, offset: number}}
     */
    fn_getThumbWindow()
    {
        const images = this.state.m_galleryImages;
        const current = this.state.m_galleryIndex;
        const count = images.length;
        if (count === 0) return { start: 0, end: 0, thumbs: [], offset: 0 };

        const half = Math.floor(CONST_GALLERY_THUMB_COUNT / 2);
        let start = current - half;
        let end = start + CONST_GALLERY_THUMB_COUNT;

        // Clamp to bounds
        if (start < 0) { end -= start; start = 0; }
        if (end > count) { start -= (end - count); end = count; }
        if (start < 0) start = 0;

        const thumbs = [];
        for (let i = start; i < end; i++) {
            thumbs.push({ index: i, image: images[i] });
        }
        return { start, end, thumbs, offset: start };
    }

    /**
     * Open a gallery image in the FPV image dialog (full viewer with
     * save / fit / rotate).  Called on double-click of the main image.
     * Converts the blob to a data URL so the image survives this
     * component unmounting (the dialog service replaces the active
     * dialog, which unmounts this component and revokes object URLs).
     */
    fn_openImageInFpv(image)
    {
        if (!image || !image.blob) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            js_dialogs.fn_showFpv({
                image_src: e.target.result,
                party_id: this.props.partyId,
            });
        };
        reader.readAsDataURL(image.blob);
    }

    render()
    {
        const images = this.state.m_galleryImages;
        const current = images[this.state.m_galleryIndex];
        const thumbWindow = this.fn_getThumbWindow();
        const isCompact = this.props.isCompact === true;

        if (images.length === 0) {
            return (
                <div className="text-center text-muted py-2">
                    <small>No images captured yet</small>
                </div>
            );
        }

        const mainImgStyle = {
            maxWidth: '100%',
            maxHeight: isCompact ? '40vh' : '300px',
            objectFit: 'contain',
            borderRadius: '4px',
        };

        const thumbStyle = (isActive) => ({
            width: '60px',
            height: '45px',
            objectFit: 'cover',
            cursor: 'pointer',
            border: isActive ? '2px solid #0d6efd' : '1px solid #dee2e6',
            borderRadius: '3px',
            opacity: isActive ? 1 : 0.6,
        });

        return (
            <div className="still-image-gallery">
                <EventBridge eventName={js_event.EE_stillImagesChanged} onEvent={this.fn_onStillImagesChanged} />

                {/* Main image display */}
                <div className="text-center mb-2" style={{ minHeight: '100px' }}>
                    {current && (
                        <img
                            src={current.url}
                            alt="still capture"
                            style={mainImgStyle}
                            onDoubleClick={() => this.fn_openImageInFpv(current)}
                            title="Double-click to open in image viewer"
                        />
                    )}
                </div>

                {/* Navigation: prev | thumbnails | next */}
                <div className="d-flex align-items-center justify-content-center gap-1 mb-2">
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary flex-shrink-0"
                        onClick={() => this.fn_galleryPrev()}
                        title="Previous"
                    >
                        <i className="bi bi-chevron-left" />
                    </button>

                    {/* Thumbnail strip */}
                    <div className="d-flex align-items-center gap-1 overflow-auto" style={{ maxWidth: '320px' }}>
                        {thumbWindow.thumbs.map((t) => (
                            <img
                                key={t.image.id}
                                src={t.image.url}
                                alt={'thumb ' + (t.index + 1)}
                                style={thumbStyle(t.index === this.state.m_galleryIndex)}
                                onClick={() => this.fn_gallerySelect(t.index)}
                            />
                        ))}
                    </div>

                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary flex-shrink-0"
                        onClick={() => this.fn_galleryNext()}
                        title="Next"
                    >
                        <i className="bi bi-chevron-right" />
                    </button>
                </div>

                {/* Image info + clear button */}
                <div className="d-flex align-items-center justify-content-between">
                    <small className="text-muted">
                        {this.state.m_galleryIndex + 1} / {images.length}
                    </small>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => this.fn_galleryClear()}
                        title="Clear all stored images"
                    >
                        <i className="bi bi-trash" /> Clear
                    </button>
                </div>
            </div>
        );
    }
}
