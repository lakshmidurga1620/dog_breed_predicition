// utils/breedImageHelper.js

/**
 * Comprehensive mapping of breed names to Dog CEO API format
 * Dog CEO API uses format: breed/subbreed or just breed
 * Examples: "shepherd/german", "hound/afghan", "retriever/golden"
 */
const breedApiMapping = {
  // Afghan Hound group
  'afghan-hound': 'hound/afghan',
  
  // African breeds
  'african-hunting-dog': 'african',
  
  // Terrier group
  'airedale-terrier': 'airedale',
  'american-staffordshire-terrier': 'staffordshire/american',
  'australian-terrier': 'terrier/australian',
  'bedlington-terrier': 'terrier/bedlington',
  'border-terrier': 'terrier/border',
  'boston-terrier': 'terrier/boston',
  'cairn-terrier': 'terrier/cairn',
  'dandie-dinmont-terrier': 'terrier/dandie',
  'fox-terrier': 'terrier/fox',
  'irish-terrier': 'terrier/irish',
  'jack-russell-terrier': 'terrier/russell',
  'kerry-blue-terrier': 'terrier/kerryblue',
  'lakeland-terrier': 'terrier/lakeland',
  'norfolk-terrier': 'terrier/norfolk',
  'norwich-terrier': 'terrier/norwich',
  'scottish-terrier': 'terrier/scottish',
  'sealyham-terrier': 'terrier/sealyham',
  'silky-terrier': 'terrier/silky',
  'soft-coated-wheaten-terrier': 'terrier/wheaten',
  'staffordshire-bull-terrier': 'staffordshire/bullterrier',
  'tibetan-terrier': 'terrier/tibetan',
  'toy-fox-terrier': 'terrier/toy',
  'welsh-terrier': 'terrier/welsh',
  'west-highland-white-terrier': 'terrier/westhighland',
  'yorkshire-terrier': 'terrier/yorkshire',
  
  // Swiss Mountain Dogs
  'appenzeller': 'appenzeller',
  'appenzeller-mountain-dog': 'appenzeller',
  'bernese-mountain-dog': 'mountain/bernese',
  'entlebucher-mountain-dog': 'entlebucher',
  'greater-swiss-mountain-dog': 'mountain/swiss',
  
  // Akita
  'akita': 'akita',
  
  // Australian breeds
  'australian-shepherd': 'shepherd/australian',
  'australian-cattle-dog': 'cattledog/australian',
  
  // Basenji
  'basenji': 'basenji',
  
  // Hound group
  'basset-hound': 'hound/basset',
  'bloodhound': 'hound/blood',
  'bluetick-coonhound': 'hound/walker',
  'coonhound': 'coonhound',
  'dachshund': 'dachshund',
  'english-foxhound': 'hound/english',
  'greyhound': 'greyhound',
  'italian-greyhound': 'greyhound/italian',
  'ibizan-hound': 'hound/ibizan',
  'otterhound': 'otterhound',
  'pharaoh-hound': 'hound/walker',
  'plott-hound': 'hound/plott',
  'redbone-coonhound': 'redbone',
  'rhodesian-ridgeback': 'ridgeback/rhodesian',
  'saluki': 'saluki',
  'scottish-deerhound': 'deerhound/scottish',
  'whippet': 'whippet',
  
  // Beagle
  'beagle': 'beagle',
  
  // Shepherd group
  'german-shepherd': 'shepherd/german',
  'belgian-shepherd': 'sheepdog/belgian',
  'shetland-sheepdog': 'sheepdog/shetland',
  'old-english-sheepdog': 'sheepdog/english',
  'anatolian-shepherd': 'shepherd/anatolian',
  
  // Retriever group
  'golden-retriever': 'retriever/golden',
  'labrador-retriever': 'labrador',
  'chesapeake-bay-retriever': 'retriever/chesapeake',
  'curly-coated-retriever': 'retriever/curly',
  'flat-coated-retriever': 'retriever/flatcoated',
  'nova-scotia-duck-tolling-retriever': 'retriever/toller',
  
  // Collie group
  'border-collie': 'collie/border',
  'collie': 'collie',
  
  // Corgi group
  'cardigan-welsh-corgi': 'corgi/cardigan',
  'pembroke-welsh-corgi': 'pembroke',
  
  // Spaniel group
  'american-cocker-spaniel': 'spaniel/cocker',
  'cavalier-king-charles-spaniel': 'spaniel/blenheim',
  'clumber-spaniel': 'spaniel/clumber',
  'cocker-spaniel': 'spaniel/cocker',
  'english-cocker-spaniel': 'spaniel/cocker',
  'english-springer-spaniel': 'springer/english',
  'field-spaniel': 'spaniel/sussex',
  'irish-water-spaniel': 'spaniel/irish',
  'sussex-spaniel': 'spaniel/sussex',
  'welsh-springer-spaniel': 'spaniel/welsh',
  
  // Setter group
  'english-setter': 'setter/english',
  'gordon-setter': 'setter/gordon',
  'irish-red-and-white-setter': 'setter/irish',
  'irish-setter': 'setter/irish',
  
  // Pointer group
  'german-shorthaired-pointer': 'pointer/german',
  'german-wirehaired-pointer': 'pointer/germanlonghair',
  
  // Bulldog group
  'bulldog': 'bulldog/english',
  'english-bulldog': 'bulldog/english',
  'french-bulldog': 'bulldog/french',
  'american-bulldog': 'bulldog/english',
  
  // Bull Terrier group
  'bull-terrier': 'bullterrier/staffordshire',
  'staffordshire-bull-terrier': 'staffordshire/bullterrier',
  
  // Boxer
  'boxer': 'boxer',
  
  // Poodle group
  'poodle': 'poodle/standard',
  'miniature-poodle': 'poodle/miniature',
  'toy-poodle': 'poodle/toy',
  'standard-poodle': 'poodle/standard',
  
  // Schnauzer group
  'giant-schnauzer': 'schnauzer/giant',
  'miniature-schnauzer': 'schnauzer/miniature',
  'standard-schnauzer': 'schnauzer/giant',
  
  // Pinscher group
  'doberman-pinscher': 'doberman',
  'miniature-pinscher': 'pinscher/miniature',
  
  // Mastiff group
  'mastiff': 'mastiff/english',
  'english-mastiff': 'mastiff/english',
  'bull-mastiff': 'mastiff/bull',
  'tibetan-mastiff': 'mastiff/tibetan',
  'neapolitan-mastiff': 'mastiff/english',
  
  // Great Dane
  'great-dane': 'dane/great',
  
  // Rottweiler
  'rottweiler': 'rottweiler',
  
  // St. Bernard
  'saint-bernard': 'stbernard',
  'st-bernard': 'stbernard',
  
  // Newfoundland
  'newfoundland': 'newfoundland',
  
  // Great Pyrenees
  'great-pyrenees': 'pyrenees',
  
  // Malamute
  'alaskan-malamute': 'malamute',
  
  // Husky group
  'siberian-husky': 'husky',
  'alaskan-husky': 'husky',
  
  // Samoyed
  'samoyed': 'samoyed',
  
  // Chow Chow
  'chow-chow': 'chow',
  
  // Akita
  'akita-inu': 'akita',
  
  // Shiba Inu
  'shiba-inu': 'shiba',
  
  // Dalmatian
  'dalmatian': 'dalmatian',
  
  // Weimaraner
  'weimaraner': 'weimaraner',
  
  // Vizsla
  'vizsla': 'vizsla',
  
  // Keeshond
  'keeshond': 'keeshond',
  
  // Norwegian Elkhound
  'norwegian-elkhound': 'elkhound/norwegian',
  
  // Bichon group
  'bichon-frise': 'frise/bichon',
  
  // Maltese
  'maltese': 'maltese',
  
  // Havanese
  'havanese': 'havanese',
  
  // Shih Tzu
  'shih-tzu': 'shihtzu',
  'shihtzu': 'shihtzu',
  
  // Lhasa Apso
  'lhasa-apso': 'lhasa',
  
  // Pug
  'pug': 'pug',
  
  // Chihuahua
  'chihuahua': 'chihuahua',
  
  // Pomeranian
  'pomeranian': 'pomeranian',
  
  // Papillon
  'papillon': 'papillon',
  
  // Pekingese
  'pekingese': 'pekinese',
  
  // Japanese Chin
  'japanese-chin': 'shihtzu',
  
  // Toy Manchester Terrier
  'toy-manchester-terrier': 'terrier/toy',
  
  // Brussels Griffon
  'brussels-griffon': 'griffon/brussels',
  'affenpinscher': 'affenpinscher',
  
  // Dingo
  'dingo': 'dingo',
  
  // Basenji
  'african-basenji': 'basenji',
  
  // Kuvasz
  'kuvasz': 'kuvasz',
  
  // Komondor
  'komondor': 'komondor',
  
  // Puli
  'puli': 'puli',
  
  // Belgian breeds
  'belgian-malinois': 'malinois',
  'belgian-tervuren': 'tervuren',
  'groenendael': 'groenendael',
  
  // Bouvier
  'bouvier-des-flandres': 'bouvier',
  
  // Briard
  'briard': 'briard',
  
  // Bearded Collie
  'bearded-collie': 'collie/border',
  
  // Australian Kelpie
  'australian-kelpie': 'kelpie',
  
  // Leonberger
  'leonberger': 'leonberg',
  
  // Chinese breeds
  'chinese-crested': 'mix',
  'chinese-shar-pei': 'mix',
  
  // Mexican Hairless
  'xoloitzcuintli': 'mix',
  
  // Eskimo
  'american-eskimo-dog': 'eskimo',
  
  // Puggle (Mix)
  'puggle': 'puggle',
  
  // Brabancon
  'brabancon': 'brabancon',
  
  // Schipperke
  'schipperke': 'schipperke',
  
  // Norwegian Buhund
  'norwegian-buhund': 'mix',
  
  // Finnish Spitz
  'finnish-spitz': 'mix',
  
  // Spanish Water Dog
  'spanish-water-dog': 'waterdog/spanish',
  
  // Portuguese Water Dog
  'portuguese-water-dog': 'waterdog/spanish',
  
  // Irish Water Spaniel
  'irish-water-spaniel': 'spaniel/irish',
  
  // Catahoula
  'catahoula-leopard-dog': 'mix',
  
  // Carolina Dog
  'carolina-dog': 'mix',
  
  // Canaan Dog
  'canaan-dog': 'mix',
  
  // Default fallback
  'mix': 'mix',
};

