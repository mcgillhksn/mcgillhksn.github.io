import sharp from "sharp";

// Back up only occluded cut edges, never the visible skyline silhouette. A few
// source pixels of hidden padding prevent hairline seams after resampling and
// independent movement. Supplied repair PNGs themselves remain untouched.
export async function prepareSkylineLayers(files) {
    const layers = await Promise.all(files.map(async file => {
        const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        return { data, width: info.width, height: info.height };
    }));
    const foreground = new Uint8Array(layers[0].width * layers[0].height);
    const offsets = [];
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
        if (dx || dy) offsets.push({ dx, dy, distance: dx * dx + dy * dy });
    }
    offsets.sort((a, b) => a.distance - b.distance);
    const prepared = [];
    for (const layer of layers) {
        const { data, width, height } = layer;
        const output = Buffer.from(data);
        const expanded = await sharp(data, { raw: { width, height, channels: 4 } })
            .extractChannel("alpha").negate().dilate(3).negate().raw().toBuffer();
        for (let pixel = 0; pixel < foreground.length; pixel++) {
            if (!foreground[pixel] || data[pixel * 4 + 3] === 255 || expanded[pixel] < 254) continue;
            const x = pixel % width, y = Math.floor(pixel / width);
            for (const { dx, dy } of offsets) {
                const nx = x + dx, ny = y + dy;
                if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
                const source = (ny * width + nx) * 4;
                if (data[source + 3] < 254) continue;
                // Composite the original edge over an opaque matching backing.
                const alpha = data[pixel * 4 + 3] / 255;
                for (let channel = 0; channel < 3; channel++) output[pixel * 4 + channel] = Math.round(data[pixel * 4 + channel] * alpha + data[source + channel] * (1 - alpha));
                output[pixel * 4 + 3] = 255;
                break;
            }
        }
        prepared.push(await sharp(output, { raw: { width, height, channels: 4 } }).png().toBuffer());
        for (let pixel = 0; pixel < foreground.length; pixel++) if (data[pixel * 4 + 3] === 255) foreground[pixel] = 1;
    }
    return prepared;
}
