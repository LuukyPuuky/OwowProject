export function applyFloydSteinbergDithering(imageData: ImageData): void {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;

    // Helper to get index
    const idx = (x: number, y: number) => (y * width + x) * 4;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = idx(x, y);

            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Calculate grayscale brightness
            const oldPixel = (r + g + b) / 3;

            // Quantize to black (0) or white (255)
            const newPixel = oldPixel < 128 ? 0 : 255;

            // Set the pixel to the new value
            data[i] = newPixel;
            data[i + 1] = newPixel;
            data[i + 2] = newPixel;

            // Calculate quantization error
            const quantError = oldPixel - newPixel;

            // Distribute error to neighbors
            // Right
            if (x + 1 < width) {
                const index = idx(x + 1, y);
                const current = (data[index] + data[index + 1] + data[index + 2]) / 3;
                const newVal = Math.min(255, Math.max(0, current + quantError * (7 / 16)));
                data[index] = newVal;
                data[index + 1] = newVal;
                data[index + 2] = newVal;
            }

            // Bottom Left
            if (x - 1 >= 0 && y + 1 < height) {
                const index = idx(x - 1, y + 1);
                const current = (data[index] + data[index + 1] + data[index + 2]) / 3;
                const newVal = Math.min(255, Math.max(0, current + quantError * (3 / 16)));
                data[index] = newVal;
                data[index + 1] = newVal;
                data[index + 2] = newVal;
            }

            // Bottom
            if (y + 1 < height) {
                const index = idx(x, y + 1);
                const current = (data[index] + data[index + 1] + data[index + 2]) / 3;
                const newVal = Math.min(255, Math.max(0, current + quantError * (5 / 16)));
                data[index] = newVal;
                data[index + 1] = newVal;
                data[index + 2] = newVal;
            }

            // Bottom Right
            if (x + 1 < width && y + 1 < height) {
                const index = idx(x + 1, y + 1);
                const current = (data[index] + data[index + 1] + data[index + 2]) / 3;
                const newVal = Math.min(255, Math.max(0, current + quantError * (1 / 16)));
                data[index] = newVal;
                data[index + 1] = newVal;
                data[index + 2] = newVal;
            }
        }
    }
}