/**
 * Normalize breed name to lowercase with hyphens
 */
export const normalizeBreedName = (name) => {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/_+/g, '-')
    .replace(/--+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '');
};

/**
 * Convert breed name to Dog CEO API format
 */
export const toDogCeoFormat = (breedName) => {
  const normalized = normalizeBreedName(breedName);
  
  // Check if we have a direct mapping
  if (breedApiMapping[normalized]) {
    return breedApiMapping[normalized];
  }
  
  // Try to construct the API name automatically
  // Default: reverse the name for sub-breeds (e.g., "shepherd-german" -> "shepherd/german")
  const parts = normalized.split('-');
  
  if (parts.length >= 2) {
    // Try common patterns
    const lastWord = parts[parts.length - 1];
    const firstWords = parts.slice(0, -1).join('-');
    
    // Check if it's a known sub-breed pattern
    const subBreedPatterns = [
      'hound', 'terrier', 'shepherd', 'retriever', 'spaniel', 
      'setter', 'pointer', 'bulldog', 'schnauzer', 'mastiff',
      'collie', 'sheepdog', 'mountain', 'corgi', 'poodle'
    ];
    
    if (subBreedPatterns.includes(lastWord)) {
      return `${lastWord}/${firstWords}`;
    }
    
    if (subBreedPatterns.includes(firstWords)) {
      return `${firstWords}/${lastWord}`;
    }
  }
  
  // Fallback: return as-is
  return normalized;
};

