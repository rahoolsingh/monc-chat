import React, { useState, useEffect } from "react";
import { Search, Sticker, AlertCircle, RefreshCw } from "lucide-react";
import { PersonaItem } from "./PersonaItem";
import { Persona } from "../types";
import { fetchPersonas } from "../services/personaService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faGithub,
    faLinkedin,
    faSquareXTwitter,
} from "@fortawesome/free-brands-svg-icons";
import { faCoffee } from "@fortawesome/free-solid-svg-icons";
import { faMugHot } from "@fortawesome/free-solid-svg-icons/faMugHot";

interface SidebarProps {
    selectedPersonaId: string | null;
    onSelectPersona: (personaId: string) => void;
    isOpen: boolean;
    onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    selectedPersonaId,
    onSelectPersona,
    isOpen,
    onToggle,
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const filters = ["All", "Featured"];

    // Load personas on component mount
    useEffect(() => {
        loadPersonas();
    }, []);

    const loadPersonas = async (forceRefresh: boolean = false) => {
        try {
            setLoading(true);
            setError(null);

            const fetchedPersonas = await fetchPersonas(forceRefresh);
            setPersonas(fetchedPersonas);
        } catch (err) {
            console.error("Error loading personas:", err);
            setError(
                err instanceof Error ? err.message : "Failed to load personas"
            );
        } finally {
            setLoading(false);
        }
    };

    const filteredPersonas = personas.filter((persona) => {
        const matchesSearch =
            persona.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            persona.description
                .toLowerCase()
                .includes(searchQuery.toLowerCase());

        if (activeFilter === "Featured") {
            return matchesSearch && persona.isFeatured;
        }

        return matchesSearch;
    });

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={onToggle}
                />
            )}

            <div
                className={`
        fixed md:static inset-y-0 left-0 z-50 w-80 bg-[#111B21] border-r border-[#2A3942] 
        transform ${
            isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 
        transition-transform duration-300 ease-in-out flex flex-col
      `}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 bg-[#202C33]">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[#ff5e00] rounded-full flex items-center justify-center">
                            <Sticker className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-white font-medium text-lg">
                            Monc Chat
                        </span>
                    </div>
                </div>

                {/* Search */}
                <div className="p-4 bg-[#111B21]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#AEBAC1]" />
                        <input
                            type="text"
                            placeholder="Search user..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#202C33] text-white pl-10 pr-4 py-2 rounded-lg border-none outline-none focus:bg-[#2A3942] transition-colors"
                        />
                    </div>
                </div>

                {/* Filter tabs */}
                <div className="flex border-b border-[#2A3942] bg-[#111B21]">
                    {filters.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`flex-1 py-3 text-sm font-medium transition-colors ${
                                activeFilter === filter
                                    ? "text-[#ff5e00] border-b-2 border-[#ff5e00]"
                                    : "text-[#AEBAC1] hover:text-white"
                            }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>

                {/* Persona list */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center p-8">
                            <RefreshCw className="w-6 h-6 text-[#AEBAC1] animate-spin" />
                            <span className="text-[#AEBAC1] ml-2">
                                Loading chat...
                            </span>
                        </div>
                    ) : error ? (
                        <div className="p-4">
                            <div className="flex items-center text-red-400 mb-2">
                                <AlertCircle className="w-5 h-5 mr-2" />
                                <span className="text-sm">
                                    Failed to load personas
                                </span>
                            </div>
                            <p className="text-[#8696A0] text-xs mb-3">
                                {error}
                            </p>
                            <button
                                onClick={() => loadPersonas(true)}
                                className="text-[#ff5e00] text-sm hover:underline"
                            >
                                Try again
                            </button>
                        </div>
                    ) : filteredPersonas.length === 0 ? (
                        <div className="p-4 text-center">
                            <p className="text-[#8696A0] text-sm">
                                {searchQuery
                                    ? "No personas found"
                                    : "No personas available"}
                            </p>
                        </div>
                    ) : (
                        filteredPersonas.map((persona) => (
                            <PersonaItem
                                key={persona.id}
                                persona={persona}
                                isSelected={selectedPersonaId === persona.id}
                                onClick={() => {
                                    onSelectPersona(persona.id);
                                    // Close sidebar on mobile after selection
                                    if (window.innerWidth < 768) {
                                        onToggle();
                                    }
                                }}
                            />
                        ))
                    )}
                </div>

                {/* Get WhatsApp for Mac */}
                <div className="p-4 border-t border-[#2A3942]">
                    <div className="p-3 bg-[#202C33] rounded-lg hover:bg-[#2A3942] transition-colors">
                        <p className="text-[#AEBAC1] text-sm">
                            An AI Persona Based Chat Application
                        </p>
                        <p className="text-[#AEBAC1] text-xs">
                            made with ❤️ by{" "}
                            <a
                                href="https://veerrajpoot.com"
                                target="_blank"
                                className="text-[#ff5e00] font-medium"
                            >
                                Veer Rajpoot
                            </a>
                        </p>
                        <div className="flex text-[#AEBAC1] justify-between items-center mt-2">
                            <a
                                href="https://payments.cashfree.com/forms/veer"
                                target="_blank"
                                className="flex items-center text-[#AEBAC1] mt-2 w-fit group hover:text-[#ff5e00] transition-colors"
                            >
                                <span className=" text-xs mr-1">
                                    Give me a coffee
                                </span>
                                <FontAwesomeIcon
                                    icon={faMugHot}
                                    className="h-4 w-fit text-xs hidden group-hover:inline-block"
                                />
                                <FontAwesomeIcon
                                    icon={faCoffee}
                                    className="h-4 w-fit text-xs inline-block group-hover:hidden"
                                />
                            </a>
                            <span className="flex space-x-2">
                                <a
                                    href="https://www.linkedin.com/in/rahoolsingh/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center hover:text-[#ff5e00] transition-colors"
                                >
                                    <FontAwesomeIcon
                                        icon={faLinkedin}
                                        className="inline-block  text-xs h-4 w-fit"
                                    />
                                </a>
                                <a
                                    href="https://github.com/rahoolsingh"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center hover:text-[#ff5e00] transition-colors"
                                >
                                    <FontAwesomeIcon
                                        icon={faGithub}
                                        className="inline-block  text-xs h-4 w-fit"
                                    />
                                </a>
                                <a
                                    href="https://x.com/cosmonaut_dev"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center hover:text-[#ff5e00] transition-colors"
                                >
                                    <FontAwesomeIcon
                                        icon={faSquareXTwitter}
                                        className="inline-block  text-xs h-4 w-fit"
                                    />
                                </a>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
