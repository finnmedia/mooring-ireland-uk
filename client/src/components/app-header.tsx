import { Search, Anchor, UserCircle, Map, Grid, Menu, X, Settings, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import SearchDropdown from "./search-dropdown";
import type { MooringLocation } from "@shared/schema";

interface AppHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode?: 'map' | 'grid';
  onViewModeChange?: (mode: 'map' | 'grid') => void;
  onShowMobileFilter?: () => void;
  locations?: MooringLocation[];
  onLocationSelect?: (location: MooringLocation) => void;
}

export default function AppHeader({ 
  searchQuery, 
  onSearchChange, 
  viewMode = 'map', 
  onViewModeChange,
  onShowMobileFilter,
  locations = [],
  onLocationSelect
}: AppHeaderProps) {
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const { user, isAuthenticated } = useAuth();

  return (
    <header className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <Anchor className="text-blue-600 text-xl sm:text-2xl flex-shrink-0" />
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 hidden md:block">Mooring Ireland & UK</h1>
            <h1 className="text-base sm:text-lg font-bold text-gray-900 md:hidden">Mooring</h1>
          </div>
          
          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <Input
                type="text"
                placeholder="Search harbours, marinas, locations..."
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  setShowSearchDropdown(true);
                }}
                onFocus={() => setShowSearchDropdown(true)}
                className="w-full pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              
              {onLocationSelect && (
                <SearchDropdown
                  searchQuery={searchQuery}
                  locations={locations}
                  onLocationSelect={onLocationSelect}
                  isVisible={showSearchDropdown}
                  onClose={() => setShowSearchDropdown(false)}
                />
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Mobile Search Button */}
            <Button
              variant="ghost"
              size="sm"
              className="p-2 md:hidden"
              onClick={() => setShowMobileSearch(!showMobileSearch)}
            >
              <Search className="h-5 w-5" />
            </Button>
            
            {/* View Mode Toggle - Mobile */}
            {onViewModeChange && (
              <div className="flex sm:hidden">
                <Button
                  variant={viewMode === 'map' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onViewModeChange('map')}
                  className="h-8 px-2"
                >
                  <Map className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onViewModeChange('grid')}
                  className="h-8 px-2"
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* View Mode Toggle - Desktop */}
            {onViewModeChange && (
              <div className="hidden sm:flex bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'map' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onViewModeChange('map')}
                  className="h-8 px-3"
                >
                  <Map className="h-4 w-4 mr-1" />
                  Map
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onViewModeChange('grid')}
                  className="h-8 px-3"
                >
                  <Grid className="h-4 w-4 mr-1" />
                  List
                </Button>
              </div>
            )}
            
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="p-2 sm:hidden"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* Desktop User Menu */}
            <div className="hidden sm:flex items-center space-x-2">
              {isAuthenticated ? (
                <>
                  {user?.role === "admin" && (
                    <Link href="/admin">
                      <Button variant="ghost" size="sm" className="p-2">
                        <Users className="h-5 w-5" />
                      </Button>
                    </Link>
                  )}
                  <Link href="/profile">
                    <Button variant="ghost" size="sm" className="p-2">
                      <Settings className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-2"
                    onClick={() => window.location.href = '/api/auth/logout'}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm">Login</Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm">Sign Up</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {showMobileSearch && (
          <div className="md:hidden pb-4 border-t">
            <div className="relative mt-4">
              <Input
                type="text"
                placeholder="Search harbours, marinas, locations..."
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  setShowSearchDropdown(true);
                }}
                onFocus={() => setShowSearchDropdown(true)}
                className="w-full pl-10"
                autoFocus
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              
              {onLocationSelect && (
                <SearchDropdown
                  searchQuery={searchQuery}
                  locations={locations}
                  onLocationSelect={(location) => {
                    onLocationSelect(location);
                    setShowMobileSearch(false);
                  }}
                  isVisible={showSearchDropdown}
                  onClose={() => setShowSearchDropdown(false)}
                />
              )}
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="sm:hidden pb-4 border-t">
            <div className="mt-4 space-y-2">
              {onShowMobileFilter && (
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    onShowMobileFilter();
                    setShowMobileMenu(false);
                  }}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              )}
              
              {/* Mobile User Menu */}
              {isAuthenticated ? (
                <>
                  {user?.role === "admin" && (
                    <Link href="/admin">
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Admin Dashboard
                      </Button>
                    </Link>
                  )}
                  <Link href="/profile">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Account Settings
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      window.location.href = '/api/auth/logout';
                      setShowMobileMenu(false);
                    }}
                  >
                    <UserCircle className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <UserCircle className="h-4 w-4 mr-2" />
                      Login
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button
                      className="w-full justify-start"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <UserCircle className="h-4 w-4 mr-2" />
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
