// utils/dogApi.js
export const fetchBreedImage = async (breedName) => {
  try {
    // Convert breed name to API format
    const apiBreedName = breedName
      .toLowerCase()
      .replace(/\s+/g, '/')
      .replace(/_/g, '/');
    
    const response = await fetch(
      `https://dog.ceo/api/breed/${apiBreedName}/images/random`
    );
    const data = await response.json();
    
    if (data.status === 'success') {
      return data.message;
    }
    return 'https://via.placeholder.com/400x300?text=Dog+Image';
  } catch (error) {
    console.error('Error fetching breed image:', error);
    return 'https://via.placeholder.com/400x300?text=Dog+Image';
  }
};