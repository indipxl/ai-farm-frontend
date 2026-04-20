import React, { useState } from 'react';

export default function AnnotatedImage({ src, boxes = [] }) {
    const [dim, setDim] = useState({ w: 1, h: 1 });

    return (
        <div style={{ position: 'relative', width: '100%', borderRadius: '8px', overflow: 'hidden', marginBottom: '14px' }}>
            <img 
                src={src} 
                style={{ width: '100%', display: 'block' }} 
                alt="Scan Result" 
                onLoad={(e) => {
                    if (e.target.naturalWidth > 0) {
                        setDim({ w: e.target.naturalWidth, h: e.target.naturalHeight });
                    }
                }}
            />
            {boxes.map((box, i) => {
                const [x1, y1, x2, y2] = box.box;
                const left = (x1 / dim.w) * 100;
                const top = (y1 / dim.h) * 100;
                const width = ((x2 - x1) / dim.w) * 100;
                const height = ((y2 - y1) / dim.h) * 100;
                
                return (
                    <div key={i} style={{
                        position: 'absolute',
                        left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`,
                        border: '2px solid var(--red)',
                        boxSizing: 'border-box',
                        pointerEvents: 'none'
                    }}>
                        <div style={{
                            position: 'absolute', top: 0, left: 0, background: 'var(--red)', color: 'white',
                            fontSize: '0.65rem', padding: '2px 4px', whiteSpace: 'nowrap',
                            borderBottomRightRadius: '4px', fontWeight: 'bold'
                        }}>
                            {box.class} {Math.round(box.confidence * 100)}%
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
