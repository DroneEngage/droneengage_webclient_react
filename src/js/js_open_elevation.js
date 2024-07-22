

export class OpenElevationAPI {
    async getElevation(latitude, longitude, obj) {
      try {
        const response = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${latitude},${longitude}`);
        const data = await response.json();
        return data.results[0].elevation;
      } catch (error) {
        console.error('Error fetching elevation data:', error);
        throw error;
      }
    }
  }
  

