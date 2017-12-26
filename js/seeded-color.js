/*
 * @author Weidi Zhang
 */

class SeededColor {
    constructor(asset) {
        this.seed = this.convertToInt(asset);
    }

    convertToInt(asset) {
        let charCodeSum = 0;
        for (let i = 0; i < asset.length; i++) {
            charCodeSum += asset.charCodeAt(i);
        }

        return charCodeSum;
    }

    red() {
        return this.randomColorNumber(this.seed);
    }

    green() {
        return this.randomColorNumber(this.seed / 3);
    }

    blue() {
        return this.randomColorNumber(this.seed / 7);
    }

    // Adapted from Antti Sykari: https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
    randomColorNumber(seed) {
        let random = Math.sin(seed) * 10000;        
        random -= Math.floor(random);
        random *= 255;

        return Math.round(random);
    }
}