import { useEffect, useRef, useState } from 'react';

function cleanQuantity(value) {
    return String(value || '').replace(/[^\d]/g, '').slice(0, 6);
}

function getCurrentQty(value) {
    return Number(value || 0);
}

function adjustQuantity(value, delta) {
    const currentQty = getCurrentQty(value);
    const nextQty = Math.max(0, currentQty + delta);

    return String(nextQty);
}

export function QuantityRow({ denom, value, onChange }) {
    const [flashDelta, setFlashDelta] = useState(0);
    const flashTimerRef = useRef(null);

    useEffect(() => {
        return () => {
            clearTimeout(flashTimerRef.current);
        };
    }, []);

    function showFlashDelta(delta) {
        setFlashDelta((current) => current + delta);

        clearTimeout(flashTimerRef.current);

        flashTimerRef.current = setTimeout(() => {
            setFlashDelta(0);
        }, 2000);
    }

    function handleStep(delta) {
        const currentQty = getCurrentQty(value);

        if (delta < 0 && currentQty <= 0) return;

        onChange(denom, adjustQuantity(value, delta));
        showFlashDelta(delta);
    }

    function handleInputChange(event) {
        onChange(denom, cleanQuantity(event.target.value));
    }

    function handleInputFocus(event) {
        requestAnimationFrame(() => event.target.select());
    }

    function handleInputKeyDown(event) {
        const allowedKeys = [
            'Backspace',
            'Delete',
            'ArrowLeft',
            'ArrowRight',
            'Tab',
            'Home',
            'End'
        ];

        if (allowedKeys.includes(event.key)) return;

        if (!/^\d$/.test(event.key)) {
            event.preventDefault();
        }
    }

    return (
        <div className="qty-cell-inner">
            <div className="qty-control">
                <button
                    tabIndex={-1}
                    className="qty-step-btn"
                    type="button"
                    onClick={() => handleStep(-1)}
                    aria-label={`Decrease ${denom} quantity`}
                >
                    <span className="qty-step-btn-symbol">-</span>
                </button>

                <input
                    className="qty-input"
                    type="text"
                    inputMode="numeric"
                    value={value}
                    placeholder="0"
                    onFocus={handleInputFocus}
                    onChange={handleInputChange}
                    onKeyDown={handleInputKeyDown}
                />

                <button
                    tabIndex={-1}
                    className="qty-step-btn"
                    type="button"
                    onClick={() => handleStep(1)}
                    aria-label={`Increase ${denom} quantity`}
                >
                    <span className="qty-step-btn-symbol">+</span>
                </button>
            </div>

            <span
                className={`qty-flash ${flashDelta > 0 ? 'qty-flash-positive' : flashDelta < 0 ? 'qty-flash-negative' : ''
                    }`}
            >
                {flashDelta ? `${flashDelta > 0 ? '+' : ''}${flashDelta}` : ''}
            </span>
        </div>
    );
}