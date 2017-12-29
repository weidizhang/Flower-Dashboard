/*
 * @author Weidi Zhang
 */

class LocalStorage {
    setObject(key, object) {
        localStorage.setItem(key, JSON.stringify(object));
    }

    getObject(key) {
        return JSON.parse(localStorage.getItem(key));
    }

    setPortfolioData(data) {
        this.setObject('portfolioData', data);
    }

    getPortfolioData() {
        return this.getObject('portfolioData');
    }

    setSettingsData(data) {
        this.setObject('settingsData', data);
    }

    getSettingsData() {
        return this.getObject('settingsData');
    }
}