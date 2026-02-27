import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function searchPlaces(
  query: string,
  location: { latitude: number; longitude: number } | null
) {
  try {
    const config: any = {
      tools: [{ googleMaps: {} }],
    };

    if (location) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
        },
      };
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a helpful local guide for someone visiting Bangalore for the first time. 
      The user is looking for: ${query}. 
      If the user's location is provided, find places near them. If not, suggest popular and safe areas in Bangalore for newcomers.
      Provide a list of specific places with a brief description, why it's good for a newcomer, and estimated cost if possible.
      Keep the tone welcoming and informative.`,
      config,
    });

    const text = response.text;
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    let places = [];
    if (chunks) {
      places = chunks
        .filter((chunk: any) => chunk.web?.uri || chunk.maps?.uri)
        .map((chunk: any) => {
          if (chunk.maps) {
            return {
              title: chunk.maps.title || "View on Google Maps",
              uri: chunk.maps.uri,
            };
          } else if (chunk.web) {
            return {
              title: chunk.web.title || "View Website",
              uri: chunk.web.uri,
            };
          }
          return null;
        })
        .filter(Boolean);
    }

    return { text, places };
  } catch (error) {
    console.error("Error fetching places:", error);
    throw new Error("Failed to fetch recommendations. Please try again.");
  }
}