/**
 * Generate placeholder image
 */
export const getPlaceholderImage = (breedName) => {
  const colors = ['6366f1', '8b5cf6', 'a855f7', '06b6d4', '10b981', 'f59e0b', 'ef4444'];
  const colorIndex = (breedName || '').length % colors.length;
  const color = colors[colorIndex];
  const encodedName = encodeURIComponent((breedName || 'Dog').substring(0, 20));
  return `https://via.placeholder.com/400x400/${color}/ffffff?text=${encodedName}`;
};

/**
 * Fetch breed image from Dog CEO API
 */
export const fetchBreedImage = async (breedName) => {
  if (!breedName) {
    return getPlaceholderImage('Unknown');
  }

  try {
    const apiBreedName = toDogCeoFormat(breedName);
    const apiUrl = `https://dog.ceo/api/breed/${apiBreedName}/images/random`;
    
    console.log(`Fetching image for "${breedName}" using API: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.status === 'success' && data.message) {
      console.log(`✓ Image loaded for "${breedName}"`);
      return data.message;
    } else {
      console.warn(`⚠ API returned error for "${breedName}":`, data);
      return getPlaceholderImage(breedName);
    }
  } catch (error) {
    console.error(`✗ Error fetching image for "${breedName}":`, error);
    return getPlaceholderImage(breedName);
  }
};

/**
 * Fetch multiple breed images from Dog CEO API
 */
export const fetchBreedImages = async (breedName, count = 12) => {
  if (!breedName) {
    return [];
  }

  try {
    const apiBreedName = toDogCeoFormat(breedName);
    const apiUrl = `https://dog.ceo/api/breed/${apiBreedName}/images/random/${count}`;
    
    console.log(`Fetching ${count} images for "${breedName}" using API: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.status === 'success' && data.message) {
      console.log(`✓ ${data.message.length} images loaded for "${breedName}"`);
      return data.message;
    } else {
      console.warn(`⚠ API returned error for "${breedName}":`, data);
      return [];
    }
  } catch (error) {
    console.error(`✗ Error fetching images for "${breedName}":`, error);
    return [];
  }
};

/**
 * Get all available breeds from Dog CEO API
 */
export const getAllDogCeoBreeds = async () => {
  try {
    const response = await fetch('https://dog.ceo/api/breeds/list/all');
    const data = await response.json();
    
    if (data.status === 'success') {
      return data.message;
    }
    return {};
  } catch (error) {
    console.error('Error fetching breed list:', error);
    return {};
  }
};