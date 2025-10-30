import cloudinary
import cloudinary.uploader
import os
from io import BytesIO

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

def upload_prediction_image(image_bytes: bytes, user_id: str, filename: str) -> dict:
    """
    Upload dog image to Cloudinary
    
    Args:
        image_bytes: Raw image bytes
        user_id: User ID for folder organization
        filename: Original filename
    
    Returns:
        dict with 'url' and 'public_id'
    """
    try:
        # Upload to Cloudinary with automatic optimization
        result = cloudinary.uploader.upload(
            image_bytes,
            folder=f"dog-predictions/{user_id}",
            resource_type="image",
            format="jpg",  # Convert all to JPG
            transformation=[
                {
                    'width': 800,
                    'height': 800,
                    'crop': 'limit',  # Don't upscale, only downscale if larger
                    'quality': 'auto:good',  # Automatic quality optimization
                    'fetch_format': 'auto'  # Serve WebP to supported browsers
                }
            ],
            # Generate thumbnail version
            eager=[
                {
                    'width': 200,
                    'height': 200,
                    'crop': 'fill',
                    'gravity': 'auto',
                    'quality': 'auto:eco'
                }
            ],
            eager_async=False,  # Generate transformations immediately
            tags=['dog-breed-prediction', user_id]
        )
        
        return {
            'url': result['secure_url'],
            'thumbnail_url': result.get('eager', [{}])[0].get('secure_url', result['secure_url']),
            'public_id': result['public_id'],
            'format': result['format'],
            'width': result['width'],
            'height': result['height'],
            'bytes': result['bytes']
        }
        
    except Exception as e:
        print(f"❌ Cloudinary upload failed: {e}")
        raise Exception(f"Failed to upload image: {str(e)}")


def delete_prediction_image(public_id: str) -> bool:
    """
    Delete image from Cloudinary
    
    Args:
        public_id: Cloudinary public ID
    
    Returns:
        bool: Success status
    """
    try:
        result = cloudinary.uploader.destroy(public_id)
        return result.get('result') == 'ok'
    except Exception as e:
        print(f"❌ Cloudinary delete failed: {e}")
        return False


def get_optimized_url(public_id: str, width: int = None, height: int = None) -> str:
    """
    Get optimized image URL with transformations
    
    Args:
        public_id: Cloudinary public ID
        width: Desired width (optional)
        height: Desired height (optional)
    
    Returns:
        str: Optimized image URL
    """
    transformation = {
        'quality': 'auto:good',
        'fetch_format': 'auto'
    }
    
    if width:
        transformation['width'] = width
    if height:
        transformation['height'] = height
        
    if width or height:
        transformation['crop'] = 'fill'
        transformation['gravity'] = 'auto'
    
    url, _ = cloudinary.utils.cloudinary_url(
        public_id,
        transformation=[transformation],
        secure=True
    )
    
    return url