import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import FarmLogo from "./logo/FarmLogo.png";
import FarmLayoutLogo from "./logo/FarmLayoutLogo.png";
import DashboardLogo from "./logo/DashboardLogo.png";
import BatchLogo from "./logo/BatchLogo.png";
import DiseaseMapLogo from "./logo/DiseaseMapLogo.png";
import SoilMonitorLogo from "./logo/SoilMonitorLogo.png";
import { useFarmSettings } from "../useFarmSettings";

const NAV_ITEMS = [
    { path: "/farm-layout", icon: FarmLayoutLogo, label: "Farm Layout" },// section: "Main" },
    { path: "/dashboard", icon: DashboardLogo, label: "Dashboard" },// section: "Main" },
    { path: "/batch-profiles", icon: BatchLogo, label: "Batch Profiles" }, //section: "Configuration" },
    // { path: "/crop-profiles", icon: "🌱", label: "Crop Profiles", section: "Configuration" },
    { path: "/disease-map", icon: DiseaseMapLogo, label: "Disease Map" }, //section: "Monitoring" },
    { path: "/soil-health", icon: SoilMonitorLogo, label: "Soil Monitor" }, //section: "Monitoring" },

];

export default function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { settings } = useFarmSettings();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate("/login");
        } catch (err) {
            console.error("Logout failed", err);
        }
    };

    const [dynamicLocation, setDynamicLocation] = useState(null);

    const groupedNav = NAV_ITEMS.reduce((acc, item) => {
        if (!acc[item.section]) acc[item.section] = [];
        acc[item.section].push(item);
        return acc;
    }, {});

    useEffect(() => {
        // Auto-geocode the pin if no explicit location string is set
        if (settings && !settings.farm_location && settings.location_lat && settings.location_lng) {
            const fetchLocation = async () => {
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${settings.location_lat}&lon=${settings.location_lng}&format=json`);
                    const data = await res.json();
                    if (data && data.address) {
                        const city = data.address.city || data.address.town || data.address.village || data.address.county || "";
                        const state = data.address.state || "";
                        const country = data.address.country || "";

                        let parts = [];
                        if (city) parts.push(city);
                        if (state && state !== city) parts.push(state);
                        if (country) parts.push(country);

                        if (parts.length > 0) {
                            setDynamicLocation(parts.join(', '));
                        }
                    }
                } catch (e) {
                    console.error("Sidebar reverse geocoding failed", e);
                }
            };
            fetchLocation();
        } else if (settings && settings.farm_location) {
            setDynamicLocation(settings.farm_location);
        }
    }, [settings]);

    const displayFarmName = settings?.farm_name || "Ai Farm";
    const displayFarmLocation = dynamicLocation || "Kota Kinabalu · KK-001";

    return (
        <aside className={`fs-sidebar${isCollapsed ? " fs-sidebar--collapsed" : ""}`}>
            <button
                className="fs-sidebar__toggle"
                onClick={() => setIsCollapsed(!isCollapsed)}
                title="Toggle Sidebar"
            >
                {isCollapsed ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 18 6-6-6-6" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="15" y1="18" x2="9" y2="12" />
                        <line x1="9" y1="12" x2="15" y2="6" />
                    </svg>
                )}
            </button>
            <div className="fs-sidebar__brand">
                <div className="fs-sidebar__logo">
                    <img src={FarmLogo} alt="Logo" width="34" height="34" />
                </div>
                <div className="fs-sidebar__name"><span>Ai</span> Farm</div>
            </div>
            <div className="fs-sidebar__farm">
                <div className="fs-sidebar__farm-label">{displayFarmName}</div>
                <div className="fs-sidebar__farm-name">{displayFarmLocation}</div>
            </div>
            <nav className="fs-sidebar__nav">
                {Object.entries(groupedNav).map(([section, items]) => (
                    <div key={section}>
                        <div className="fs-sidebar__section-label">Menu</div>
                        {items.map(item => (
                            <Link key={item.path} to={item.path} className={`fs-nav-item${location.pathname === item.path ? " fs-nav-item--active" : ""}`} title={isCollapsed ? item.label : ""}>
                                <span className="fs-nav-item__icon">
                                    <img src={item.icon} alt="" width="24" height="24" />
                                </span>
                                <span className="fs-nav-item__label">{item.label}</span>
                            </Link>
                        ))}
                    </div>
                ))}
            </nav>
            <button className="fs-nav-item fs-sidebar__logout" onClick={handleLogout}>
                <span className="fs-nav-item__icon">🚪</span>
                <span className="fs-nav-item__label">Logout</span>
            </button>
            <div className="fs-sidebar__footer">
                <div className="fs-sidebar__avatar">JD</div>
                <div>
                    <div className="fs-sidebar__user-name">John Doe</div>
                    <div className="fs-sidebar__user-role">Farm Manager</div>
                </div>
            </div>
        </aside>
    );
}