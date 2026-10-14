import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, PenLine, LogOut, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeMenu();
  };

  const navLinkClass = ({ isActive }) =>
    `transition-colors duration-200 ${
      isActive
        ? "text-black font-semibold"
        : "text-neutral-500 hover:text-black"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        {/* Logo */}
        <Link
          to="/"
          onClick={closeMenu}
          className="text-xl font-bold tracking-tight"
        >
          Blog<span className="text-neutral-400">Sphere</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-7 md:flex">
          <NavLink to="/" className={navLinkClass}>
            Home
          </NavLink>

          <NavLink to="/explore" className={navLinkClass}>
            Explore
          </NavLink>

          {isAuthenticated && (
            <NavLink to="/create" className={navLinkClass}>
              Write
            </NavLink>
          )}
          {isAuthenticated && (<NotificationBell/>)}
        </div>
        
        {/* Desktop Auth */}
        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition hover:bg-neutral-100"
              >
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-neutral-900 text-white">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User size={16} />
                  )}
                </div>

                <span className="max-w-24 truncate">{user?.name}</span>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium transition hover:bg-neutral-100"
              >
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full px-4 py-2 text-sm font-medium transition hover:bg-neutral-100"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 md:hidden">
        
        <button
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="rounded-lg p-2 transition hover:bg-neutral-100 md:hidden"
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        {isAuthenticated && <NotificationBell/>}
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-neutral-200 bg-white md:hidden"
          >
            <div className="flex flex-col gap-2 px-5 py-5">
              <NavLink to="/" onClick={closeMenu} className={navLinkClass}>
                Home
              </NavLink>

              <NavLink
                to="/explore"
                onClick={closeMenu}
                className={navLinkClass}
              >
                Explore
              </NavLink>

              {isAuthenticated ? (
                <>
                  <NavLink
                    to="/create"
                    onClick={closeMenu}
                    className={navLinkClass}
                  >
                    Write
                  </NavLink>
                  
                  <NavLink
                    to="/profile"
                    onClick={closeMenu}
                    className={navLinkClass}
                  >
                    Profile
                  </NavLink>
                  
                  <button
                    onClick={handleLogout}
                    className="mt-2 flex items-center gap-2 border-t border-neutral-200 pt-4 text-left text-red-500"
                  >
                    <LogOut size={17} />
                    Logout
                  </button>
                </>
              ) : (
                <div className="mt-3 flex flex-col gap-2 border-t border-neutral-200 pt-4">
                  <Link
                    to="/login"
                    onClick={closeMenu}
                    className="rounded-lg px-3 py-2 font-medium hover:bg-neutral-100"
                  >
                    Login
                  </Link>

                  <Link
                    to="/register"
                    onClick={closeMenu}
                    className="rounded-lg bg-black px-3 py-2 text-center font-medium text-white"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
