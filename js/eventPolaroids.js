const siteEventPolaroids = (function setupEventPolaroids() {
    // Deliberate, repeatable offsets rather than a new random pile on every visit.
    const scatter = [
        { angle: -8, x: 0, y: 0.06 },
        { angle: 5, x: -0.04, y: 0.23 },
        { angle: -5, x: -0.03, y: 0 },
        { angle: 7, x: 0.2, y: 0.12 },
        { angle: -9, x: 0.08, y: 0.25 },
        { angle: 6, x: -0.1, y: 0.06 }
    ];
    const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

    function create(board) {
        const cards = [...board.querySelectorAll(".event-card")];
        if (!cards.length) return null;
        const status = document.getElementById("polaroid-status");
        const positions = new Map();
        let boardWidth = 0;
        let boardHeight = 0;
        let topCard = cards.length;
        let drag = null;
        let suppressedClick = null;

        function raise(card) {
            card.style.zIndex = ++topCard;
        }

        function bounds(position) {
            return {
                minX: position.edgeX + 8,
                maxX: boardWidth - position.width - position.edgeX - 8,
                minY: position.edgeY + 12,
                maxY: boardHeight - position.height - position.edgeY - 12
            };
        }

        function place(card, x, y, moved = false) {
            const position = positions.get(card);
            const limits = bounds(position);
            position.x = clamp(x, limits.minX, limits.maxX);
            position.y = clamp(y, limits.minY, limits.maxY);
            if (moved) {
                position.moved = true;
                position.relativeX = (position.x - limits.minX) / Math.max(1, limits.maxX - limits.minX);
                position.relativeY = (position.y - limits.minY) / Math.max(1, limits.maxY - limits.minY);
            }
            card.style.setProperty("--photo-x", `${position.x}px`);
            card.style.setProperty("--photo-y", `${position.y}px`);
        }

        function layout(restore = false) {
            finishDrag(true);
            boardWidth = board.clientWidth;
            if (!boardWidth) return;
            const visible = cards.filter(card => !card.hidden);
            const availableColumns = boardWidth >= 960 ? 3 : boardWidth >= 560 ? 2 : 1;
            const columns = Math.min(availableColumns, visible.length || 1);
            const padding = Math.min(44, boardWidth * 0.1);
            const width = Math.min(316, (boardWidth - padding * 2) / (availableColumns + (availableColumns === 1 ? 0.06 : 0.35)));
            const height = width * 107.52 / 88.47;
            const stepX = availableColumns === 1 ? 0 : (boardWidth - padding * 2 - width) / (availableColumns - 1);
            const startX = (boardWidth - width - (columns - 1) * stepX) / 2;
            const stagger = columns === 1 ? 0.25 : columns === 2 ? 0.65 : 1;
            boardHeight = 0;
            visible.forEach((card, index) => {
                const pattern = scatter[index % scatter.length];
                const angle = columns === 1 ? pattern.angle * 0.6 : pattern.angle;
                const radians = Math.abs(angle) * Math.PI / 180;
                const previous = positions.get(card);
                const position = {
                    width,
                    height,
                    edgeX: (width * Math.cos(radians) + height * Math.sin(radians) - width) / 2,
                    edgeY: (height * Math.cos(radians) + width * Math.sin(radians) - height) / 2,
                    x: startX + index % columns * stepX + pattern.x * width,
                    y: padding + Math.floor(index / columns) * height * (columns === 1 ? 1.14 : 1.12) + pattern.y * height * stagger,
                    moved: !restore && previous?.moved,
                    relativeX: previous?.relativeX,
                    relativeY: previous?.relativeY
                };
                positions.set(card, position);
                card.style.setProperty("--photo-angle", `${angle}deg`);
                if (restore) card.style.zIndex = index + 1;
                boardHeight = Math.max(boardHeight, position.y + height + position.edgeY + padding);
            });
            board.style.setProperty("--polaroid-width", `${width}px`);
            board.style.height = `${boardHeight}px`;
            visible.forEach(card => {
                const position = positions.get(card);
                const limits = bounds(position);
                place(card,
                    position.moved ? limits.minX + position.relativeX * (limits.maxX - limits.minX) : position.x,
                    position.moved ? limits.minY + position.relativeY * (limits.maxY - limits.minY) : position.y);
            });
            board.classList.add("is-scattered");
            if (restore) topCard = cards.length;
        }

        function finishDrag(cancelled = false) {
            if (!drag) return;
            const previous = drag;
            drag = null;
            previous.card.classList.remove("is-dragging");
            if (previous.card.hasPointerCapture(previous.pointerId)) previous.card.releasePointerCapture(previous.pointerId);
            if (!previous.moved) return;
            suppressedClick = { card: previous.card, until: performance.now() + 500 };
            if (cancelled) {
                positions.set(previous.card, previous.original);
                place(previous.card, previous.original.x, previous.original.y);
            } else {
                status.textContent = `${previous.card.querySelector("h3").textContent.trim()} moved.`;
            }
        }

        board.addEventListener("pointerdown", event => {
            const card = event.target.closest(".event-card");
            if (!card || card.hidden || drag || event.button !== 0 || !event.isPrimary) return;
            // The photo remains a native scrolling surface on touchscreens.
            if (event.pointerType === "touch" && !event.target.closest(".event-card-body")) return;
            suppressedClick = null;
            raise(card);
            drag = {
                card,
                pointerId: event.pointerId,
                startX: event.pageX,
                startY: event.pageY,
                original: { ...positions.get(card) },
                moved: false
            };
        });

        window.addEventListener("pointermove", event => {
            if (!drag || event.pointerId !== drag.pointerId) return;
            const dx = event.pageX - drag.startX;
            const dy = event.pageY - drag.startY;
            if (!drag.moved && Math.hypot(dx, dy) < 7) return;
            if (!drag.moved) {
                drag.moved = true;
                drag.card.setPointerCapture(event.pointerId);
                drag.card.classList.add("is-dragging");
            }
            event.preventDefault();
            place(drag.card, drag.original.x + dx, drag.original.y + dy, true);
        }, { passive: false });

        window.addEventListener("pointerup", event => {
            if (event.pointerId === drag?.pointerId) finishDrag();
        });
        window.addEventListener("pointercancel", event => {
            if (event.pointerId === drag?.pointerId) finishDrag(true);
        });
        board.addEventListener("lostpointercapture", event => {
            // Touch starts with implicit capture on the caption. Only losing
            // the card's own capture should cancel a drag, not that transfer.
            if (event.target === drag?.card && event.pointerId === drag.pointerId) finishDrag(true);
        });
        window.addEventListener("blur", () => finishDrag(true));
        document.addEventListener("keydown", event => {
            if (event.key === "Escape" && drag) finishDrag(true);
        });

        board.addEventListener("click", event => {
            const card = event.target.closest(".event-card");
            if (!card) return;
            if (event.detail && suppressedClick?.card === card && performance.now() < suppressedClick.until) {
                event.preventDefault();
                event.stopImmediatePropagation();
                suppressedClick = null;
                return;
            }
        }, true);

        board.addEventListener("focusin", event => {
            const card = event.target.closest(".event-card");
            if (card) raise(card);
        });
        board.addEventListener("keydown", event => {
            if (event.altKey || event.ctrlKey || event.metaKey || drag) return;
            const card = event.target.closest(".event-card");
            const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
            if (!card || !direction) return;
            event.preventDefault();
            const position = positions.get(card);
            const step = event.shiftKey ? 32 : 10;
            raise(card);
            place(card, position.x + direction[0] * step, position.y + direction[1] * step, true);
            status.textContent = `${card.querySelector("h3").textContent.trim()} moved.`;
        });

        let resizeFrame = 0;
        const observer = new ResizeObserver(() => {
            if (Math.abs(board.clientWidth - boardWidth) <= 1 || resizeFrame) return;
            // Changing the board height inside the observer can cause a resize
            // notification loop in Safari. Apply the layout on the next frame.
            resizeFrame = requestAnimationFrame(() => {
                resizeFrame = 0;
                layout();
            });
        });
        layout(true);
        observer.observe(board);
        return { refresh: () => layout(true) };
    }

    return { create };
})();
