import { NavLink } from "react-router-dom"

function Navbar({ onNavigate, isDesktop }) {
    const baseClasses =
        "px-3 py-2 font-semibold transition rounded-lg"
    const desktopClasses =
        "text-white hover:bg-red-600"
    const mobileClasses =
        "block w-full text-left text-white hover:bg-red-600"

    return (
        <ul className={`flex ${isDesktop ? "space-x-6" : "flex-col space-y-2"}`}>
            <li>
                <NavLink
                    to="/"
                    onClick={onNavigate}
                    className={({ isActive }) =>
                        `${baseClasses} ${isDesktop ? desktopClasses : mobileClasses} ${
                            isActive ? "bg-white text-red-700" : ""
                        }`
                    }
                >
                    Home
                </NavLink>
            </li>
            <li>
                <NavLink
                    to="/announcements"
                    onClick={onNavigate}
                    className={({ isActive }) =>
                        `${baseClasses} ${isDesktop ? desktopClasses : mobileClasses} ${
                            isActive ? "bg-white text-red-700" : ""
                        }`
                    }
                >
                    Announcements
                </NavLink>
            </li>
            <li>
                <NavLink
                    to="/community"
                    onClick={onNavigate}
                    className={({ isActive }) =>
                        `${baseClasses} ${isDesktop ? desktopClasses : mobileClasses} ${
                            isActive ? "bg-white text-red-700" : ""
                        }`
                    }
                >
                    Community
                </NavLink>
            </li>
            <li>
                <NavLink
                    to="/complaints"
                    onClick={onNavigate}
                    className={({ isActive }) =>
                        `${baseClasses} ${isDesktop ? desktopClasses : mobileClasses} ${
                            isActive ? "bg-white text-red-700" : ""
                        }`
                    }
                >
                    Complaints
                </NavLink>
            </li>
            <li>
                <NavLink
                    to="/outpass"
                    onClick={onNavigate}
                    className={({ isActive }) =>
                        `${baseClasses} ${isDesktop ? desktopClasses : mobileClasses} ${
                            isActive ? "bg-white text-red-700" : ""
                        }`
                    }
                >
                    Outpass
                </NavLink>
            </li>
            <li>
                <NavLink
                    to="/food"
                    onClick={onNavigate}
                    className={({ isActive }) =>
                        `${baseClasses} ${isDesktop ? desktopClasses : mobileClasses} ${
                            isActive ? "bg-white text-red-700" : ""
                        }`
                    }
                >
                    Food
                </NavLink>
            </li>
            <li>
                <NavLink
                    to="/profile"
                    onClick={onNavigate}
                    className={({ isActive }) =>
                        `${baseClasses} ${isDesktop ? desktopClasses : mobileClasses} ${
                            isActive ? "bg-white text-red-700" : ""
                        }`
                    }
                >
                    Profile
                </NavLink>
            </li>
        </ul>
    )
}

export default Navbar
