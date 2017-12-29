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
        const data = this.getObject('portfolioData');
        if (data === null) {
            return {};
        }

        return data;
    }

    setSettingsData(data) {
        this.setObject('settingsData', data);
    }

    getSettingsData() {
        const data = this.getObject('settingsData');
        if (data === null) {
            const defaultData = {
                price_update_interval: 60
            };
            this.setSettingsData(defaultData);
            return defaultData;
        }

        return data;
    }
}