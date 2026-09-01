import { useCallback, useEffect, useRef, useState } from 'react';
import { apiUrl } from '../../lib/api';
import {
    DEFAULT_FIT,
    DEFAULT_POSITION,
    FRAME_PRESETS,
    formatPosition,
    framingStyle,
    normalizeFit,
    parsePosition
} from '../../lib/imageFraming';

/**
 * The admin's picture control: upload, then see and fix the crop.
 *
 * The console used to show an uploaded photo in a 56 pixel square, which is not
 * a shape that appears anywhere on the site. A portrait that looked fine there
 * arrived on a phone with the top of the head cut off, and nothing in the
 * console could have predicted it. This renders the picture at full width, then
 * beside it every frame the site will actually put it in -- phone card, desktop
 * card, credential badge -- computed from the same two values the public page
 * reads.
 *
 * Dragging on the large preview moves the focal point, so the part of the photo
 * that matters is the part kept when a frame has to crop. "Fit whole image"
 * switches to `contain` for pictures that must not be cropped at all.
 */

const PRESET_POSITIONS = [
    { label: 'Face / top', value: '50% 20%' },
    { label: 'Centre', value: '50% 50%' },
    { label: 'Lower', value: '50% 75%' }
];

export default function ImageField({
    label = 'Image',
    value = '',
    fit = DEFAULT_FIT,
    position = DEFAULT_POSITION,
    onChange,
    onUpload,
    folder = '/asterix',
    frames = 'member',
    placeholder = 'Paste an image URL, or upload a file',
    compact = false
}) {
    const framePresets = Array.isArray(frames) ? frames : (FRAME_PRESETS[frames] || FRAME_PRESETS.member);
    const resolved = apiUrl(value);
    const [isDragging, setIsDragging] = useState(false);
    /* The URL that failed to load, rather than a boolean. A boolean needed an
       effect to clear it whenever the URL changed, which meant a replaced photo
       rendered once as broken before the reset landed. */
    const [failedUrl, setFailedUrl] = useState(null);
    const failed = Boolean(resolved) && failedUrl === resolved;
    const stageRef = useRef(null);

    const patch = (fields) => onChange?.(fields);

    const pointToPosition = useCallback((clientX, clientY) => {
        const node = stageRef.current;
        if (!node) return;
        const rect = node.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        const x = ((clientX - rect.left) / rect.width) * 100;
        const y = ((clientY - rect.top) / rect.height) * 100;
        patch({ position: formatPosition(x, y) });
    }, [onChange]); // eslint-disable-line react-hooks/exhaustive-deps

    /* Dragging is tracked on the window rather than on the image so the focal
       point keeps following a pointer that leaves the preview mid-drag, which is
       the normal way of pushing a crop right to an edge. */
    useEffect(() => {
        if (!isDragging) return undefined;
        const move = (e) => {
            e.preventDefault();
            pointToPosition(e.clientX, e.clientY);
        };
        const stop = () => setIsDragging(false);
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', stop);
        window.addEventListener('pointercancel', stop);
        return () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', stop);
            window.removeEventListener('pointercancel', stop);
        };
    }, [isDragging, pointToPosition]);

    const focal = parsePosition(position);
    const style = framingStyle(fit, position);
    const hasImage = Boolean(resolved) && !failed;

    const nudge = (dx, dy) => patch({ position: formatPosition(focal.x + dx, focal.y + dy) });

    return (
        <div className="bg-white border-2 border-slate-900 p-3 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-700">
                    {label}
                </span>
                <div className="flex items-center gap-1.5">
                    <label className="press press-flat px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white border-2 border-slate-900 font-mono text-[10px] font-black uppercase cursor-pointer">
                        <span>{value ? 'Replace file' : 'Upload file'}</span>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => onUpload?.(e, (url) => patch({ url }), folder)}
                        />
                    </label>
                    {value && (
                        <button
                            type="button"
                            onClick={() => patch({ url: '' })}
                            className="press press-flat px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border-2 border-slate-900 text-rose-700 font-mono text-[10px] font-black uppercase cursor-pointer"
                        >
                            Remove
                        </button>
                    )}
                </div>
            </div>

            <input
                type="text"
                value={value || ''}
                onChange={(e) => patch({ url: e.target.value })}
                placeholder={placeholder}
                className="w-full font-mono text-[11px] border-2 border-slate-300 px-2 py-1.5 bg-white focus:outline-none focus:border-slate-900"
            />

            {!hasImage && (
                <div className="h-28 border-2 border-dashed border-slate-400 bg-slate-50 flex flex-col items-center justify-center gap-1 text-center">
                    <span className="font-mono text-[10px] font-black uppercase text-slate-500">
                        {failed ? 'That link did not load' : 'No image yet'}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                        Upload one to set its crop
                    </span>
                </div>
            )}

            {hasImage && (
                <div className={`grid gap-3 ${compact ? '' : 'lg:grid-cols-[minmax(0,1fr)_auto]'}`}>

                    {/* Focal point stage: the whole picture, uncropped, with the
                        chosen focal point marked. */}
                    <div className="space-y-2 min-w-0">
                        <div
                            ref={stageRef}
                            onPointerDown={(e) => {
                                e.preventDefault();
                                setIsDragging(true);
                                pointToPosition(e.clientX, e.clientY);
                            }}
                            className="relative w-full max-h-64 bg-[repeating-conic-gradient(#e2e8f0_0%_25%,#f8fafc_0%_50%)] bg-[length:16px_16px] border-2 border-slate-900 overflow-hidden cursor-crosshair touch-none select-none"
                        >
                            <img
                                src={resolved}
                                alt="Uploaded original"
                                draggable={false}
                                onError={() => setFailedUrl(resolved)}
                                className="block w-full max-h-64 object-contain pointer-events-none"
                            />
                            <span
                                aria-hidden="true"
                                className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 border-white bg-sky-500/70 shadow-[0_0_0_2px_#0f172a] pointer-events-none"
                                style={{ left: `${focal.x}%`, top: `${focal.y}%` }}
                            />
                        </div>

                        <p className="font-mono text-[10px] font-bold text-slate-500 leading-relaxed">
                            Drag on the picture to choose what stays in shot when a frame has to crop.
                            The previews on the right are the real frames the site uses.
                        </p>

                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-mono text-[10px] font-black uppercase text-slate-500">Fill mode:</span>
                            <button
                                type="button"
                                onClick={() => patch({ fit: 'cover' })}
                                className={`press press-flat px-2 py-1 border-2 border-slate-900 font-mono text-[10px] font-black uppercase cursor-pointer ${
                                    normalizeFit(fit) === 'cover' ? 'bg-sky-500 text-white' : 'bg-white text-slate-900'
                                }`}
                            >
                                Fill frame
                            </button>
                            <button
                                type="button"
                                onClick={() => patch({ fit: 'contain' })}
                                className={`press press-flat px-2 py-1 border-2 border-slate-900 font-mono text-[10px] font-black uppercase cursor-pointer ${
                                    normalizeFit(fit) === 'contain' ? 'bg-sky-500 text-white' : 'bg-white text-slate-900'
                                }`}
                                title="Never crops. The whole picture is shown and the frame is letterboxed."
                            >
                                Fit whole image
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-mono text-[10px] font-black uppercase text-slate-500">Focus:</span>
                            {PRESET_POSITIONS.map((p) => (
                                <button
                                    key={p.value}
                                    type="button"
                                    onClick={() => patch({ position: p.value })}
                                    className={`press press-flat px-2 py-1 border-2 border-slate-900 font-mono text-[10px] font-black uppercase cursor-pointer ${
                                        formatPosition(focal.x, focal.y) === p.value
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-white text-slate-900'
                                    }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                            <span className="inline-flex items-center gap-0.5 ml-1">
                                {[['←', -4, 0], ['→', 4, 0], ['↑', 0, -4], ['↓', 0, 4]].map(([sym, dx, dy]) => (
                                    <button
                                        key={sym}
                                        type="button"
                                        onClick={() => nudge(dx, dy)}
                                        aria-label={`Nudge focal point ${sym}`}
                                        className="press press-flat w-6 h-6 bg-white hover:bg-slate-100 border-2 border-slate-900 font-mono text-[10px] font-black cursor-pointer"
                                    >
                                        {sym}
                                    </button>
                                ))}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                                {formatPosition(focal.x, focal.y)}
                            </span>
                        </div>
                    </div>

                    {/* Every frame the picture will be shown in, at its real ratio. */}
                    <div className="flex lg:flex-col gap-3 flex-wrap">
                        {framePresets.map((frame) => (
                            <div key={frame.id} className="shrink-0">
                                <span className="font-mono text-[9px] font-black uppercase text-slate-500 block mb-1">
                                    {frame.label}
                                </span>
                                <div
                                    className="border-2 border-slate-900 bg-slate-950 overflow-hidden"
                                    style={{ width: frame.width, aspectRatio: frame.ratio }}
                                >
                                    <img
                                        src={resolved}
                                        alt={`${frame.label} preview`}
                                        draggable={false}
                                        className="w-full h-full"
                                        style={style}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
