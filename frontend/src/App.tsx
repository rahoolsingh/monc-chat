import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { ChatArea } from "./components/ChatArea";
import { Persona } from "./types";
import { getPersonaById } from "./services/personaService";


function App() {
    const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(
        null
    );
    const [selectedPersona, setSelectedPersonaState] = useState<Persona | null>(
        null
    );
    const [sidebarOpen, setSidebarOpen] = useState(true);



    // Handle persona selection
    const handleSelectPersona = async (personaId: string) => {
        try {
            setSelectedPersonaId(personaId);

            // Fetch persona details
            const persona = await getPersonaById(personaId);
            setSelectedPersonaState(persona);
        } catch (error) {
            console.error("Error selecting persona:", error);
            // Keep the selection but show error in ChatArea
            setSelectedPersonaState(null);
        }
    };

    // Close sidebar when window resizes to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setSidebarOpen(false);
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div className="h-screen flex bg-[#111B21] overflow-hidden">
            <Sidebar
                selectedPersonaId={selectedPersonaId}
                onSelectPersona={handleSelectPersona}
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
            />
            <ChatArea
                persona={selectedPersona}
                personaId={selectedPersonaId}
                onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            />
        </div>
    );
}

export default App;
