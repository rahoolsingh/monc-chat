import { apiClient, ApiError } from "./api";
import { Persona, PersonasResponse, PersonaResponse } from "../types";

// Cache for personas data
let personasCache: Persona[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Check if cache is valid
const isCacheValid = (): boolean => {
    return (
        personasCache !== null && Date.now() - cacheTimestamp < CACHE_DURATION
    );
};

// Clear personas cache
export const clearPersonasCache = (): void => {
    personasCache = null;
    cacheTimestamp = 0;
};

// Fetch all available personas from the backend

export const fetchPersonas = async (
    forceRefresh: boolean = false
): Promise<Persona[]> => {
    try {
        // Return cached data if valid and not forcing refresh
        if (!forceRefresh && isCacheValid() && personasCache) {
            return personasCache;
        }

        const response: PersonasResponse = await apiClient.get<Persona[]>(
            "/api/personas"
        );

        if (response.success && response.data) {
            // Update cache
            personasCache = response.data;
            cacheTimestamp = Date.now();

            return response.data;
        } else {
            throw new ApiError(
                "PERSONAS_FETCH_FAILED",
                "Failed to fetch personas",
                "Response was not successful"
            );
        }
    } catch (error) {
        console.error("Error fetching personas:", error);

        // Return cached data as fallback if available
        if (personasCache) {
            return personasCache;
        }

        // Re-throw the error if no cache available
        throw error;
    }
};

//  Fetch detailed information for a specific persona
export const fetchPersonaDetails = async (
    personaId: string
): Promise<Persona> => {
    try {
        const response: PersonaResponse = await apiClient.get<Persona>(
            `/api/personas/${personaId}`
        );

        if (response.success && response.data) {
            return response.data;
        } else {
            throw new ApiError(
                "PERSONA_DETAILS_FETCH_FAILED",
                "Failed to fetch persona details",
                "Response was not successful"
            );
        }
    } catch (error) {
        console.error(
            `Error fetching persona details for ${personaId}:`,
            error
        );
        throw error;
    }
};

//  Check if a persona exists in the cached data

export const isPersonaValid = async (personaId: string): Promise<boolean> => {
    try {
        const personas = await fetchPersonas();
        return personas.some((persona) => persona.id === personaId);
    } catch (error) {
        console.error("Error validating persona:", error);
        return false;
    }
};

// Get persona by ID from cache or API
export const getPersonaById = async (
    personaId: string
): Promise<Persona | null> => {
    try {
        // First try to find in cached personas list
        if (isCacheValid() && personasCache) {
            const persona = personasCache.find((p) => p.id === personaId);
            if (persona) {
                return persona;
            }
        }

        // If not found in cache, fetch from API
        return await fetchPersonaDetails(personaId);
    } catch (error) {
        console.error(`Error getting persona ${personaId}:`, error);
        return null;
    }
};

//  Preload personas data for better UX
export const preloadPersonas = async (): Promise<void> => {
    try {
        await fetchPersonas();
    } catch (error) {
        console.warn("Failed to preload personas:", error);
        // Don't throw error for preloading failure
    }
};
