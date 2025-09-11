// Holiday Avatar Generation Service
// This handles generating AI images for holiday destinations

class HolidayAvatarService {
    constructor() {
        // API key is now handled securely via Supabase Edge Functions
        this.cache = new Map(); // Cache generated images
    }

    async generateHolidayAvatar(destination, userName = 'the user') {
        // Check cache first
        const cacheKey = `${destination}-${userName}`;
        if (this.cache.has(cacheKey)) {
            console.log('🎯 Using cached image for', destination);
            return this.cache.get(cacheKey);
        }

        console.log('🎨 Generating holiday avatar for', destination);
        
        const prompt = `Create a fun, vibrant cartoon-style illustration of a happy person enjoying their holiday in ${destination}. 
        The person should be smiling and relaxed, wearing appropriate vacation attire for ${destination}. 
        They should be taking a selfie or posing for a vacation photo.
        Include famous landmarks or scenery from ${destination} in the background.
        Style: Cheerful, colorful, vacation vibes, digital art, cartoon illustration, friendly and warm.
        Make the image feel joyful and exciting, capturing the perfect holiday moment.`;

        try {
            const response = await fetch('https://api.openai.com/v1/images/generations', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: "dall-e-3",
                    prompt: prompt,
                    n: 1,
                    size: "1024x1024",
                    quality: "standard",
                    style: "vivid"
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('OpenAI API error:', errorText);
                throw new Error(`OpenAI API error: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.data && data.data[0] && data.data[0].url) {
                const imageUrl = data.data[0].url;
                console.log('✅ Image generated successfully for', destination);
                
                // Cache the result
                this.cache.set(cacheKey, imageUrl);
                
                // Store in localStorage for persistence (with expiry)
                const storageData = {
                    url: imageUrl,
                    timestamp: Date.now(),
                    destination: destination
                };
                localStorage.setItem(`holiday_avatar_${cacheKey}`, JSON.stringify(storageData));
                
                return imageUrl;
            } else {
                throw new Error('No image URL in response');
            }
        } catch (error) {
            console.error('Error generating holiday avatar:', error);
            throw error;
        }
    }

    async displayHolidayAvatar(container, destination, userName = 'the user') {
        // Check localStorage first (persisted cache)
        const cacheKey = `${destination}-${userName}`;
        const stored = localStorage.getItem(`holiday_avatar_${cacheKey}`);
        
        if (stored) {
            try {
                const data = JSON.parse(stored);
                // Check if cached image is less than 7 days old
                if (Date.now() - data.timestamp < 7 * 24 * 60 * 60 * 1000) {
                    console.log('📦 Using stored image for', destination);
                    this.renderImage(container, data.url, destination);
                    return data.url;
                }
            } catch (e) {
                console.log('Invalid cached data, regenerating...');
            }
        }

        // Show loading state
        container.innerHTML = `
            <div style="width: 200px; height: 200px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        border-radius: 12px; display: flex; flex-direction: column; align-items: center; 
                        justify-content: center; color: white; text-align: center;">
                <div style="font-size: 48px; animation: pulse 1.5s infinite;">🏖️</div>
                <div style="margin-top: 10px; font-size: 14px;">Generating your ${destination} adventure...</div>
                <div style="margin-top: 5px;">
                    <div style="width: 100px; height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px; overflow: hidden;">
                        <div style="width: 30%; height: 100%; background: white; animation: loading 1.5s infinite;"></div>
                    </div>
                </div>
            </div>
            <style>
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(400%); }
                }
            </style>
        `;

        try {
            const imageUrl = await this.generateHolidayAvatar(destination, userName);
            this.renderImage(container, imageUrl, destination);
            return imageUrl;
        } catch (error) {
            console.error('Failed to generate avatar:', error);
            // Show fallback
            container.innerHTML = `
                <div style="width: 200px; height: 200px; background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%); 
                            border-radius: 12px; display: flex; flex-direction: column; align-items: center; 
                            justify-content: center; color: white; text-align: center; padding: 20px;">
                    <div style="font-size: 64px;">🌴</div>
                    <div style="margin-top: 10px; font-weight: bold; font-size: 18px;">${destination}</div>
                    <div style="margin-top: 5px; font-size: 12px; opacity: 0.9;">Holiday Destination</div>
                </div>
            `;
            return null;
        }
    }

    renderImage(container, imageUrl, destination) {
        container.innerHTML = `
            <div style="position: relative; display: inline-block;">
                <img src="${imageUrl}" 
                     alt="Holiday at ${destination}" 
                     style="width: 200px; height: 200px; object-fit: cover; border-radius: 12px; 
                            box-shadow: 0 4px 20px rgba(0,0,0,0.15); display: block;"
                     onerror="this.onerror=null; this.parentElement.innerHTML='<div style=\\'width:200px;height:200px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:12px;display:flex;align-items:center;justify-content:center;color:white;font-size:48px;\\'>🏝️</div>';">
                <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(0,0,0,0.7), transparent); 
                            border-radius: 0 0 12px 12px; padding: 10px; color: white; text-align: center;">
                    <div style="font-weight: bold; text-shadow: 0 1px 3px rgba(0,0,0,0.5);">📍 ${destination}</div>
                </div>
            </div>
        `;
    }
}

// Create global instance
window.holidayAvatarService = new HolidayAvatarService();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HolidayAvatarService;
}